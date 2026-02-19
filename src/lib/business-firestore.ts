// Business Firestore Service Layer
// All multi-business Firestore operations: CRUD, templates, sections, scenarios, roles.
// Does NOT modify or replace the legacy `firestore.ts` — both coexist until Phase 3 migration.

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  getDocs,
  updateDoc,
  deleteField,
  collection,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase.ts";
import type {
  Business,
  BusinessProfile,
  BusinessTemplate,
  BusinessSection,
  BusinessScenario,
  BusinessRole,
  BusinessInvite,
  DynamicScenario,
  VariableDefinition,
} from "@/types";
import { normalizeScenario } from "@/types";
import { withRetry } from "@/lib/retry";
import { createLogger } from "@/lib/logger";

const log = createLogger('business-firestore');

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function stripUndefinedDeep(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedDeep(item))
      .filter((item) => item !== undefined);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      const cleaned = stripUndefinedDeep(nested);
      if (cleaned !== undefined) {
        out[key] = cleaned;
      }
    }
    return out;
  }
  return value;
}

// =============================================================================
// Business CRUD
// =============================================================================

// Firestore path: businesses/{businessId}

/**
 * Create a new business document with an auto-generated ID.
 * Returns the generated business ID.
 */
export async function createBusiness(
  business: Omit<Business, "id">
): Promise<string> {
  const colRef = collection(db, "businesses");
  const docRef = await addDoc(colRef, business);
  return docRef.id;
}

/**
 * Get a single business by ID.
 */
export async function getBusiness(
  businessId: string
): Promise<Business | null> {
  // Firestore path: businesses/{businessId}
  const snap = await getDoc(doc(db, "businesses", businessId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Business;
}

/**
 * Update business fields (partial merge update).
 * Automatically sets updatedAt to the current ISO timestamp.
 */
export async function updateBusiness(
  businessId: string,
  data: Partial<Business>
): Promise<void> {
  // Firestore path: businesses/{businessId}
  await setDoc(
    doc(db, "businesses", businessId),
    { ...data, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

/**
 * Delete a business document.
 * NOTE: Firestore does not cascade-delete subcollections.
 * Sections and scenarios under this business must be deleted separately
 * (or via a Cloud Function in the future).
 */
export async function deleteBusiness(businessId: string): Promise<void> {
  // Firestore path: businesses/{businessId}
  await deleteDoc(doc(db, "businesses", businessId));
}

/**
 * Get all businesses where the user has a role.
 * Returns array sorted by updatedAt descending (most recent first).
 */
export async function getUserBusinesses(uid: string): Promise<Business[]> {
  // Firestore path: businesses (filtered by roles.{uid})
  // Must use "in" with exact role values so Firestore can prove the query
  // results satisfy the security rule: resource.data.roles[uid] in ['owner','editor','viewer']
  const q = query(
    collection(db, "businesses"),
    where(`roles.${uid}`, "in", ["owner", "editor", "viewer"])
  );
  const snap = await getDocs(q);
  const businesses = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Business
  );
  // Sort by updatedAt descending (most recent first)
  businesses.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return businesses;
}

// =============================================================================
// Templates
// =============================================================================

// Firestore path: templates/{templateId}

/**
 * Get a single template by ID.
 */
export async function getTemplate(
  templateId: string
): Promise<BusinessTemplate | null> {
  // Firestore path: templates/{templateId}
  const snap = await getDoc(doc(db, "templates", templateId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BusinessTemplate;
}

/**
 * List all available templates, sorted by name.
 */
export async function listTemplates(): Promise<BusinessTemplate[]> {
  // Firestore path: templates
  const q = query(collection(db, "templates"), orderBy("name"));
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as BusinessTemplate
  );
}

// =============================================================================
// Business Creation from Template (batch write)
// =============================================================================

/**
 * Create a new business from a template using a batch write.
 *
 * Steps:
 * 1. Read template document
 * 2. Create business document with auto-generated ID
 * 3. Create section documents from template.sections
 * 4. Create default scenario from template.defaultVariables
 * 5. Commit batch
 * 6. Return business ID
 *
 * Uses writeBatch (not runTransaction) since we're only writing new documents.
 * All operations counted before commit (max 500 per batch).
 */
export async function createBusinessFromTemplate(
  templateId: string,
  userId: string,
  businessName: string,
  profile: Partial<BusinessProfile>
): Promise<string> {
  // 1. Read template
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // 2. Prepare batch
  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 3. Create business document with auto-generated ID
  // Firestore path: businesses/{businessId}
  const businessRef = doc(collection(db, "businesses"));
  const businessId = businessRef.id;

  const businessData: Omit<Business, "id"> = {
    ownerId: userId,
    templateId: template.id,
    templateVersion: template.version,
    roles: { [userId]: "owner" },
    enabledSections: Object.keys(template.sections),
    profile: {
      name: businessName,
      type: template.businessType,
      industry: "",
      location: "",
      description: "",
      currency: "USD",
      ...profile,
    },
    createdAt: now,
    updatedAt: now,
  };

  batch.set(businessRef, businessData);

  // 4. Commit business document first — Firestore security rules for
  //    subcollections use get() to read the parent business roles, and get()
  //    only sees committed data, not pending writes in the same batch.
  await batch.commit();

  // 5. Create section documents + default scenario in a second batch
  const batch2 = writeBatch(db);

  const sectionEntries = Object.entries(template.sections);
  for (const [sectionKey, sectionDef] of sectionEntries) {
    // Firestore path: businesses/{businessId}/sections/{sectionKey}
    const sectionRef = doc(
      db,
      "businesses",
      businessId,
      "sections",
      sectionKey
    );
    const sectionData: Omit<BusinessSection, "sectionKey"> & {
      sectionKey: string;
    } = {
      sectionKey,
      label: sectionDef.label,
      order: sectionDef.order,
      schema: sectionDef.schema,
      data: sectionDef.defaultData,
      updatedAt: now,
    };
    batch2.set(sectionRef, sectionData);
  }

  // Firestore path: businesses/{businessId}/scenarios/{scenarioId}
  const scenarioRef = doc(
    collection(db, "businesses", businessId, "scenarios")
  );
  const scenarioData: Omit<BusinessScenario, "id"> = {
    name: "Base Case",
    isDefault: true,
    variables: template.defaultVariables,
    createdAt: now,
    updatedAt: now,
  };
  batch2.set(scenarioRef, scenarioData);

  // 6. Commit subcollections
  await batch2.commit();

  // 7. Return business ID
  return businessId;
}

// =============================================================================
// Business-Scoped Sections
// =============================================================================

// Firestore path: businesses/{businessId}/sections/{sectionKey}

/**
 * Get a section from a business.
 */
export async function getBusinessSection(
  businessId: string,
  sectionKey: string
): Promise<BusinessSection | null> {
  // Firestore path: businesses/{businessId}/sections/{sectionKey}
  const snap = await getDoc(
    doc(db, "businesses", businessId, "sections", sectionKey)
  );
  if (!snap.exists()) return null;
  return snap.data() as BusinessSection;
}

/**
 * Save a section to a business (merge update).
 */
export async function saveBusinessSection(
  businessId: string,
  sectionKey: string,
  data: Partial<BusinessSection>
): Promise<void> {
  // Firestore path: businesses/{businessId}/sections/{sectionKey}
  await setDoc(
    doc(db, "businesses", businessId, "sections", sectionKey),
    { ...data, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

/**
 * List all sections for a business, sorted by order.
 */
export async function listBusinessSections(
  businessId: string
): Promise<BusinessSection[]> {
  // Firestore path: businesses/{businessId}/sections
  const snap = await getDocs(
    collection(db, "businesses", businessId, "sections")
  );
  const sections = snap.docs.map((d) => d.data() as BusinessSection);
  sections.sort((a, b) => a.order - b.order);
  return sections;
}

// =============================================================================
// Business-Scoped Scenarios
// =============================================================================

// Firestore path: businesses/{businessId}/scenarios/{scenarioId}

/**
 * Get a scenario from a business.
 */
export async function getBusinessScenario(
  businessId: string,
  scenarioId: string
): Promise<BusinessScenario | null> {
  // Firestore path: businesses/{businessId}/scenarios/{scenarioId}
  const snap = await getDoc(
    doc(db, "businesses", businessId, "scenarios", scenarioId)
  );
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BusinessScenario;
}

/**
 * Save a scenario to a business (merge update).
 */
export async function saveBusinessScenario(
  businessId: string,
  scenario: BusinessScenario
): Promise<void> {
  // Firestore path: businesses/{businessId}/scenarios/{scenarioId}
  await setDoc(
    doc(db, "businesses", businessId, "scenarios", scenario.id),
    scenario,
    { merge: true }
  );
}

/**
 * List all scenarios for a business.
 */
export async function listBusinessScenarios(
  businessId: string
): Promise<BusinessScenario[]> {
  // Firestore path: businesses/{businessId}/scenarios
  const snap = await getDocs(
    collection(db, "businesses", businessId, "scenarios")
  );
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as BusinessScenario
  );
}

/**
 * Delete a scenario from a business.
 */
export async function deleteBusinessScenario(
  businessId: string,
  scenarioId: string
): Promise<void> {
  // Firestore path: businesses/{businessId}/scenarios/{scenarioId}
  await deleteDoc(
    doc(db, "businesses", businessId, "scenarios", scenarioId)
  );
}

// =============================================================================
// Share / Role Management
// =============================================================================

/**
 * Add a user role to a business.
 * Uses dot notation to set a single field in the roles map.
 */
export async function addBusinessRole(
  businessId: string,
  uid: string,
  role: BusinessRole
): Promise<void> {
  // Firestore path: businesses/{businessId}
  await updateDoc(doc(db, "businesses", businessId), {
    [`roles.${uid}`]: role,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Remove a user role from a business.
 * Uses deleteField() to remove the user's entry from the roles map.
 */
export async function removeBusinessRole(
  businessId: string,
  uid: string
): Promise<void> {
  // Firestore path: businesses/{businessId}
  await updateDoc(doc(db, "businesses", businessId), {
    [`roles.${uid}`]: deleteField(),
    updatedAt: new Date().toISOString(),
  });
}

// =============================================================================
// Invites
// =============================================================================

// Firestore path: invites/{inviteId}

/**
 * Create a reusable invite link for a business.
 * The invite document ID is the share token (UUID v4).
 * Returns the invite ID (which IS the URL token).
 */
export async function createInvite(
  businessId: string,
  role: BusinessRole,
  createdBy: string
): Promise<string> {
  const inviteId = crypto.randomUUID();
  await setDoc(doc(db, "invites", inviteId), {
    businessId,
    role,
    createdBy,
    status: "active",
    createdAt: new Date().toISOString(),
  });
  return inviteId;
}

/**
 * Get an invite by ID (the share token).
 */
export async function getInvite(
  inviteId: string
): Promise<BusinessInvite | null> {
  const snap = await getDoc(doc(db, "invites", inviteId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BusinessInvite;
}

/**
 * List active invites for a business (for the owner's share panel).
 * Requires composite index: invites (businessId ASC, status ASC).
 */
export async function listBusinessInvites(
  businessId: string
): Promise<BusinessInvite[]> {
  const q = query(
    collection(db, "invites"),
    where("businessId", "==", businessId),
    where("status", "==", "active")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BusinessInvite);
}

/**
 * Revoke an invite (sets status to 'revoked').
 */
export async function revokeInvite(inviteId: string): Promise<void> {
  await updateDoc(doc(db, "invites", inviteId), {
    status: "revoked",
  });
}

/**
 * Delete an invite document entirely.
 */
export async function deleteInvite(inviteId: string): Promise<void> {
  await deleteDoc(doc(db, "invites", inviteId));
}

/**
 * Accept an invite — add the accepting user to the business roles map.
 * Uses _acceptingInviteId for security rule verification via get().
 * The invite stays 'active' (reusable link pattern).
 */
export async function acceptInvite(
  inviteId: string,
  businessId: string,
  role: BusinessRole,
  uid: string
): Promise<void> {
  await updateDoc(doc(db, "businesses", businessId), {
    [`roles.${uid}`]: role,
    updatedAt: new Date().toISOString(),
    _acceptingInviteId: inviteId,
  });
}

// =============================================================================
// Section Data (raw format for useSection hook)
// =============================================================================

// Stores raw section data directly at businesses/{businessId}/sections/{sectionKey}
// Phase 5 will migrate to full BusinessSection format with schema/order/label wrapper.

/**
 * Get raw section data for the useSection hook.
 */
export async function getSectionData<T>(
  businessId: string,
  sectionKey: string
): Promise<T | null> {
  // Firestore path: businesses/{businessId}/sections/{sectionKey}
  const snap = await getDoc(
    doc(db, "businesses", businessId, "sections", sectionKey)
  );
  if (!snap.exists()) return null;
  return snap.data() as T;
}

/**
 * Save raw section data for the useSection hook (merge update).
 */
export async function saveSectionData(
  businessId: string,
  sectionKey: string,
  data: object
): Promise<void> {
  // Firestore path: businesses/{businessId}/sections/{sectionKey}
  const cleanedData = stripUndefinedDeep(data) as Record<string, unknown>;
  await setDoc(
    doc(db, "businesses", businessId, "sections", sectionKey),
    { ...cleanedData, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

// =============================================================================
// Scenario Data (DynamicScenario type for useScenarioSync)
// =============================================================================

// Uses DynamicScenario type at businesses/{businessId}/scenarios/{scenarioId}
// Scenarios stored as { metadata, values: Record<string, number> }.

/**
 * Get a scenario by ID using the DynamicScenario type.
 * Normalizes loaded data through normalizeScenario to ensure v2 defaults.
 */
export async function getScenarioData(
  businessId: string,
  scenarioId: string
): Promise<DynamicScenario | null> {
  // Firestore path: businesses/{businessId}/scenarios/{scenarioId}
  const snap = await getDoc(
    doc(db, "businesses", businessId, "scenarios", scenarioId)
  );
  if (!snap.exists()) return null;
  return normalizeScenario(snap.data());
}

/**
 * Save a scenario using the DynamicScenario type (merge update).
 * Persists all v2 fields. Old documents gain new fields on next save via merge: true.
 */
export async function saveScenarioData(
  businessId: string,
  scenario: DynamicScenario
): Promise<void> {
  // Firestore path: businesses/{businessId}/scenarios/{scenarioId}
  await withRetry(() =>
    setDoc(
      doc(db, "businesses", businessId, "scenarios", scenario.metadata.id),
      scenario,
      { merge: true }
    )
  );
}

/**
 * List all scenarios for a business using the DynamicScenario type.
 * Each scenario is normalized through normalizeScenario for v2 defaults.
 */
export async function listScenarioData(
  businessId: string
): Promise<DynamicScenario[]> {
  // Firestore path: businesses/{businessId}/scenarios
  const snap = await getDocs(
    collection(db, "businesses", businessId, "scenarios")
  );
  return snap.docs.map((d) => normalizeScenario(d.data()));
}

/**
 * Delete a scenario from a business.
 */
export async function deleteScenarioData(
  businessId: string,
  scenarioId: string
): Promise<void> {
  // Firestore path: businesses/{businessId}/scenarios/{scenarioId}
  await deleteDoc(
    doc(db, "businesses", businessId, "scenarios", scenarioId)
  );
}

/**
 * Get scenario preferences (active scenario ID) for a business.
 */
export async function getScenarioPreferences(
  businessId: string
): Promise<{ activeScenarioId: string } | null> {
  // Firestore path: businesses/{businessId}/state/preferences
  const snap = await getDoc(
    doc(db, "businesses", businessId, "state", "preferences")
  );
  if (!snap.exists()) return null;
  return snap.data() as { activeScenarioId: string };
}

/**
 * Save scenario preferences (active scenario ID) for a business.
 */
export async function saveScenarioPreferences(
  businessId: string,
  state: { activeScenarioId: string }
): Promise<void> {
  // Firestore path: businesses/{businessId}/state/preferences
  await setDoc(
    doc(db, "businesses", businessId, "state", "preferences"),
    state,
    { merge: true }
  );
}

// =============================================================================
// Business Variables (state/variables document)
// =============================================================================

// Firestore path: businesses/{businessId}/state/variables
// Document shape: { definitions: Record<string, VariableDefinition> }

/**
 * Get business variable definitions.
 * Returns null if no variables have been saved yet.
 */
export async function getBusinessVariables(
  businessId: string
): Promise<Record<string, VariableDefinition> | null> {
  // Firestore path: businesses/{businessId}/state/variables
  const snap = await getDoc(
    doc(db, "businesses", businessId, "state", "variables")
  );
  if (!snap.exists()) return null;
  return (snap.data()?.definitions as Record<string, VariableDefinition>) ?? null;
}

/**
 * Save business variable definitions (full replace with merge).
 * Stores the entire variable set as one atomic operation.
 */
export async function saveBusinessVariables(
  businessId: string,
  variables: Record<string, VariableDefinition>
): Promise<void> {
  // Firestore path: businesses/{businessId}/state/variables
  await setDoc(
    doc(db, "businesses", businessId, "state", "variables"),
    { definitions: variables },
    { merge: true }
  );
}

// =============================================================================
// Section Variants (subcollection of section documents)
// =============================================================================

// Firestore path: businesses/{businessId}/sections/{sectionSlug}/variants/{variantId}

export interface SectionVariant {
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;  // the full or partial section data snapshot
  createdAt: string;
  scenarioId?: string;  // which scenario created this variant (optional reference)
}

/**
 * Save a section variant (merge update with retry).
 */
export async function saveSectionVariant(
  businessId: string,
  sectionSlug: string,
  variant: SectionVariant
): Promise<void> {
  try {
    await withRetry(() =>
      setDoc(
        doc(db, "businesses", businessId, "sections", sectionSlug, "variants", variant.id),
        variant,
        { merge: true }
      )
    );
  } catch (err) {
    log.error('saveSectionVariant.failed', {
      businessId,
      sectionSlug,
      variantId: variant.id,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Get a section variant by ID.
 */
export async function getSectionVariant(
  businessId: string,
  sectionSlug: string,
  variantId: string
): Promise<SectionVariant | null> {
  try {
    const snap = await getDoc(
      doc(db, "businesses", businessId, "sections", sectionSlug, "variants", variantId)
    );
    if (!snap.exists()) return null;
    return snap.data() as SectionVariant;
  } catch (err) {
    log.error('getSectionVariant.failed', {
      businessId,
      sectionSlug,
      variantId,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * List all variants for a section.
 */
export async function listSectionVariants(
  businessId: string,
  sectionSlug: string
): Promise<SectionVariant[]> {
  try {
    const snap = await getDocs(
      collection(db, "businesses", businessId, "sections", sectionSlug, "variants")
    );
    return snap.docs.map((d) => d.data() as SectionVariant);
  } catch (err) {
    log.error('listSectionVariants.failed', {
      businessId,
      sectionSlug,
      error: (err as Error).message,
    });
    throw err;
  }
}

/**
 * Delete a section variant.
 */
export async function deleteSectionVariant(
  businessId: string,
  sectionSlug: string,
  variantId: string
): Promise<void> {
  try {
    await withRetry(() =>
      deleteDoc(
        doc(db, "businesses", businessId, "sections", sectionSlug, "variants", variantId)
      )
    );
  } catch (err) {
    log.error('deleteSectionVariant.failed', {
      businessId,
      sectionSlug,
      variantId,
      error: (err as Error).message,
    });
    throw err;
  }
}
