// Scenario Types for What-If Engine
// All interfaces are serializable (no methods) for Firestore compatibility.

export interface ScenarioMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  isBaseline: boolean;
}

// Dynamic scenario for Phase 7 generic scenario engine
export interface DynamicScenario {
  metadata: ScenarioMetadata;
  values: Record<string, number>; // only input variable values, keyed by variable ID
}
