import type { CalcStep, TamConfig, SamConfig, SomConfig } from '@/types';

/**
 * Compute the product of all steps.
 * - currency/count values are multiplied directly
 * - percentage values are divided by 100 first
 */
export function computeSteps(steps: CalcStep[]): number {
  if (steps.length === 0) return 0;
  let result = 1;
  for (const step of steps) {
    if (step.type === 'percentage') {
      result *= step.value / 100;
    } else {
      result *= step.value;
    }
  }
  return result;
}

/** Returns true if steps are purely percentage filters (to be applied to a parent value) */
export function isPureFilter(steps: CalcStep[]): boolean {
  return steps.length > 0 && steps.every((s) => s.type === 'percentage');
}

export function computeTam(tam: TamConfig): number {
  return computeSteps(tam.steps);
}

export function computeSam(tam: TamConfig, sam: SamConfig): number {
  if (sam.steps.length === 0) return 0;
  // Standalone bottom-up calculation (has count/currency steps)
  if (!isPureFilter(sam.steps)) return computeSteps(sam.steps);
  // Percentage filters applied to TAM
  const tamValue = computeTam(tam);
  if (tamValue === 0) return 0;
  return tamValue * computeSteps(sam.steps);
}

export function computeSom(tam: TamConfig, sam: SamConfig, som: SomConfig): number {
  if (som.steps.length === 0) return 0;
  // Standalone bottom-up calculation (has count/currency steps)
  if (!isPureFilter(som.steps)) return computeSteps(som.steps);
  // Percentage filters applied to SAM
  const samValue = computeSam(tam, sam);
  if (samValue === 0) return 0;
  return samValue * computeSteps(som.steps);
}

/** Returns true if the result of these steps should be treated as currency */
export function isCurrencyResult(steps: CalcStep[]): boolean {
  return steps.some((s) => s.type === 'currency');
}
