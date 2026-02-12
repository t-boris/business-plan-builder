// Multi-Business Firestore Data Model Types
// All interfaces are serializable (no methods) for Firestore compatibility.
// Max 2 levels of nesting for Firestore document structure.
// All timestamps are ISO strings (no Date objects).

// --- Business Role & Type Unions ---

export type BusinessRole = "owner" | "editor" | "viewer";

export type BusinessType =
  | "saas"
  | "service"
  | "retail"
  | "restaurant"
  | "event"
  | "manufacturing"
  | "custom";

// --- Business Profile (embedded in Business document) ---

export interface BusinessProfile {
  name: string;
  type: BusinessType;
  industry: string;
  location: string;
  description: string;
  currency: string;
}

// --- Business Document (root: businesses/{businessId}) ---

export interface Business {
  id: string;
  ownerId: string;
  templateId: string;
  templateVersion: number;
  profile: BusinessProfile;
  roles: Record<string, BusinessRole>;
  enabledSections: string[];
  createdAt: string;
  updatedAt: string;
}

// --- Field Schema Types ---

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "percent"
  | "list"
  | "group"
  | "select"
  | "boolean";

export interface FieldSchema {
  type: FieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  children?: Record<string, FieldSchema>;
  itemSchema?: FieldSchema;
}

// --- Section Definition (embedded in BusinessTemplate) ---

export interface SectionDefinition {
  label: string;
  order: number;
  isCore: boolean;
  schema: Record<string, FieldSchema>;
  defaultData: Record<string, unknown>;
}

// --- Business Template (root: templates/{templateId}) ---

export interface BusinessTemplate {
  id: string;
  name: string;
  businessType: BusinessType;
  version: number;
  description: string;
  icon: string;
  sections: Record<string, SectionDefinition>;
  defaultVariables: Record<string, VariableDefinition>;
  createdAt: string;
  updatedAt: string;
}

// --- Variable Types ---

export type VariableType = "input" | "computed";

export type VariableUnit =
  | "currency"
  | "percent"
  | "count"
  | "months"
  | "days"
  | "hours"
  | "ratio";

export interface VariableDefinition {
  id: string;
  label: string;
  type: VariableType;
  category: string;
  unit: VariableUnit;
  value: number;
  defaultValue: number;
  formula?: string;
  dependsOn?: string[];
  dependents?: string[];
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

// --- Business Section (subcollection: businesses/{businessId}/sections/{sectionKey}) ---

export interface BusinessSection {
  sectionKey: string;
  label: string;
  order: number;
  schema: Record<string, FieldSchema>;
  data: Record<string, unknown>;
  updatedAt: string;
}

// --- Business Scenario (subcollection: businesses/{businessId}/scenarios/{scenarioId}) ---

export interface BusinessScenario {
  id: string;
  name: string;
  isDefault: boolean;
  variables: Record<string, VariableDefinition>;
  createdAt: string;
  updatedAt: string;
}

// --- User Profile (root: users/{uid}) ---

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;
}

// --- Invite Types ---

export type InviteStatus = "active" | "revoked";

export interface BusinessInvite {
  id: string;
  businessId: string;
  role: BusinessRole;
  createdBy: string;
  status: InviteStatus;
  createdAt: string;
}
