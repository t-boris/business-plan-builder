import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase.ts';
import type { SectionSlug, BusinessPlanSection, Scenario } from '@/types';

// --- Section Utilities ---
// Firestore path: plans/{planId}/sections/{sectionSlug}

function sectionRef(planId: string, sectionSlug: SectionSlug) {
  return doc(db, 'plans', planId, 'sections', sectionSlug);
}

export async function getSection<T extends BusinessPlanSection>(
  planId: string,
  sectionSlug: SectionSlug
): Promise<T | null> {
  const snap = await getDoc(sectionRef(planId, sectionSlug));
  if (!snap.exists()) return null;
  return snap.data() as T;
}

export async function saveSection(
  planId: string,
  sectionSlug: SectionSlug,
  data: Partial<BusinessPlanSection>
): Promise<void> {
  await setDoc(sectionRef(planId, sectionSlug), data, { merge: true });
}

export function subscribeToSection<T extends BusinessPlanSection>(
  planId: string,
  sectionSlug: SectionSlug,
  callback: (data: T | null) => void
) {
  return onSnapshot(sectionRef(planId, sectionSlug), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback(snap.data() as T);
  });
}

// --- Scenario Utilities ---
// Firestore path: plans/{planId}/scenarios/{scenarioId}

function scenarioRef(planId: string, scenarioId: string) {
  return doc(db, 'plans', planId, 'scenarios', scenarioId);
}

function scenariosCollectionRef(planId: string) {
  return collection(db, 'plans', planId, 'scenarios');
}

export async function getScenario(
  planId: string,
  scenarioId: string
): Promise<Scenario | null> {
  const snap = await getDoc(scenarioRef(planId, scenarioId));
  if (!snap.exists()) return null;
  return snap.data() as Scenario;
}

export async function saveScenario(
  planId: string,
  scenario: Scenario
): Promise<void> {
  await setDoc(scenarioRef(planId, scenario.metadata.id), scenario, {
    merge: true,
  });
}

export async function listScenarios(planId: string): Promise<Scenario[]> {
  const snap = await getDocs(scenariosCollectionRef(planId));
  return snap.docs.map((d) => d.data() as Scenario);
}

export async function deleteScenario(
  planId: string,
  scenarioId: string
): Promise<void> {
  await deleteDoc(scenarioRef(planId, scenarioId));
}
