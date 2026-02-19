import { describe, it, expect } from 'vitest'
import {
  getEvaluationOrder,
  evaluateVariables,
  validateFormula,
} from '@/lib/formula-engine'
import type { VariableDefinition } from '@/types/business'

// ---------------------------------------------------------------------------
// Helpers — minimal VariableDefinition factories
// ---------------------------------------------------------------------------

function inputVar(
  id: string,
  value: number,
  unit: VariableDefinition['unit'] = 'currency'
): VariableDefinition {
  return {
    id,
    label: id,
    type: 'input',
    category: 'test',
    unit,
    value,
    defaultValue: value,
  }
}

function computedVar(
  id: string,
  formula: string,
  dependsOn: string[],
  unit: VariableDefinition['unit'] = 'currency'
): VariableDefinition {
  return {
    id,
    label: id,
    type: 'computed',
    category: 'test',
    unit,
    value: 0,
    defaultValue: 0,
    formula,
    dependsOn,
  }
}

// ---------------------------------------------------------------------------
// getEvaluationOrder
// ---------------------------------------------------------------------------

describe('getEvaluationOrder', () => {
  it('returns empty array for input-only variables', () => {
    const vars: Record<string, VariableDefinition> = {
      a: inputVar('a', 10),
      b: inputVar('b', 20),
    }
    expect(getEvaluationOrder(vars)).toEqual([])
  })

  it('returns computed variables in correct dependency order (linear chain)', () => {
    // a (input) -> b (computed from a) -> c (computed from b)
    const vars: Record<string, VariableDefinition> = {
      a: inputVar('a', 10),
      b: computedVar('b', 'a * 2', ['a']),
      c: computedVar('c', 'b + 5', ['b']),
    }
    const order = getEvaluationOrder(vars)
    expect(order).toEqual(['b', 'c'])
  })

  it('handles diamond dependency graph', () => {
    // a (input) -> b (computed from a), c (computed from a), d (computed from b + c)
    const vars: Record<string, VariableDefinition> = {
      a: inputVar('a', 10),
      b: computedVar('b', 'a * 2', ['a']),
      c: computedVar('c', 'a * 3', ['a']),
      d: computedVar('d', 'b + c', ['b', 'c']),
    }
    const order = getEvaluationOrder(vars)
    // d must come after both b and c
    expect(order.indexOf('d')).toBeGreaterThan(order.indexOf('b'))
    expect(order.indexOf('d')).toBeGreaterThan(order.indexOf('c'))
    expect(order).toHaveLength(3)
  })

  it('throws on circular dependency', () => {
    const vars: Record<string, VariableDefinition> = {
      a: computedVar('a', 'b + 1', ['b']),
      b: computedVar('b', 'a + 1', ['a']),
    }
    expect(() => getEvaluationOrder(vars)).toThrow(/[Cc]ircular/)
  })
})

// ---------------------------------------------------------------------------
// evaluateVariables
// ---------------------------------------------------------------------------

describe('evaluateVariables', () => {
  it('passes through input variables with their values', () => {
    const vars: Record<string, VariableDefinition> = {
      revenue: inputVar('revenue', 100),
      costs: inputVar('costs', 40),
    }
    const result = evaluateVariables(vars)
    expect(result).toEqual({ revenue: 100, costs: 40 })
  })

  it('evaluates a computed variable from formula', () => {
    const vars: Record<string, VariableDefinition> = {
      revenue: inputVar('revenue', 100),
      annual: computedVar('annual', 'revenue * 12', ['revenue']),
    }
    const result = evaluateVariables(vars)
    expect(result.revenue).toBe(100)
    expect(result.annual).toBe(1200)
  })

  it('evaluates a multi-level chain correctly', () => {
    // a=input(5), b=a*2=10, c=b+10=20
    const vars: Record<string, VariableDefinition> = {
      a: inputVar('a', 5),
      b: computedVar('b', 'a * 2', ['a']),
      c: computedVar('c', 'b + 10', ['b']),
    }
    const result = evaluateVariables(vars)
    expect(result.a).toBe(5)
    expect(result.b).toBe(10)
    expect(result.c).toBe(20)
  })

  it('returns 0 for a bad formula (graceful degradation)', () => {
    const vars: Record<string, VariableDefinition> = {
      a: inputVar('a', 5),
      bad: computedVar('bad', 'nonexistent + 1', ['a']),
    }
    const result = evaluateVariables(vars)
    expect(result.a).toBe(5)
    expect(result.bad).toBe(0)
  })

  it('returns empty record for empty variables', () => {
    const result = evaluateVariables({})
    expect(result).toEqual({})
  })

  it('evaluates percent-unit variables stored as decimals correctly', () => {
    // margin stored as 0.3 (30%), revenue = 1000, profit = revenue * margin
    const vars: Record<string, VariableDefinition> = {
      margin: inputVar('margin', 0.3, 'percent'),
      revenue: inputVar('revenue', 1000),
      profit: computedVar('profit', 'revenue * margin', ['revenue', 'margin']),
    }
    const result = evaluateVariables(vars)
    expect(result.margin).toBe(0.3)
    expect(result.profit).toBe(300)
  })
})

// ---------------------------------------------------------------------------
// validateFormula
// ---------------------------------------------------------------------------

describe('validateFormula', () => {
  it('returns valid: true for a valid formula', () => {
    const result = validateFormula('a + b * 2', ['a', 'b'])
    expect(result).toEqual({ valid: true })
  })

  it('returns valid: false when referencing an unknown variable', () => {
    const result = validateFormula('a + unknown', ['a'])
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('returns valid: false for a syntax error', () => {
    const result = validateFormula('a +* b', ['a', 'b'])
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  it('handles empty formula', () => {
    const result = validateFormula('', [])
    // Empty string is a parse error in expr-eval
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })
})
