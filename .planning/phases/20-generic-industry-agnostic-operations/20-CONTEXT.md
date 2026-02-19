# Phase 20: Generic Industry-Agnostic Operations - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<vision>
## How This Should Work

Operations becomes a single universal editor that works identically for every business type — manufacturing, SaaS, restaurant, retail, event, service. No conditional rendering, no industry-specific blocks.

The editor is organized as a tabbed/sectioned interface (similar to the scenario editor) with clear areas: Team, Capacity, Variable Costs, Fixed Costs, Equipment, Safety, Operational Metrics. Each section is a focused editing area.

A manufacturing business models yield rate, scrap rate, and OEE through the generic `operationalMetrics[]` array — same UI, same schema, no special fields. An event business models per-event costs through `costItems[]` with appropriate driver types (per-unit, per-order, etc.).

The system calculates variable and fixed monthly totals automatically, derives variable cost per output unit, and shows these as live metrics.

</vision>

<essential>
## What Must Be Nailed

- **No industry-specific fields or UI** — zero conditional renders based on business type. One model, one UI, one schema for all.
- **Generic data model** — workforce[], capacity, costItems[] (variable|fixed with driver types), equipment[], safetyProtocols[], operationalMetrics[] (name, unit, value, target)
- **Automatic cost calculations** — variableMonthlyTotal, fixedMonthlyTotal, monthlyOperationsTotal, variableCostPerOutput derive in real-time
- **Backward compatibility** — old event-model data must migrate cleanly to generic costItems without data loss
- **Manufacturing fully expressible** — yield rate, scrap rate, OEE, all modeled through generic capacity/costItems/operationalMetrics

</essential>

<specifics>
## Specific Ideas

- **Data model fields:**
  - `workforce[]`: role, count, ratePerHour
  - `capacity`: outputUnitLabel, plannedOutputPerMonth, maxOutputPerDay/week/month, utilizationRate
  - `costItems[]`: type (variable|fixed), category, rate, driverType (per-unit|per-order|per-service-hour|per-machine-hour|monthly|quarterly|yearly), driverQuantityPerMonth
  - `equipment[]`, `safetyProtocols[]`
  - `operationalMetrics[]`: name, unit, value, target

- **Cost calculations:**
  - variableMonthlyTotal = Σ(variable rate × driverQuantityPerMonth)
  - fixedMonthlyTotal = Σ(fixed rate normalized to month)
  - monthlyOperationsTotal = variable + fixed
  - variableCostPerOutput = variableMonthlyTotal / plannedOutputPerMonth (if > 0)

- **UI layout:** Tabbed/sectioned editor — Team, Capacity, Variable Costs, Fixed Costs, Equipment, Safety, Operational Metrics as separate collapsible or tabbed areas

- **AI:** One schema for all business types. Manufacturing AI fills the same generic schema through cost items + operational metrics.

- **Export/PDF:** Uses the same generic structure — no special rendering for any business type.

</specifics>

<notes>
## Additional Context

This continues the pattern from Phase 17 (generic offerings replacing tier-based packages) — making another section truly business-type-agnostic. The old Operations model has event-specific terminology (per-event costs, event duration) and manufacturing-specific blocks that need to be replaced with the universal cost driver model.

Migration from the old event-based Operations model is required. Old data maps to generic costItems with appropriate driver types.

</notes>

---

*Phase: 20-generic-industry-agnostic-operations*
*Context gathered: 2026-02-19*
