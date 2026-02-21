import { Parser } from "expr-eval";
import type { VariableDefinition } from "@/types/business";
import { createLogger } from "@/lib/logger";

const log = createLogger("formula");

const parser = new Parser();

/**
 * Resolve evaluation order using Kahn's algorithm (topological sort).
 * Returns ordered list of computed variable IDs.
 * Throws if circular dependency detected.
 */
export function getEvaluationOrder(
  variables: Record<string, VariableDefinition>
): string[] {
  const computed = Object.values(variables).filter(
    (v) => v.type === "computed"
  );
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  // Initialize in-degree and adjacency list for all computed variables
  for (const v of computed) {
    inDegree[v.id] = 0;
    adj[v.id] = [];
  }

  // Build graph: only edges between computed variables matter for ordering
  for (const v of computed) {
    for (const depId of v.dependsOn ?? []) {
      if (variables[depId]?.type === "computed") {
        inDegree[v.id]++;
        if (!adj[depId]) adj[depId] = [];
        adj[depId].push(v.id);
      }
    }
  }

  // BFS: start with computed variables that have no computed dependencies
  const queue = computed
    .filter((v) => inDegree[v.id] === 0)
    .map((v) => v.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    for (const next of adj[id] ?? []) {
      inDegree[next]--;
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  if (order.length !== computed.length) {
    const missing = computed
      .filter((v) => !order.includes(v.id))
      .map((v) => v.id);
    throw new Error(`Circular dependency detected: ${missing.join(", ")}`);
  }

  return order;
}

/**
 * Evaluate all variables, returning a scope with all variable values.
 * Input variables use their .value field; computed variables are evaluated
 * in topological order using expr-eval.
 *
 * @param extraScope — optional additional scope values (e.g., section-derived metrics).
 *   These are injected as a base layer: input variables override them, and formulas
 *   can reference them even if no matching variable definition exists.
 *
 * On formula error, logs a warning and sets value to 0 (graceful degradation).
 */
export function evaluateVariables(
  variables: Record<string, VariableDefinition>,
  extraScope?: Record<string, number>,
): Record<string, number> {
  const order = getEvaluationOrder(variables);

  // Build initial scope: extra scope as base layer, input variables override
  const scope: Record<string, number> = {};
  if (extraScope) {
    Object.assign(scope, extraScope);
  }
  for (const v of Object.values(variables)) {
    if (v.type === "input") {
      scope[v.id] = v.value;
    }
  }

  // Evaluate computed variables in topological order
  for (const id of order) {
    const v = variables[id];
    if (v.formula) {
      try {
        scope[id] = parser.evaluate(v.formula, scope);
      } catch (e) {
        log.warn("evaluation.error", {
          id,
          formula: v.formula,
          error: e instanceof Error ? e.message : String(e),
        });
        scope[id] = 0;
      }
    }
  }

  return scope;
}

/**
 * Validate a formula string against available variables.
 * Checks that the formula parses and that all variable references exist.
 */
export function validateFormula(
  formula: string,
  availableVariables: string[]
): { valid: boolean; error?: string } {
  try {
    const expr = parser.parse(formula);

    // Build a test scope where all available variables are set to 1
    const testScope: Record<string, number> = {};
    for (const v of availableVariables) {
      testScope[v] = 1;
    }

    // Evaluate with the test scope to check all references exist
    expr.evaluate(testScope);

    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
