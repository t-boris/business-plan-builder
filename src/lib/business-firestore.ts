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
} from "@/types";

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
  const q = query(
    collection(db, "businesses"),
    where(`roles.${uid}`, "!=", null)
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

  // 4. Create section documents from template.sections
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
    batch.set(sectionRef, sectionData);
  }

  // 5. Create default scenario from template.defaultVariables
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
  batch.set(scenarioRef, scenarioData);

  // 6. Commit batch
  // Total operations: 1 (business) + sections + 1 (scenario) — well within 500 limit
  await batch.commit();

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
