# Phase 6: Variable Library - Research

**Researched:** 2026-02-11
**Domain:** Business variable templates by industry + formula evaluation engine
**Confidence:** HIGH

<research_summary>
## Summary

Researched two domains for the Variable Library phase: (1) standard business KPIs and financial model variables across 7 business types (SaaS, Service, Retail, Restaurant, Event, Manufacturing, Custom), and (2) safe formula evaluation in JavaScript for computed variables.

Each business type has well-established industry-standard variables that form the foundation of financial modeling. SaaS businesses center on MRR/ARR, churn, and LTV:CAC. Restaurants use covers, average check, and food/labor cost percentages. Retail tracks foot traffic, conversion rate, and average transaction value. These patterns are universal across financial modeling tools and business plan templates.

For formula evaluation, the key finding is that our formulas are simple arithmetic with variable references (e.g., `monthlyPrice * numberOfCustomers`). A lightweight expression evaluator like `expr-eval` (14KB, safe sandbox, no eval()) is the right tool — mathjs is overkill at 500KB+. Dependency resolution between computed variables uses topological sort (Kahn's algorithm), which is trivial to implement inline (~20 lines).

**Primary recommendation:** Define variable templates as arrays of `VariableDefinition` objects per business type. Use `expr-eval` for formula evaluation. Use Kahn's algorithm for dependency resolution. Keep variable categories consistent: Revenue, Costs, Unit Economics, Growth, Operations.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expr-eval | 2.0.2 | Safe formula evaluation | Parses math expressions without eval(), supports custom variables, ~14KB minified, 650K+ weekly downloads |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none needed) | - | Topological sort | Hand-roll Kahn's algorithm (~20 lines) — too simple for a dependency |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expr-eval | mathjs | mathjs is actively maintained but ~500KB — massive overkill for `a * b + c` formulas |
| expr-eval | fparse | Similar size and capability, less community adoption (fewer downloads) |
| expr-eval | Hand-rolled parser | Tempting for simple formulas, but operator precedence + parentheses + edge cases make a library worthwhile |
| toposort npm | Inline Kahn's | Kahn's algorithm is ~20 lines — no library needed for DAG resolution |

**Note on expr-eval maintenance:** Last published 6 years ago. However, the API is stable, well-tested, and the problem domain (math expression parsing) is solved — it doesn't need active development. 650K+ weekly downloads confirm continued wide usage. If maintenance concerns arise during implementation, swap to mathjs (just larger bundle).

**Installation:**
```bash
npm install expr-eval
npm install -D @types/expr-eval
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Variable Template Structure
```
src/
├── lib/
│   ├── variable-templates/
│   │   ├── index.ts              # Re-exports all templates
│   │   ├── saas.ts               # SaaS variable template
│   │   ├── service.ts            # Service business template
│   │   ├── retail.ts             # Retail template
│   │   ├── restaurant.ts         # Restaurant template
│   │   ├── event.ts              # Event business template
│   │   ├── manufacturing.ts      # Manufacturing template
│   │   └── custom.ts             # Custom (minimal) template
│   └── formula-engine.ts         # expr-eval wrapper + topological sort
```

### Pattern 1: Variable Definition with Formula References
**What:** Each variable is either an input (user-typed number) or computed (formula referencing other variables). Formulas use variable IDs as identifiers.
**When to use:** Every business type template.
**Example:**
```typescript
// Input variable — user provides value
const monthlyPrice: VariableDefinition = {
  id: "monthlyPrice",
  label: "Monthly Subscription Price",
  type: "input",
  category: "revenue",
  unit: "currency",
  value: 49,
  defaultValue: 49,
  description: "Price per customer per month",
  min: 0,
  step: 1,
};

// Computed variable — formula references other variable IDs
const mrr: VariableDefinition = {
  id: "mrr",
  label: "Monthly Recurring Revenue",
  type: "computed",
  category: "revenue",
  unit: "currency",
  value: 0,       // computed at runtime
  defaultValue: 0,
  formula: "monthlyPrice * numberOfCustomers",
  dependsOn: ["monthlyPrice", "numberOfCustomers"],
  dependents: ["arr", "monthlyProfit"],
  description: "Total monthly subscription revenue",
};
```

### Pattern 2: Topological Sort for Evaluation Order
**What:** Computed variables must be evaluated in dependency order. Kahn's algorithm (BFS) resolves this from the `dependsOn` arrays.
**When to use:** Any time variable values need recomputing (scenario load, input change).
**Example:**
```typescript
function getEvaluationOrder(variables: Record<string, VariableDefinition>): string[] {
  const computed = Object.values(variables).filter(v => v.type === "computed");
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const v of computed) {
    inDegree[v.id] = (v.dependsOn ?? []).filter(dep => variables[dep]?.type === "computed").length;
    for (const dep of v.dependsOn ?? []) {
      if (!adj[dep]) adj[dep] = [];
      adj[dep].push(v.id);
    }
  }

  const queue = computed.filter(v => inDegree[v.id] === 0).map(v => v.id);
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
    throw new Error("Circular dependency detected in variable formulas");
  }

  return order;
}
```

### Pattern 3: Safe Formula Evaluation with expr-eval
**What:** Evaluate formula strings with a scope object containing all variable values.
**When to use:** Computing derived variable values.
**Example:**
```typescript
import { Parser } from "expr-eval";

const parser = new Parser();

function evaluateVariables(
  variables: Record<string, VariableDefinition>,
  order: string[]
): Record<string, number> {
  // Start with input values
  const scope: Record<string, number> = {};
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
      } catch {
        scope[id] = 0; // fallback on formula error
      }
    }
  }

  return scope;
}
```

### Pattern 4: Variable Categories
**What:** Group variables by function for UI organization.
**Categories:**
- `revenue` — Price, volume, conversion metrics
- `costs` — Fixed costs, variable costs, labor, materials
- `unit-economics` — Per-unit margins, break-even, LTV
- `growth` — Customer acquisition, retention, churn
- `operations` — Capacity, utilization, efficiency, staffing

Not all categories apply to all business types. SaaS has `growth` (churn, CAC), restaurants don't. Manufacturing has `operations` (yield, OEE), SaaS doesn't.

### Anti-Patterns to Avoid
- **Hardcoding formula logic in TypeScript functions:** Use formula strings so users can edit them. Don't implement `mrr = price * customers` as a function.
- **Storing evaluation order:** Derive it from `dependsOn` arrays at runtime. Storing it creates sync bugs.
- **Using JavaScript eval():** Never. Use expr-eval for safe sandboxed evaluation.
- **Bidirectional dependency maintenance:** Only store `dependsOn`. Derive `dependents` when needed. Storing both creates inconsistency risk.
</architecture_patterns>

<variable_templates>
## Variable Templates by Business Type

### SaaS

**Revenue inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| monthlyPrice | Monthly Subscription Price | currency | 49 | Price per customer per month |
| numberOfCustomers | Active Subscribers | count | 100 | Current paying customers |
| newCustomersPerMonth | New Customers/Month | count | 20 | Monthly new signups |

**Growth inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| monthlyChurnRate | Monthly Churn Rate | percent | 0.05 | % of customers who cancel monthly |
| customerAcquisitionCost | Customer Acquisition Cost | currency | 150 | Cost to acquire one customer |

**Cost inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| grossMarginPercent | Gross Margin | percent | 0.80 | Revenue margin after COGS |
| monthlyFixedCosts | Monthly Fixed Costs | currency | 5000 | Overhead (rent, tools, etc.) |

**Computed:**
| ID | Label | Formula | Description |
|----|-------|---------|-------------|
| mrr | Monthly Recurring Revenue | `monthlyPrice * numberOfCustomers` | Total monthly subscription revenue |
| arr | Annual Recurring Revenue | `mrr * 12` | Annualized recurring revenue |
| monthlyChurnedCustomers | Churned Customers/Month | `numberOfCustomers * monthlyChurnRate` | Customers lost per month |
| netNewCustomers | Net New Customers/Month | `newCustomersPerMonth - monthlyChurnedCustomers` | Growth rate in customers |
| ltv | Customer Lifetime Value | `monthlyChurnRate > 0 ? monthlyPrice / monthlyChurnRate : monthlyPrice * 120` | Expected total revenue per customer |
| ltvCacRatio | LTV:CAC Ratio | `customerAcquisitionCost > 0 ? ltv / customerAcquisitionCost : 0` | Unit economics health (target: 3+) |
| monthlyRevenue | Monthly Revenue | `mrr` | Total monthly revenue |
| monthlyCOGS | Monthly COGS | `mrr * (1 - grossMarginPercent)` | Cost of goods sold |
| monthlyAcquisitionCost | Monthly Acquisition Spend | `newCustomersPerMonth * customerAcquisitionCost` | Total CAC spend |
| monthlyCosts | Monthly Total Costs | `monthlyCOGS + monthlyAcquisitionCost + monthlyFixedCosts` | All costs combined |
| monthlyProfit | Monthly Profit | `monthlyRevenue - monthlyCosts` | Net monthly profit |
| profitMargin | Profit Margin | `monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0` | Profit as % of revenue |
| annualRevenue | Annual Revenue | `monthlyRevenue * 12` | Projected annual revenue |
| annualProfit | Annual Profit | `monthlyProfit * 12` | Projected annual profit |

---

### Service (Consulting, Agency, Freelance)

**Revenue inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| numberOfStaff | Billable Staff | count | 5 | Staff who bill client hours |
| billableHoursPerWeek | Billable Hours/Week | hours | 40 | Available hours per staff per week |
| utilizationRate | Utilization Rate | percent | 0.75 | % of available hours actually billed |
| averageHourlyRate | Average Hourly Rate | currency | 150 | Rate charged to clients per hour |

**Cost inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| monthlySalaryPerStaff | Monthly Salary/Staff | currency | 6000 | Average monthly salary per billable employee |
| monthlyOverhead | Monthly Overhead | currency | 3000 | Office, tools, insurance, etc. |
| monthlyMarketingBudget | Marketing Budget | currency | 1000 | Monthly marketing spend |

**Computed:**
| ID | Label | Formula | Description |
|----|-------|---------|-------------|
| weeklyBillableHours | Total Billable Hours/Week | `numberOfStaff * billableHoursPerWeek * utilizationRate` | Actual billable hours |
| monthlyBillableHours | Total Billable Hours/Month | `weeklyBillableHours * 4.33` | Monthly billable hours |
| monthlyRevenue | Monthly Revenue | `monthlyBillableHours * averageHourlyRate` | Total monthly revenue |
| totalSalaries | Total Monthly Salaries | `numberOfStaff * monthlySalaryPerStaff` | Total salary expense |
| monthlyCosts | Monthly Total Costs | `totalSalaries + monthlyOverhead + monthlyMarketingBudget` | All costs combined |
| monthlyProfit | Monthly Profit | `monthlyRevenue - monthlyCosts` | Net monthly profit |
| profitMargin | Profit Margin | `monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0` | Profit as % of revenue |
| revenuePerEmployee | Revenue per Employee | `numberOfStaff > 0 ? monthlyRevenue / numberOfStaff : 0` | Productivity metric |
| effectiveRate | Effective Hourly Rate | `monthlyBillableHours > 0 ? monthlyRevenue / (numberOfStaff * billableHoursPerWeek * 4.33) : 0` | Revenue per available hour (accounts for utilization) |
| annualRevenue | Annual Revenue | `monthlyRevenue * 12` | Projected annual revenue |
| annualProfit | Annual Profit | `monthlyProfit * 12` | Projected annual profit |

---

### Retail (Physical Store, E-commerce)

**Revenue inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| monthlyFootTraffic | Monthly Visitors | count | 3000 | Store visitors or website sessions per month |
| conversionRate | Conversion Rate | percent | 0.03 | % of visitors who purchase |
| averageTransactionValue | Average Transaction Value | currency | 45 | Average spend per purchase |

**Cost inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| costOfGoodsPercent | COGS % | percent | 0.50 | Cost of goods as % of revenue |
| staffCount | Number of Staff | count | 3 | Total employees |
| averageHourlyWage | Average Hourly Wage | currency | 15 | Hourly rate per employee |
| hoursPerWeek | Hours/Week per Staff | hours | 35 | Weekly hours per employee |
| monthlyRent | Monthly Rent | currency | 3000 | Store/warehouse rent |
| monthlyMarketingBudget | Marketing Budget | currency | 500 | Monthly marketing spend |
| monthlyOtherFixed | Other Fixed Costs | currency | 500 | Utilities, insurance, etc. |

**Computed:**
| ID | Label | Formula | Description |
|----|-------|---------|-------------|
| monthlyTransactions | Monthly Transactions | `monthlyFootTraffic * conversionRate` | Number of sales per month |
| monthlyRevenue | Monthly Revenue | `monthlyTransactions * averageTransactionValue` | Total monthly revenue |
| costOfGoods | Cost of Goods Sold | `monthlyRevenue * costOfGoodsPercent` | Monthly COGS |
| grossProfit | Gross Profit | `monthlyRevenue - costOfGoods` | Revenue minus COGS |
| monthlyLabor | Monthly Labor Cost | `staffCount * averageHourlyWage * hoursPerWeek * 4.33` | Total labor expense |
| monthlyCosts | Monthly Total Costs | `costOfGoods + monthlyLabor + monthlyRent + monthlyMarketingBudget + monthlyOtherFixed` | All costs |
| monthlyProfit | Monthly Profit | `monthlyRevenue - monthlyCosts` | Net monthly profit |
| profitMargin | Profit Margin | `monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0` | Profit as % of revenue |
| grossMarginPercent | Gross Margin % | `1 - costOfGoodsPercent` | Gross margin percentage |
| annualRevenue | Annual Revenue | `monthlyRevenue * 12` | Projected annual revenue |
| annualProfit | Annual Profit | `monthlyProfit * 12` | Projected annual profit |

---

### Restaurant

**Revenue inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| numberOfSeats | Seating Capacity | count | 50 | Total seats in the restaurant |
| turnsPerDay | Table Turns/Day | count | 2 | Average seatings per table per day |
| averageCheck | Average Check | currency | 35 | Average spend per customer |
| daysOpenPerMonth | Days Open/Month | days | 26 | Operating days per month |

**Cost inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| foodCostPercent | Food Cost % | percent | 0.30 | Food cost as % of revenue (target: 28-35%) |
| laborCostPercent | Labor Cost % | percent | 0.30 | Labor cost as % of revenue (target: 25-35%) |
| monthlyRent | Monthly Rent | currency | 5000 | Rent/lease payment |
| monthlyUtilities | Monthly Utilities | currency | 1500 | Gas, electric, water |
| monthlyOtherFixed | Other Fixed Costs | currency | 1000 | Insurance, licenses, misc |

**Computed:**
| ID | Label | Formula | Description |
|----|-------|---------|-------------|
| dailyCovers | Daily Covers | `numberOfSeats * turnsPerDay` | Customers served per day |
| monthlyCovers | Monthly Covers | `dailyCovers * daysOpenPerMonth` | Total customers per month |
| monthlyRevenue | Monthly Revenue | `monthlyCovers * averageCheck` | Total monthly revenue |
| foodCost | Monthly Food Cost | `monthlyRevenue * foodCostPercent` | Food & beverage costs |
| laborCost | Monthly Labor Cost | `monthlyRevenue * laborCostPercent` | Total labor costs |
| primeCost | Prime Cost | `foodCost + laborCost` | Combined food + labor |
| primeCostPercent | Prime Cost % | `monthlyRevenue > 0 ? primeCost / monthlyRevenue : 0` | Target: 60-65% |
| monthlyFixedCosts | Monthly Fixed Costs | `monthlyRent + monthlyUtilities + monthlyOtherFixed` | Total fixed overhead |
| monthlyCosts | Monthly Total Costs | `primeCost + monthlyFixedCosts` | All costs combined |
| monthlyProfit | Monthly Profit | `monthlyRevenue - monthlyCosts` | Net monthly profit |
| profitMargin | Profit Margin | `monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0` | Target: 10-15% |
| annualRevenue | Annual Revenue | `monthlyRevenue * 12` | Projected annual revenue |
| annualProfit | Annual Profit | `monthlyProfit * 12` | Projected annual profit |

---

### Event (Venue, Conference, Entertainment)

**Revenue inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| eventsPerMonth | Events per Month | count | 8 | Number of events hosted |
| averageTicketPrice | Average Ticket/Booking Price | currency | 50 | Price per attendee or booking |
| averageAttendees | Average Attendees/Event | count | 100 | Attendees per event |

**Cost inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| venueCostPerEvent | Venue Cost/Event | currency | 500 | Venue rental or direct event space cost |
| staffingCostPerEvent | Staffing Cost/Event | currency | 800 | Event staff labor |
| suppliesCostPerEvent | Supplies Cost/Event | currency | 300 | Materials, F&B, decor per event |
| monthlyMarketingBudget | Marketing Budget | currency | 1000 | Monthly marketing spend |
| monthlyFixedCosts | Monthly Fixed Costs | currency | 3000 | Rent, insurance, admin, etc. |

**Computed:**
| ID | Label | Formula | Description |
|----|-------|---------|-------------|
| revenuePerEvent | Revenue per Event | `averageTicketPrice * averageAttendees` | Gross revenue per event |
| monthlyRevenue | Monthly Revenue | `revenuePerEvent * eventsPerMonth` | Total monthly revenue |
| variableCostPerEvent | Variable Cost/Event | `venueCostPerEvent + staffingCostPerEvent + suppliesCostPerEvent` | Direct costs per event |
| totalVariableCosts | Total Variable Costs | `variableCostPerEvent * eventsPerMonth` | All variable costs |
| profitPerEvent | Profit per Event | `revenuePerEvent - variableCostPerEvent` | Contribution margin per event |
| monthlyCosts | Monthly Total Costs | `totalVariableCosts + monthlyMarketingBudget + monthlyFixedCosts` | All costs combined |
| monthlyProfit | Monthly Profit | `monthlyRevenue - monthlyCosts` | Net monthly profit |
| profitMargin | Profit Margin | `monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0` | Profit as % of revenue |
| breakEvenEvents | Break-Even Events | `profitPerEvent > 0 ? (monthlyMarketingBudget + monthlyFixedCosts) / profitPerEvent : 0` | Events needed to cover fixed costs |
| annualRevenue | Annual Revenue | `monthlyRevenue * 12` | Projected annual revenue |
| annualProfit | Annual Profit | `monthlyProfit * 12` | Projected annual profit |

---

### Manufacturing

**Revenue inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| monthlyProductionCapacity | Production Capacity/Month | count | 10000 | Maximum units producible |
| capacityUtilization | Capacity Utilization | percent | 0.80 | % of capacity actually used |
| sellingPricePerUnit | Selling Price/Unit | currency | 25 | Price per unit sold |

**Cost inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| rawMaterialCostPerUnit | Raw Material Cost/Unit | currency | 8 | Material cost per unit |
| directLaborCostPerUnit | Direct Labor Cost/Unit | currency | 5 | Labor cost per unit |
| overheadCostPerUnit | Manufacturing Overhead/Unit | currency | 3 | Overhead allocated per unit |
| yieldRate | Yield Rate | percent | 0.95 | % of production meeting quality standards |
| monthlyFixedCosts | Monthly Fixed Costs | currency | 15000 | Rent, admin, management, etc. |

**Computed:**
| ID | Label | Formula | Description |
|----|-------|---------|-------------|
| actualProduction | Actual Production/Month | `monthlyProductionCapacity * capacityUtilization` | Units actually produced |
| qualityUnits | Sellable Units/Month | `actualProduction * yieldRate` | Units passing quality control |
| totalMaterialCost | Total Material Cost | `actualProduction * rawMaterialCostPerUnit` | Monthly raw material spend |
| totalLaborCost | Total Direct Labor Cost | `actualProduction * directLaborCostPerUnit` | Monthly direct labor |
| totalManufacturingOverhead | Total Manufacturing Overhead | `actualProduction * overheadCostPerUnit` | Monthly overhead |
| totalProductionCost | Total Production Cost | `totalMaterialCost + totalLaborCost + totalManufacturingOverhead` | All production costs |
| costPerUnit | Cost per Sellable Unit | `qualityUnits > 0 ? totalProductionCost / qualityUnits : 0` | True unit cost (accounts for waste) |
| monthlyRevenue | Monthly Revenue | `qualityUnits * sellingPricePerUnit` | Total monthly revenue |
| grossProfit | Gross Profit | `monthlyRevenue - totalProductionCost` | Revenue minus production costs |
| grossMarginPercent | Gross Margin % | `monthlyRevenue > 0 ? grossProfit / monthlyRevenue : 0` | Production profitability |
| monthlyCosts | Monthly Total Costs | `totalProductionCost + monthlyFixedCosts` | All costs combined |
| monthlyProfit | Monthly Profit | `monthlyRevenue - monthlyCosts` | Net monthly profit |
| profitMargin | Profit Margin | `monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0` | Net profit percentage |
| annualRevenue | Annual Revenue | `monthlyRevenue * 12` | Projected annual revenue |
| annualProfit | Annual Profit | `monthlyProfit * 12` | Projected annual profit |

---

### Custom (Minimal Starting Point)

**Revenue inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| monthlyRevenue | Monthly Revenue | currency | 0 | Total monthly revenue |

**Cost inputs:**
| ID | Label | Unit | Default | Description |
|----|-------|------|---------|-------------|
| monthlyCosts | Monthly Costs | currency | 0 | Total monthly costs |

**Computed:**
| ID | Label | Formula | Description |
|----|-------|---------|-------------|
| monthlyProfit | Monthly Profit | `monthlyRevenue - monthlyCosts` | Net monthly profit |
| profitMargin | Profit Margin | `monthlyRevenue > 0 ? monthlyProfit / monthlyRevenue : 0` | Profit as % of revenue |
| annualRevenue | Annual Revenue | `monthlyRevenue * 12` | Projected annual revenue |
| annualProfit | Annual Profit | `monthlyProfit * 12` | Projected annual profit |

Users add their own input and computed variables as needed.
</variable_templates>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Formula string parsing | Custom tokenizer/parser | expr-eval | Operator precedence, parentheses, ternary operators, edge cases — all solved |
| Formula safety | eval() or Function() | expr-eval sandboxed parser | Security: user-defined formulas must never execute arbitrary JS |
| Variable templates | Freeform user definition only | Pre-built templates per business type | Users need smart defaults — blank canvas is overwhelming for business planning |

**Key insight:** The formula engine is the only part that benefits from a library. Everything else — topological sort, variable template definitions, category grouping — is straightforward data modeling that should be hand-written for full control.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Circular Dependencies in Formulas
**What goes wrong:** User edits a formula to reference a variable that depends on itself (A → B → A), creating an infinite loop.
**Why it happens:** No cycle detection before evaluation.
**How to avoid:** Run topological sort before evaluation. If the sorted order length doesn't match the number of computed variables, a cycle exists. Show a clear error message identifying the cycle.
**Warning signs:** App hangs or crashes when evaluating formulas.

### Pitfall 2: Division by Zero in Computed Variables
**What goes wrong:** Formulas like `profit / revenue` crash when revenue is 0 (common in fresh/empty scenarios).
**Why it happens:** Default values are 0 for most inputs.
**How to avoid:** Use ternary guards in formulas: `revenue > 0 ? profit / revenue : 0`. Template formulas should always include division guards.
**Warning signs:** NaN or Infinity appearing in the UI.

### Pitfall 3: Formula String Fragility with Variable Renames
**What goes wrong:** User renames a variable ID, but formulas referencing the old ID break silently.
**Why it happens:** Formulas store variable IDs as plain strings.
**How to avoid:** When renaming a variable, find-and-replace the old ID in all formulas. Or: don't allow renaming IDs (only labels). IDs are internal identifiers; labels are display names.
**Warning signs:** Computed variables showing 0 or NaN after a rename.

### Pitfall 4: Percent Values as Decimals vs Whole Numbers
**What goes wrong:** User enters "30" meaning 30%, but formula treats it as 30 (3000%).
**Why it happens:** Inconsistent convention between UI display and formula evaluation.
**How to avoid:** Establish convention: variables with unit `percent` are stored as decimals (0.30, not 30). UI slider/input shows "30%" but stores 0.30. All formulas use the decimal value.
**Warning signs:** Revenue calculations off by 100x.

### Pitfall 5: Overloading Variable Templates with Too Many Variables
**What goes wrong:** Templates have 30+ variables, overwhelming users on first load.
**Why it happens:** Trying to cover every possible metric.
**How to avoid:** Keep templates focused: 7-12 input variables, 8-15 computed variables per type. Users can add more. Start lean — "what's the minimum to model this business type?"
**Warning signs:** User engagement drops on the scenarios page.
</common_pitfalls>

<code_examples>
## Code Examples

### expr-eval Basic Usage
```typescript
// Source: expr-eval npm docs
import { Parser } from "expr-eval";

const parser = new Parser();

// Simple evaluation with scope
const result = parser.evaluate("monthlyPrice * numberOfCustomers", {
  monthlyPrice: 49,
  numberOfCustomers: 100,
});
// result = 4900

// Ternary operator (for division guards)
const margin = parser.evaluate(
  "revenue > 0 ? profit / revenue : 0",
  { revenue: 10000, profit: 3000 }
);
// margin = 0.3

// Pre-parse for repeated evaluation (better performance)
const expr = parser.parse("a * b + c");
expr.evaluate({ a: 2, b: 3, c: 4 }); // 10
expr.evaluate({ a: 5, b: 6, c: 7 }); // 37
```

### Full Variable Evaluation Pipeline
```typescript
import { Parser } from "expr-eval";
import type { VariableDefinition } from "@/types/business";

const parser = new Parser();

/**
 * Resolve evaluation order using Kahn's algorithm (topological sort).
 * Returns ordered list of computed variable IDs.
 * Throws if circular dependency detected.
 */
function getEvaluationOrder(
  variables: Record<string, VariableDefinition>
): string[] {
  const computed = Object.values(variables).filter(v => v.type === "computed");
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  // Initialize
  for (const v of computed) {
    inDegree[v.id] = 0;
    adj[v.id] = [];
  }

  // Build graph (only edges between computed variables)
  for (const v of computed) {
    for (const depId of v.dependsOn ?? []) {
      if (variables[depId]?.type === "computed") {
        inDegree[v.id]++;
        if (!adj[depId]) adj[depId] = [];
        adj[depId].push(v.id);
      }
    }
  }

  // BFS
  const queue = computed.filter(v => inDegree[v.id] === 0).map(v => v.id);
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
      .filter(v => !order.includes(v.id))
      .map(v => v.id);
    throw new Error(
      `Circular dependency detected: ${missing.join(", ")}`
    );
  }

  return order;
}

/**
 * Evaluate all variables, returning computed values.
 */
function evaluateAllVariables(
  variables: Record<string, VariableDefinition>
): Record<string, number> {
  const order = getEvaluationOrder(variables);

  // Build scope from input values
  const scope: Record<string, number> = {};
  for (const v of Object.values(variables)) {
    if (v.type === "input") {
      scope[v.id] = v.value;
    }
  }

  // Evaluate computed in order
  for (const id of order) {
    const v = variables[id];
    if (v.formula) {
      try {
        scope[id] = parser.evaluate(v.formula, scope);
      } catch (e) {
        console.warn(`Formula error for ${id}: ${v.formula}`, e);
        scope[id] = 0;
      }
    }
  }

  return scope;
}
```

### Variable Template Definition Pattern
```typescript
import type { VariableDefinition } from "@/types/business";

function input(
  id: string,
  label: string,
  unit: VariableDefinition["unit"],
  defaultValue: number,
  description: string,
  opts?: { min?: number; max?: number; step?: number }
): VariableDefinition {
  return {
    id,
    label,
    type: "input",
    category: "", // set by caller
    unit,
    value: defaultValue,
    defaultValue,
    description,
    ...opts,
  };
}

function computed(
  id: string,
  label: string,
  unit: VariableDefinition["unit"],
  formula: string,
  dependsOn: string[],
  description: string
): VariableDefinition {
  return {
    id,
    label,
    type: "computed",
    category: "", // set by caller
    unit,
    value: 0,
    defaultValue: 0,
    formula,
    dependsOn,
    description,
  };
}

// Usage in template file:
export const SAAS_VARIABLES: VariableDefinition[] = [
  { ...input("monthlyPrice", "Monthly Price", "currency", 49, "Subscription price"), category: "revenue" },
  { ...input("numberOfCustomers", "Active Subscribers", "count", 100, "Paying customers"), category: "revenue" },
  { ...computed("mrr", "MRR", "currency", "monthlyPrice * numberOfCustomers", ["monthlyPrice", "numberOfCustomers"], "Monthly recurring revenue"), category: "revenue" },
  // ...
];
```
</code_examples>

<industry_benchmarks>
## Industry Benchmarks (for template default values & descriptions)

### SaaS
- LTV:CAC ratio: 3:1+ is healthy
- Monthly churn: <5% for SMB, <2% for enterprise
- Gross margin: 70-85%
- Rule of 40: growth rate + profit margin >= 40%
- CAC payback period: <12 months

### Restaurant
- Food cost: 28-35% of revenue
- Labor cost: 25-35% of revenue
- Prime cost (food + labor): 60-65% of revenue
- Profit margin: 3-15% (varies by concept)
- Table turns: 1.5-3x per day

### Retail
- Gross margin: 30-60% (varies by product type)
- Inventory turnover: 4-6x/year (general retail)
- Conversion rate: 2-5% (foot traffic to purchase)
- Average transaction value: highly category-dependent

### Service Business
- Utilization rate: 70-80% target
- Bill rate markup: 1.5-4x salary
- Profit margin: 15-25%
- Revenue per employee: $100K-$300K/year

### Event Business
- Staffing: <30% of revenue
- Venue/space: 15-25% of revenue
- Break-even: typically 5-8 events/month

### Manufacturing
- OEE target: 85%+ (world class)
- Yield rate: 95%+ target
- Gross margin: 25-50% (varies by product)
- Capacity utilization: 80-90%
</industry_benchmarks>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded scenario variables per business | Template-driven dynamic variables | Current standard | Enables multi-business support |
| eval() for user formulas | Safe expression parsers (expr-eval, mathjs) | 2018+ | Security and sandboxing |
| Manual dependency tracking | Automatic topological sort from declarations | Standard pattern | Eliminates ordering bugs |
| Spreadsheet-style cell references (A1, B2) | Named variable references (monthlyPrice, churn) | Domain best practice | More readable, self-documenting |

**Relevant patterns:**
- **Formula-driven financial models:** Standard in tools like Causal, Fathom, and LivePlan — all use named variables with formula references rather than spreadsheet cell notation.
- **Variable categories by business type:** Universal in business planning tools — SaaS metrics, restaurant metrics, etc. are well-established domains.
- **Input vs. computed separation:** Standard in financial modeling — clearly distinguishing user inputs from derived calculations prevents confusion.

**Not relevant to our scope:**
- **Real-time collaboration on formulas:** Phase 9 (Sharing) may eventually need this, but not for Phase 6.
- **Version control for variable definitions:** Nice-to-have but not MVP. Templates are versioned via `templateVersion` already.
</sota_updates>

<open_questions>
## Open Questions

1. **expr-eval ternary operator support**
   - What we know: expr-eval documentation mentions conditional expressions but syntax specifics need testing.
   - What's unclear: Whether `a > 0 ? b / a : 0` syntax works exactly as expected in expr-eval, or if an alternative like `if(a > 0, b / a, 0)` is needed.
   - Recommendation: Test during implementation. If ternary doesn't work, expr-eval supports custom functions — register an `ifgt(val, threshold, trueResult, falseResult)` function.

2. **`dependents` array — store or derive?**
   - What we know: Current `VariableDefinition` has both `dependsOn` and `dependents`. Storing both creates sync risk.
   - What's unclear: Whether Phase 7's dynamic atom creation benefits from pre-computed `dependents`.
   - Recommendation: For Phase 6, only populate `dependsOn` in templates. Derive `dependents` when needed. Phase 7 can reassess if performance requires pre-computation.

3. **Variable ID stability across template updates**
   - What we know: Templates have a `templateVersion`. Businesses reference `templateId` + `templateVersion`.
   - What's unclear: How to handle template version bumps — if a new version adds/removes variables, how do existing businesses migrate?
   - Recommendation: Defer to Phase 7 or later. For Phase 6, focus on v1 templates. Migration is a future concern.
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- expr-eval npm documentation — formula syntax, security model, custom variables
- Industry-standard KPI definitions from established financial literacy sources

### Secondary (MEDIUM confidence)
- [NetSuite Restaurant Metrics](https://www.netsuite.com/portal/resource/articles/accounting/restaurant-financial-metrics.shtml) — 33 restaurant metrics, food/labor/prime cost benchmarks
- [NetSuite Manufacturing Metrics](https://www.netsuite.com/portal/resource/articles/erp/manufacturing-kpi-metrics.shtml) — 78 manufacturing KPIs, OEE/yield definitions
- [re:cap SaaS Metrics](https://www.re-cap.com/blog/kpi-metric-saas) — MRR, ARR, churn, CAC, LTV definitions and benchmarks
- [Mosaic Utilization Rate](https://www.mosaic.tech/financial-metrics/billable-utilization-rate) — Service business utilization benchmarks
- [Tableau Retail KPIs](https://www.tableau.com/learn/articles/retail-industry-metrics-kpis) — Retail performance metrics
- [Financial Models Lab Event Venue KPIs](https://financialmodelslab.com/blogs/kpi-metrics/event-venue) — Event business benchmarks

### Tertiary (LOW confidence - needs validation)
- expr-eval ternary operator support — needs testing during implementation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: expr-eval for formula evaluation
- Ecosystem: Business KPIs across 7 industry verticals
- Patterns: Template-driven variables, topological sort, safe formula evaluation
- Pitfalls: Circular deps, division by zero, percent conventions, variable naming

**Confidence breakdown:**
- Standard stack: HIGH — expr-eval is the right tool for simple math expressions
- Architecture: HIGH — template + topo sort + expr-eval is a well-established pattern
- Variable templates: HIGH — industry KPIs are well-documented and universal
- Code examples: HIGH — based on library documentation and standard algorithms
- Pitfalls: HIGH — based on common financial modeling issues

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days — stable domain, no rapidly evolving tech)
</metadata>

---

*Phase: 06-variable-library*
*Research completed: 2026-02-11*
*Ready for planning: yes*
