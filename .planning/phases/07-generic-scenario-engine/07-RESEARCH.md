# Phase 7: Generic Scenario Engine - Research

**Researched:** 2026-02-11
**Domain:** Jotai dynamic state management for variable-driven financial modeling
**Confidence:** HIGH

<research_summary>
## Summary

Researched how to replace the 10 hardcoded Jotai scenario atoms (priceTier1Atom, monthlyLeadsAtom, etc.) with a dynamic system driven by the variable library built in Phase 6. The core question: should we use atomFamily, atoms-in-atom, or a simpler Record-based pattern?

**Key finding:** atomFamily and per-variable atoms are overkill for this use case. The formula engine already evaluates ALL computed variables on every input change (topological sort), so granular atom reactivity provides no benefit. A single Record atom holding all variable values, with a derived atom computing evaluated results via `evaluateVariables()`, is simpler, easier to snapshot/restore for scenarios, and aligns perfectly with Phase 6's existing architecture.

**Primary recommendation:** Use a single `atom<Record<string, number>>` for scenario variable values, derive computed results via `evaluateVariables()` in a read-only atom, and refactor ScenarioControls/Dashboard/Comparison to read from these dynamic atoms instead of the 10 hardcoded ones. Scenarios save/load just the input variable values.
</research_summary>

<standard_stack>
## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jotai | 2.x | Atomic state management | Already used throughout codebase |
| expr-eval | 2.0.2 | Formula evaluation | Installed in Phase 6, powers formula engine |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | existing | Dashboard charts | Already used in ScenarioDashboard |
| @/components/ui/* | existing | shadcn UI components | Already used for controls |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single Record atom | atomFamily per variable | atomFamily adds complexity, memory management, harder snapshot/restore. Per-variable granularity not needed since formula engine evaluates all at once. |
| Single Record atom | atoms-in-atom pattern | Same overhead as atomFamily. Atoms-in-atom is for isolated updates (e.g., todo lists), not correlated financial variables that cascade. |
| Single Record atom | jotai-family atomTree | Hierarchical structure is elegant but unnecessary. Variables are flat, not tree-shaped. Adds a dependency. |
| useMemo for evaluation | Derived read-only atom | Derived atom is more Jotai-idiomatic and automatically subscribes. useMemo requires manual dependency arrays. |

**No new installations required.** Phase 7 uses existing libraries differently.
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Architecture

The refactored scenario engine has three layers:

```
Layer 1: Variable Definitions (Phase 6 - exists)
  businessVariablesAtom → Record<string, VariableDefinition>
  Loaded from Firestore, includes formulas and defaults

Layer 2: Scenario Values (Phase 7 - new)
  scenarioValuesAtom → Record<string, number>
  Current input values for the active scenario
  Derived: evaluatedValuesAtom → Record<string, number> (all values after formula eval)

Layer 3: UI Components (Phase 7 - refactored)
  DynamicScenarioControls → reads variable definitions, writes to scenarioValuesAtom
  DynamicScenarioDashboard → reads evaluatedValuesAtom, renders KPIs
  ScenarioComparison → loads two scenarios, evaluates each, compares
```

### Pattern 1: Single Record Atom + Derived Evaluation
**What:** Store all current input variable values in one atom. A derived read-only atom runs `evaluateVariables()` to produce all values (input + computed).
**When to use:** When changes cascade through formulas — individual variable atoms don't help because changing one input affects many computed values.
**Example:**
```typescript
// Writable atom: current scenario's input values
export const scenarioValuesAtom = atom<Record<string, number>>({});

// Read-only derived atom: all values after formula evaluation
export const evaluatedValuesAtom = atom((get) => {
  const definitions = get(businessVariablesAtom);
  const inputValues = get(scenarioValuesAtom);
  if (!definitions) return {};

  // Merge input values into definitions
  const merged: Record<string, VariableDefinition> = {};
  for (const [id, def] of Object.entries(definitions)) {
    merged[id] = {
      ...def,
      value: def.type === 'input' ? (inputValues[id] ?? def.value) : def.value,
    };
  }

  try {
    return evaluateVariables(merged);
  } catch {
    // Circular dep — return input values only
    const result: Record<string, number> = {};
    for (const [id, def] of Object.entries(merged)) {
      result[id] = def.value;
    }
    return result;
  }
});
```

### Pattern 2: Scenario Save/Load via Variable Values
**What:** A scenario is defined by its input variable values. Save only input values to Firestore. On load, merge with variable definitions and re-evaluate.
**When to use:** Always — this replaces the hardcoded ScenarioVariables type.
**Example:**
```typescript
// What gets saved to Firestore per scenario
interface DynamicScenario {
  metadata: ScenarioMetadata;
  values: Record<string, number>;  // only input variable values
}

// Load scenario: set input values → evaluation auto-updates
const loadDynamicScenarioAtom = atom<null, [DynamicScenario], void>(
  null,
  (_get, set, scenario) => {
    set(scenarioNameAtom, scenario.metadata.name);
    set(currentScenarioIdAtom, scenario.metadata.id);
    set(scenarioValuesAtom, scenario.values);
  }
);

// Snapshot scenario: read current input values
const snapshotDynamicScenarioAtom = atom((get) => {
  const definitions = get(businessVariablesAtom);
  const allValues = get(scenarioValuesAtom);
  if (!definitions) return {};

  // Only save input variable values (computed are derived)
  const inputValues: Record<string, number> = {};
  for (const [id, def] of Object.entries(definitions)) {
    if (def.type === 'input') {
      inputValues[id] = allValues[id] ?? def.value;
    }
  }
  return inputValues;
});
```

### Pattern 3: Dynamic Controls from Variable Definitions
**What:** Generate input controls from variable definitions instead of hardcoded JSX.
**When to use:** Replacing ScenarioControls with a dynamic version.
**Example:**
```typescript
function DynamicScenarioControls() {
  const variables = useAtomValue(businessVariablesAtom);
  const [values, setValues] = useAtom(scenarioValuesAtom);

  if (!variables) return null;

  // Group input variables by category
  const grouped = groupByCategory(
    Object.values(variables).filter(v => v.type === 'input')
  );

  function handleChange(variableId: string, newValue: number) {
    setValues(prev => ({ ...prev, [variableId]: newValue }));
  }

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([category, vars]) => (
        <Card key={category}>
          <CardHeader><h3>{getCategoryLabel(category)}</h3></CardHeader>
          <CardContent>
            {vars.map(v => (
              <VariableInput
                key={v.id}
                variable={v}
                value={values[v.id] ?? v.value}
                onChange={(val) => handleChange(v.id, val)}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Pattern 4: Dynamic Dashboard from Evaluated Values
**What:** Dashboard reads evaluated values and renders KPI cards for key computed variables.
**When to use:** Replacing ScenarioDashboard.
**Example:**
```typescript
function DynamicScenarioDashboard() {
  const variables = useAtomValue(businessVariablesAtom);
  const evaluated = useAtomValue(evaluatedValuesAtom);

  if (!variables) return null;

  // Show computed variables as KPI cards
  const kpiVariables = Object.values(variables).filter(
    v => v.type === 'computed'
  );

  return (
    <div className="grid grid-cols-2 gap-4">
      {kpiVariables.map(v => (
        <StatCard
          key={v.id}
          label={v.label}
          value={evaluated[v.id] ?? 0}
          unit={v.unit}
        />
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **atomFamily for scenario variables:** Creates per-variable atoms that need manual memory cleanup, makes snapshot/restore complex, and provides no benefit since formula evaluation is holistic.
- **Keeping hardcoded atoms alongside dynamic ones:** Creates dual state paths that drift. Replace completely, don't bridge.
- **Storing computed values in Firestore scenarios:** Computed values are derived from formulas and input values. Storing them wastes space and creates stale data risk. Save only input values.
- **Re-implementing formula evaluation in atoms:** Don't duplicate the expr-eval logic in Jotai derived atoms. Use `evaluateVariables()` as a single source of truth.
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Formula evaluation | Custom atom dependency graph | `evaluateVariables()` from formula-engine.ts | Already handles topological sort, cycle detection, error handling. Building this in atoms would duplicate logic. |
| Variable grouping by category | Custom sort/filter | `VARIABLE_CATEGORIES` from types.ts | Categories with order numbers already defined in Phase 6. |
| Value formatting | Per-component formatting | Shared `formatValue()` helper | Already exists in variable-editor.tsx — extract and share. |
| Scenario persistence | New Firestore structure | Extend existing `saveScenarioData` / `listScenarioData` | Existing Firestore functions handle scenario CRUD. Just change the data shape. |

**Key insight:** Phase 6 already built the computation engine. Phase 7's job is to WIRE it into the UI and scenario system, not rebuild it. The formula engine is the single source of truth for variable evaluation.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Dual State Between Variables and Scenarios
**What goes wrong:** VariableEditor (Phase 6) modifies `businessVariablesAtom` directly, while scenario system uses `scenarioValuesAtom`. Editing a variable's default value in VariableEditor doesn't update the active scenario's value.
**Why it happens:** Two sources of truth for variable values — definition defaults vs scenario overrides.
**How to avoid:** Clear separation: `businessVariablesAtom` holds DEFINITIONS (with defaults). `scenarioValuesAtom` holds the ACTIVE SCENARIO's input values (overrides). When a variable has no override in the scenario, fall back to its definition's default value.
**Warning signs:** Changing a variable default in VariableEditor doesn't reflect in scenario dashboard.

### Pitfall 2: Breaking Existing Scenario Data
**What goes wrong:** Old scenarios stored with `ScenarioVariables` type (10 hardcoded fields) can't load into the new dynamic system.
**Why it happens:** Data format migration not handled.
**How to avoid:** The new system should gracefully handle both old and new scenario formats. On load: if scenario has `priceTier1` etc., ignore (or show empty). If it has `values: Record<string, number>`, use that. Old scenarios become "incompatible" but don't crash.
**Warning signs:** Loading an old scenario throws errors or shows wrong values.

### Pitfall 3: Infinite Re-render Loop
**What goes wrong:** Changing scenarioValuesAtom triggers evaluatedValuesAtom recalculation, which triggers a component that writes back to scenarioValuesAtom.
**Why it happens:** Circular write in derived atom chain.
**How to avoid:** evaluatedValuesAtom is READ-ONLY. Components never write to it. Only user input writes to scenarioValuesAtom. Formula evaluation is a one-way derivation.
**Warning signs:** Browser tab freezes after changing an input.

### Pitfall 4: Scenario Sync Race Condition
**What goes wrong:** Auto-save fires while scenario is still loading, overwriting loaded data with stale values.
**Why it happens:** The existing `scenarioSyncReadyAtom` flag needs to also gate the new dynamic sync.
**How to avoid:** Keep the `scenarioSyncReadyAtom` pattern. Set to false during load, true after all atoms are populated.
**Warning signs:** Loading a scenario shows correct values briefly, then reverts.

### Pitfall 5: Missing Variable Definitions for Scenario Values
**What goes wrong:** A scenario has saved values for variables that no longer exist in the business's variable definitions (user removed a variable after saving the scenario).
**Why it happens:** Variable definitions are mutable; saved scenarios reference deleted variable IDs.
**How to avoid:** On scenario load, only load values for variables that exist in current definitions. Silently skip orphaned values. On save, only save values for current input variables.
**Warning signs:** Console errors about undefined variables during evaluation.
</common_pitfalls>

<code_examples>
## Code Examples

### Initializing Scenario Values from Variable Defaults
```typescript
// When switching to a new scenario or resetting:
function getDefaultScenarioValues(
  variables: Record<string, VariableDefinition>
): Record<string, number> {
  const values: Record<string, number> = {};
  for (const [id, def] of Object.entries(variables)) {
    if (def.type === 'input') {
      values[id] = def.defaultValue;
    }
  }
  return values;
}
```

### Dynamic Comparison Between Two Scenarios
```typescript
// Evaluate two scenarios against the SAME variable definitions
function compareScenarios(
  definitions: Record<string, VariableDefinition>,
  scenarioA: Record<string, number>,
  scenarioB: Record<string, number>
): { a: Record<string, number>; b: Record<string, number> } {
  // Merge each scenario's values into definitions and evaluate
  const mergeAndEval = (values: Record<string, number>) => {
    const merged: Record<string, VariableDefinition> = {};
    for (const [id, def] of Object.entries(definitions)) {
      merged[id] = {
        ...def,
        value: def.type === 'input' ? (values[id] ?? def.value) : def.value,
      };
    }
    return evaluateVariables(merged);
  };

  return {
    a: mergeAndEval(scenarioA),
    b: mergeAndEval(scenarioB),
  };
}
```

### Formatting Variable Values for Display
```typescript
// Shared formatter (extract from variable-editor.tsx)
function formatValue(value: number, unit: VariableUnit): string {
  if (unit === 'currency')
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', maximumFractionDigits: 0
    }).format(value);
  if (unit === 'percent') return `${(value * 100).toFixed(1)}%`;
  if (unit === 'ratio') return value.toFixed(2);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
}
```

### Scenario Sync with Dynamic Variables
```typescript
// Replace hardcoded scenario sync with dynamic version
function useDynamicScenarioSync() {
  const businessId = useAtomValue(activeBusinessIdAtom);
  const inputValues = useAtomValue(snapshotInputValuesAtom); // only inputs
  const scenarioName = useAtomValue(scenarioNameAtom);
  const currentId = useAtomValue(currentScenarioIdAtom);
  const syncReady = useAtomValue(scenarioSyncReadyAtom);

  useEffect(() => {
    if (!syncReady || !businessId) return;

    const timer = setTimeout(async () => {
      const scenario = {
        metadata: { id: currentId, name: scenarioName, ... },
        values: inputValues, // Record<string, number>
      };
      await saveScenarioData(businessId, scenario);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValues, scenarioName, currentId, syncReady, businessId]);
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| atomFamily (jotai/utils) | jotai-family package | 2024+ | atomFamily deprecated in jotai/utils, but still works. Migration not needed for our use case since we're not using atomFamily at all. |
| Individual atoms per variable | Record atom + derived evaluation | N/A (architecture decision) | Simpler, no memory leaks, easier snapshot/restore |
| Hardcoded ComputedMetrics interface | Dynamic computed variables from formulas | Phase 7 | Enables any business type's metrics to work without code changes |

**New patterns to consider:**
- **jotai-effect:** For side effects (Firestore sync). But existing useEffect pattern works fine — don't add dependency.
- **derive (third-party):** Incremental updates. Overkill for ~20 variables being evaluated.

**Deprecated/outdated:**
- **atomFamily from jotai/utils:** Being replaced by jotai-family package, but irrelevant since we're not using it.
- **Per-atom persistence (atomWithStorage):** Not suitable for scenarios where all values need atomic save/load.
</sota_updates>

<migration_strategy>
## Migration Strategy

### What Gets Replaced

| Current (Hardcoded) | New (Dynamic) | Notes |
|---------------------|--------------|-------|
| `scenario-atoms.ts` (10 primitive atoms) | `scenarioValuesAtom` (single Record) | One atom replaces ten |
| `derived-atoms.ts` (10 derived atoms + ComputedMetrics) | `evaluatedValuesAtom` (derived via evaluateVariables) | Formula engine replaces handwritten derivation |
| `ScenarioControls` (hardcoded sliders) | `DynamicScenarioControls` (generated from variable definitions) | Same UI patterns, dynamic data source |
| `ScenarioDashboard` (hardcoded StatCards) | `DynamicScenarioDashboard` (generated from computed variables) | Dynamic KPIs |
| `ScenarioComparison` (hardcoded tables) | `DynamicScenarioComparison` (variable-based tables) | Dynamic comparison |
| `useScenarioSync` (saves 10 fields) | `useDynamicScenarioSync` (saves Record) | Same Firestore path, different data shape |
| `ScenarioVariables` type (10 fields) | `Record<string, number>` | Type-safe via variable definitions |
| `DEFAULT_SCENARIO_VARIABLES` | Variable definition defaults | Defaults come from template |
| `MONTHLY_FIXED_COSTS` constant | Part of variable definitions | Computed or input variable |
| `snapshotScenarioAtom` / `loadScenarioAtom` | `snapshotInputValuesAtom` / `loadDynamicScenarioAtom` | Same concept, dynamic data |

### Files Modified

1. **Replace:** `src/store/scenario-atoms.ts` — Remove 10 hardcoded atoms, add dynamic atoms
2. **Replace:** `src/store/derived-atoms.ts` — Remove hardcoded derived atoms, add evaluatedValuesAtom
3. **Rewrite:** `src/features/scenarios/scenario-controls.tsx` — Dynamic controls from variable definitions
4. **Rewrite:** `src/features/scenarios/scenario-dashboard.tsx` — Dynamic KPI cards from evaluated values
5. **Rewrite:** `src/features/scenarios/scenario-comparison.tsx` — Dynamic comparison tables
6. **Rewrite:** `src/hooks/use-scenario-sync.ts` — Save/load dynamic values
7. **Update:** `src/features/scenarios/index.tsx` — Remove hardcoded Editor tab, merge with Variables
8. **Update:** `src/features/dashboard/index.tsx` — Use dynamic evaluated values for KPIs
9. **Update:** `src/app/providers.tsx` — ScenarioSync uses dynamic atoms
10. **Clean up:** `src/lib/constants.ts` — Remove DEFAULT_SCENARIO_VARIABLES, MONTHLY_FIXED_COSTS
11. **Clean up:** `src/types/index.ts` — Remove ScenarioVariables type, add DynamicScenario type

### Tab Consolidation

The current Scenarios page has 3 tabs: Editor | Variables | Compare.

After Phase 7, "Editor" and "Variables" merge into one experience:
- The current "Editor" tab (hardcoded controls) gets replaced by dynamic controls generated from variable definitions
- The "Variables" tab (from Phase 6) becomes the "Editor" experience — variables ARE the scenario controls
- Result: **Editor | Compare** (2 tabs)

### Backward Compatibility

Old scenarios stored with `ScenarioVariables` (10 hardcoded fields) will not load correctly into the new system. This is acceptable because:
1. The app is pre-launch — no production users
2. Old scenarios were for Fun Box only — all new businesses use dynamic variables
3. Creating a new baseline scenario with template defaults is trivial
</migration_strategy>

<open_questions>
## Open Questions

1. **Should the 12-month revenue projection chart survive?**
   - What we know: ScenarioDashboard has a chart that ramps revenue 40%-100% over 12 months. This is a hardcoded heuristic.
   - What's unclear: Should dynamic businesses have projections? What formula should drive them?
   - Recommendation: Keep a simple projection (multiply monthly by 12 with optional ramp). The ramp coefficients could be a new variable or use flat projection. Defer sophisticated multi-year projection to a future phase.

2. **Should the main Dashboard page also use dynamic variables?**
   - What we know: `src/features/dashboard/index.tsx` imports from hardcoded derived-atoms.ts.
   - What's unclear: Whether to update the dashboard in Phase 7 or Phase 10.
   - Recommendation: Update dashboard KPIs to use evaluatedValuesAtom in Phase 7. Phase 10 adds further dashboard improvements. Avoids dead code from old atoms.

3. **Should VariableEditor and DynamicScenarioControls share the same edit mechanism?**
   - What we know: VariableEditor writes to `businessVariablesAtom` (definitions). DynamicScenarioControls should write to `scenarioValuesAtom` (scenario overrides).
   - What's unclear: Can they share UI components?
   - Recommendation: Share the value formatting and input components but keep the data flow separate. VariableEditor changes defaults (persistent); scenario controls change scenario values (per-scenario).
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Jotai atomFamily docs](https://jotai.org/docs/utilities/family) — API, caching, memory management, deprecation to jotai-family
- [Jotai atoms-in-atom guide](https://jotai.org/docs/guides/atoms-in-atom) — Pattern for dynamic atom collections
- [Jotai composing atoms guide](https://jotai.org/docs/guides/composing-atoms) — Derived atoms, action atoms, override patterns
- [Jotai performance guide](https://jotai.org/docs/guides/performance) — Render optimization, component granularity
- [Jotai persistence guide](https://jotai.org/docs/guides/persistence) — Serialize/deserialize patterns for storage

### Secondary (MEDIUM confidence)
- [jotai-family GitHub](https://github.com/jotaijs/jotai-family) — atomTree API for hierarchical atoms
- [Jotai #2368 discussion](https://github.com/pmndrs/jotai/discussions/2368) — Performance with many derived atoms (3ms for 2K atoms)
- [Jotai #447 issue](https://github.com/pmndrs/jotai/issues/447) — Dynamic atom performance for large trees

### Tertiary (LOW confidence - needs validation)
- None — all findings verified against official Jotai documentation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Jotai dynamic atom patterns
- Ecosystem: expr-eval (Phase 6), Recharts (existing)
- Patterns: Single Record atom, derived evaluation, dynamic UI generation, scenario save/load
- Pitfalls: Dual state, data migration, re-render loops, race conditions

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries needed, extending existing patterns
- Architecture: HIGH — validated against Jotai official docs, aligned with Phase 6 formula engine
- Pitfalls: HIGH — identified from codebase analysis and Jotai performance docs
- Code examples: HIGH — based on existing codebase patterns and Jotai API

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days — Jotai ecosystem stable)
</metadata>

---

*Phase: 07-generic-scenario-engine*
*Research completed: 2026-02-11*
*Ready for planning: yes*
