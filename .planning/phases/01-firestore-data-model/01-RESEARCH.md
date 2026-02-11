# Phase 1: Firestore Data Model - Research

**Researched:** 2026-02-11
**Domain:** Firestore multi-tenant data modeling + business plan variable libraries
**Confidence:** HIGH

<research_summary>
## Summary

Researched two critical domains for the multi-business Firestore data model: (1) Firestore multi-tenant architecture patterns including document structure, sharing, dynamic schemas, variable dependency graphs, and template storage; (2) comprehensive business plan variable definitions for all 6 business types (SaaS, Service, Retail, Restaurant, Event, Manufacturing) with special focus on the guitar pickup manufacturing use case.

**Key finding:** Root-level `businesses` collection (not nested under `users`) is the recommended pattern because it makes sharing natural — the roles map lives on the business document itself, and any authenticated user can be added without restructuring paths. Sections and scenarios live as subcollections under each business. Templates are a separate root collection, read-only for users.

For variable dependencies, client-side topological sort (Kahn's algorithm) evaluates formulas in correct order. Variables stored as a map within the scenario document, with both `dependsOn` and `dependents` adjacency lists for bidirectional graph traversal.

**Primary recommendation:** Use root-level `businesses/{businessId}` with roles map for sharing, `sections` and `scenarios` as subcollections, `templates` as a separate root collection, and store all variables in the scenario document as a single map with dependency metadata.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| firebase | 12.9.x | Firestore SDK (already installed) | Project standard, modular SDK |
| toposort | 2.0.2 | Topological sort for variable dependency DAGs | Lightweight (zero deps), battle-tested, handles cycle detection |
| mathjs | 13.x | Safe expression evaluation for variable formulas | Secure alternative to eval(), supports custom scope |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.x (already installed) | Schema validation for section data | Validating template schemas and variable definitions |
| uuid | 10.x | Unique IDs for businesses/sections | If Firestore auto-IDs are insufficient |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| toposort | Custom implementation | toposort is ~30 lines but handles edge cases (cycles, disconnected nodes) |
| mathjs | expr-eval | mathjs is heavier but more capable; expr-eval lighter but less maintained |
| Root collections | User subcollections | Subcollections make sharing painful — data lives under one user's path |

**Installation:**
```bash
npm install toposort mathjs
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Firestore Structure
```
/templates/{templateId}
  - name, businessType, version, description
  - sections (map of sectionKey -> {label, order, schema, defaultData})
  - defaultVariables (map of varId -> {type, label, formula, dependsOn, defaultValue})

/businesses/{businessId}
  - name, ownerId, templateId, templateVersion
  - roles (map of uid -> role)
  - profile (name, type, industry, location, description)
  - createdAt, updatedAt

/businesses/{businessId}/sections/{sectionSlug}
  - label, order, schema (map), data (map - flexible JSON)

/businesses/{businessId}/scenarios/{scenarioId}
  - name, isDefault
  - variables (map of varId -> {value, formula, dependsOn, dependents, type, label})

/users/{uid}
  - email, displayName, createdAt
```

### Pattern 1: Root Collection with Roles Map
**What:** Businesses at root level with roles map for access control
**When to use:** Any multi-tenant app with document sharing
**Why:** Sharing is natural — add user UID to roles map. Security rules check `resource.data.roles[request.auth.uid]` directly without extra `get()` calls.
```typescript
// Business document structure
interface Business {
  name: string
  ownerId: string
  templateId: string
  templateVersion: number
  roles: Record<string, 'owner' | 'editor'>
  profile: BusinessProfile
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Security rule
// allow read: if request.auth.uid in resource.data.roles;
// allow write: if resource.data.roles[request.auth.uid] in ['owner', 'editor'];
```

### Pattern 2: Flexible Section Schema via Map Fields
**What:** Store section data as a map field within the section document
**When to use:** When sections have different schemas per business type
**Why:** Single read, atomic updates, Firestore is inherently schemaless. Section data fits well under 1 MiB limit.
```typescript
// Section document — schema defines structure, data holds values
interface SectionDocument {
  sectionKey: string      // e.g., "executive_summary"
  label: string
  order: number
  schema: Record<string, FieldSchema>  // defines what fields exist
  data: Record<string, unknown>         // actual values (flexible JSON)
}

interface FieldSchema {
  type: 'text' | 'textarea' | 'number' | 'list' | 'group'
  label: string
  placeholder?: string
  children?: Record<string, FieldSchema>  // for nested groups
}
```

### Pattern 3: Variable Dependency Graph in Scenario Document
**What:** Store all variables as a map within the scenario document with bidirectional adjacency lists
**When to use:** When variables have formula dependencies (DAG)
**Why:** Atomic read/write of all variables, enables client-side topological sort
```typescript
interface VariableDefinition {
  id: string
  label: string
  type: 'input' | 'computed'
  category: string          // e.g., "revenue", "costs", "metrics"
  value: number
  formula?: string          // e.g., "materials + labor + shipping"
  dependsOn?: string[]      // incoming edges (for evaluation order)
  dependents?: string[]     // outgoing edges (for invalidation)
  unit?: 'currency' | 'percent' | 'count' | 'months'
  defaultValue?: number
}
```

### Pattern 4: Template Instantiation via Batch Write
**What:** Copy template data to new business using `writeBatch`
**When to use:** Creating a new business from a template
**Why:** Atomic operation (up to 500 writes), no read-then-write needed
```typescript
async function createBusinessFromTemplate(
  templateId: string,
  userId: string,
  businessName: string
) {
  const templateDoc = await getDoc(doc(db, 'templates', templateId))
  const template = templateDoc.data()
  const batch = writeBatch(db)

  // 1. Create business doc
  const businessRef = doc(collection(db, 'businesses'))
  batch.set(businessRef, {
    name: businessName,
    ownerId: userId,
    templateId,
    templateVersion: template.version,
    roles: { [userId]: 'owner' },
    createdAt: serverTimestamp()
  })

  // 2. Create section docs from template
  for (const [key, section] of Object.entries(template.sections)) {
    batch.set(doc(db, 'businesses', businessRef.id, 'sections', key), {
      sectionKey: key,
      label: section.label,
      order: section.order,
      schema: section.schema,
      data: section.defaultData
    })
  }

  // 3. Create default scenario with variables
  batch.set(doc(collection(db, 'businesses', businessRef.id, 'scenarios')), {
    name: 'Base Case',
    isDefault: true,
    variables: template.defaultVariables
  })

  await batch.commit()
}
```

### Pattern 5: Schema Versioning with withConverter
**What:** Lazy migration of documents on read using Firestore converters
**When to use:** When template versions change and existing businesses need migration
```typescript
const businessConverter = {
  toFirestore: (business: Business) => business,
  fromFirestore: (snapshot: QueryDocumentSnapshot) => {
    const data = snapshot.data()
    return upgradeBusiness(data) // progressively upgrades through versions
  }
}
```

### Anti-Patterns to Avoid
- **Nesting businesses under users:** Makes sharing painful — data lives under one user's path, other users need awkward cross-user access
- **Using subcollection security rules expecting inheritance:** Subcollection rules do NOT inherit from parent document rules
- **Storing roles in a separate document:** Forces a `get()` call in every security rule evaluation (limited to 10 per read)
- **Using `eval()` for formula evaluation:** Security risk. Use mathjs or a proper expression parser
- **Storing only one direction of the dependency graph:** Forces full graph traversal to find what to recalculate
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Topological sort for variable deps | Custom DFS implementation | `toposort` npm package | Handles cycle detection, disconnected nodes, edge cases |
| Formula/expression evaluation | Custom parser or `eval()` | `mathjs` evaluate() with scope | Security (no code injection), handles operators/functions, custom scope |
| Firestore batch operations | Sequential writes in a loop | `writeBatch()` | Atomic, consistent, up to 500 ops |
| UUID generation | Math.random concatenation | Firestore auto-ID or `uuid` | Collision-proof, standard format |
| Schema migration | Manual version checks everywhere | `withConverter` pattern | Centralizes migration logic, runs on read |

**Key insight:** The variable dependency engine is the most complex piece. Use toposort for evaluation order and mathjs for safe expression evaluation. These are well-tested solutions for problems that look simple but have tricky edge cases (circular deps, operator precedence, scope leaks).
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Circular Variable Dependencies
**What goes wrong:** User creates A depends on B, B depends on A — evaluation loops forever
**Why it happens:** No cycle detection when defining variable formulas
**How to avoid:** Run toposort before saving any variable definition change. If it throws, reject the change and show the cycle to the user.
**Warning signs:** Browser tab freezing during scenario calculation

### Pitfall 2: Security Rules Not Protecting Subcollections
**What goes wrong:** Users can read/write sections of businesses they don't have access to
**Why it happens:** Firestore subcollection rules do NOT inherit from parent document rules — each level needs explicit rules
**How to avoid:** Write explicit rules for every subcollection path that check the parent business's roles map
**Warning signs:** Data appearing for unauthorized users during testing

### Pitfall 3: Exceeding 10 get() Calls in Security Rules
**What goes wrong:** Security rules fail silently, blocking legitimate operations
**Why it happens:** Each `get()` or `exists()` call in rules counts toward a 10-call limit per single-document read
**How to avoid:** Store the roles map directly on the business document (not in a separate doc). For subcollection rules, one `get()` to the parent business is enough.
**Warning signs:** Intermittent permission denied errors

### Pitfall 4: Default Indexing Waste on Dynamic Maps
**What goes wrong:** Firestore creates indexes for every field in dynamic section data maps, consuming the 40,000 index entry limit
**Why it happens:** Firestore auto-indexes all fields by default
**How to avoid:** Exempt dynamic data fields from automatic indexing in `firestore.indexes.json`
**Warning signs:** Slow writes, approaching index limits in Firebase console

### Pitfall 5: Template Instantiation Exceeding 500-op Batch Limit
**What goes wrong:** Creating a business with many sections fails silently
**Why it happens:** `writeBatch` has a 500 operation maximum
**How to avoid:** Count operations before committing. For templates with many sections, chain multiple batches.
**Warning signs:** Partial business creation (some sections missing)

### Pitfall 6: 1 Write/Second Document Limit
**What goes wrong:** Rapid auto-save conflicts when multiple users edit the same section
**Why it happens:** Firestore limits writes to a single document to 1 per second sustained
**How to avoid:** Debounce saves (existing pattern in codebase), consider field-level updates instead of full document writes
**Warning signs:** Write failures or data loss during collaborative editing
</common_pitfalls>

<code_examples>
## Code Examples

### Topological Sort for Variable Evaluation
```typescript
// Source: toposort npm + custom integration
import toposort from 'toposort'

function evaluateVariables(
  variables: Record<string, VariableDefinition>
): Record<string, number> {
  // Build edge list: [dependency, dependent]
  const edges: [string, string][] = []
  const nodes: string[] = Object.keys(variables)

  for (const [id, variable] of Object.entries(variables)) {
    if (variable.dependsOn) {
      for (const dep of variable.dependsOn) {
        edges.push([dep, id])
      }
    }
  }

  // Topological sort (throws on cycles)
  const sorted = toposort.array(nodes, edges)

  // Evaluate in order
  const results: Record<string, number> = {}
  for (const varId of sorted) {
    const variable = variables[varId]
    if (variable.type === 'input') {
      results[varId] = variable.value
    } else {
      // Safe evaluation with mathjs
      results[varId] = evaluate(variable.formula!, results)
    }
  }

  return results
}
```

### Safe Formula Evaluation with mathjs
```typescript
// Source: mathjs docs
import { evaluate } from 'mathjs'

function evaluateFormula(
  formula: string,
  scope: Record<string, number>
): number {
  try {
    return evaluate(formula, scope)
  } catch {
    return 0 // fallback for invalid formulas
  }
}
```

### Firestore Security Rules for Multi-Business
```javascript
// Source: Firebase docs - role-based access
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Templates — read-only for authenticated users
    match /templates/{templateId} {
      allow read: if request.auth != null;
      allow write: if false; // admin-only via Firebase Admin SDK
    }

    // Businesses — access via roles map
    match /businesses/{businessId} {
      function getRole() {
        return resource.data.roles[request.auth.uid];
      }

      function hasRole(roles) {
        return request.auth != null && (getRole() in roles);
      }

      allow read: if hasRole(['owner', 'editor']);
      allow create: if request.auth != null;
      allow update: if hasRole(['owner', 'editor']);
      allow delete: if hasRole(['owner']);

      // Sections — inherit access from parent business
      match /sections/{sectionId} {
        allow read: if get(/databases/$(database)/documents/businesses/$(businessId))
                       .data.roles[request.auth.uid] in ['owner', 'editor'];
        allow write: if get(/databases/$(database)/documents/businesses/$(businessId))
                        .data.roles[request.auth.uid] in ['owner', 'editor'];
      }

      // Scenarios — same access pattern
      match /scenarios/{scenarioId} {
        allow read: if get(/databases/$(database)/documents/businesses/$(businessId))
                       .data.roles[request.auth.uid] in ['owner', 'editor'];
        allow write: if get(/databases/$(database)/documents/businesses/$(businessId))
                        .data.roles[request.auth.uid] in ['owner', 'editor'];
      }
    }

    // Users — own profile only
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Query: Get All Businesses for a User
```typescript
// Source: Firestore docs - map field queries
import { collection, query, where, getDocs } from 'firebase/firestore'

async function getUserBusinesses(uid: string) {
  // Query businesses where user has any role
  const q = query(
    collection(db, 'businesses'),
    where(`roles.${uid}`, '!=', null)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
```
</code_examples>

<business_variables>
## Business Type Variable Definitions

### Universal Variables (All Business Types)

These 18 variables apply to every business regardless of type:

| Variable | Type | Formula/Description | Unit |
|----------|------|---------------------|------|
| `monthlyRevenue` | computed | Sum of revenue streams | currency |
| `monthlyExpenses` | computed | Sum of all cost categories | currency |
| `grossMarginPercent` | computed | (revenue - directCosts) / revenue * 100 | percent |
| `netProfitMargin` | computed | netIncome / revenue * 100 | percent |
| `monthlyBurnRate` | computed | expenses - revenue (when negative) | currency |
| `cashOnHand` | input | Current cash balance | currency |
| `runwayMonths` | computed | cashOnHand / monthlyBurn | months |
| `customerAcquisitionCost` | computed | marketingSpend / newCustomers | currency |
| `customerLifetimeValue` | computed | Business-type-specific formula | currency |
| `headcount` | input | Total employees | count |
| `payrollExpense` | input | Total salary + benefits | currency |
| `rentExpense` | input | Facility costs | currency |
| `marketingSpend` | input | Total marketing budget | currency |
| `operatingExpenses` | computed | SG&A + overhead | currency |
| `taxRate` | input | Effective tax rate | percent |
| `breakEvenRevenue` | computed | fixedCosts / (1 - variableCostRatio) | currency |
| `revenueGrowthRateMonthly` | input | Month-over-month growth | percent |
| `debtServiceMonthly` | input | Loan/interest payments | currency |

### SaaS Business (15 type-specific variables)

| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `monthlyNewCustomers` | input | New signups per month | count |
| `arpu` | input | Average revenue per user | currency |
| `mrr` | computed | totalActiveCustomers * arpu | currency |
| `arr` | computed | mrr * 12 | currency |
| `churnRateMonthly` | input | % customers who cancel | percent |
| `netRevenueRetention` | computed | (startMRR + expansion - contraction - churn) / startMRR | percent |
| `cac` | computed | salesMarketingSpend / newCustomers | currency |
| `ltv` | computed | arpu / churnRate | currency |
| `ltvCacRatio` | computed | ltv / cac | count |
| `cacPaybackMonths` | computed | cac / (arpu * grossMargin) | months |
| `saasGrossMargin` | computed | (revenue - cogs) / revenue | percent |
| `expansionRevenueMonthly` | input | Upsell/cross-sell revenue | currency |
| `monthlyBurn` | computed | expenses - revenue | currency |
| `runway` | computed | cashOnHand / monthlyBurn | months |
| `ruleOf40` | computed | revenueGrowthRate + profitMargin | count |

### Service/Consulting Business (15 type-specific variables)

| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `totalConsultants` | input | Billable staff headcount | count |
| `billableHoursPerWeek` | input | Target hours per consultant | count |
| `utilizationRate` | computed | billableHours / totalAvailableHours | percent |
| `hourlyBillRate` | input | Per-consultant or blended rate | currency |
| `blendedRate` | computed | totalProjectRevenue / totalHours | currency |
| `revenuePerConsultant` | computed | billableHours * hourlyRate * utilization | currency |
| `totalServiceRevenue` | computed | revenuePerConsultant * totalConsultants | currency |
| `fullyLoadedCostPerConsultant` | computed | (salary * benefitMultiplier + overhead) / (2080 * utilization) | currency |
| `grossMarginPerConsultant` | computed | revenue - fullyLoadedCost | currency |
| `projectBacklog` | input | Contracted but undelivered revenue | currency |
| `averageProjectSize` | input | Typical project revenue | currency |
| `averageProjectDuration` | input | Weeks per engagement | count |
| `clientRetentionRate` | input | % clients with repeat engagements | percent |
| `proposalWinRate` | input | % proposals that convert | percent |
| `revenuePerEmployee` | computed | totalRevenue / totalEmployees | currency |

### Retail/E-commerce Business (16 type-specific variables)

| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `monthlyWebsiteTraffic` | input | Unique visitors | count |
| `conversionRate` | input | % visitors who purchase | percent |
| `numberOfOrders` | computed | traffic * conversionRate | count |
| `averageOrderValue` | input | Avg revenue per order | currency |
| `grossMerchandiseValue` | computed | orders * aov | currency |
| `returnRate` | input | % orders returned | percent |
| `netRetailRevenue` | computed | gmv * (1 - returnRate) | currency |
| `cogsPercent` | input | Cost of goods as % of revenue | percent |
| `retailGrossMargin` | computed | netRevenue - cogs | currency |
| `retailCac` | computed | marketingSpend / newCustomers | currency |
| `clv` | computed | avgPurchaseValue * avgFrequency * avgLifespan | currency |
| `inventoryTurnoverRatio` | computed | cogs / avgInventory | count |
| `cartAbandonmentRate` | input | % who add to cart but don't buy | percent |
| `shippingCostPerOrder` | input | Avg fulfillment cost | currency |
| `cashConversionCycleDays` | computed | dio + dso - dpo | count |
| `repeatPurchaseRate` | input | % customers who buy again | percent |

### Restaurant Business (16 type-specific variables)

| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `totalSeats` | input | Seating capacity | count |
| `turnsPerMealPeriod` | input | Table turnovers per service | count |
| `mealPeriodsPerDay` | input | Lunch, dinner, brunch | count |
| `averageTicket` | input | Average check per guest | currency |
| `dailyRevenue` | computed | seats * turns * averageTicket * mealPeriods | currency |
| `operatingDaysPerMonth` | input | Days open | count |
| `monthlyRestaurantRevenue` | computed | dailyRevenue * operatingDays | currency |
| `foodCostPercent` | input | Target 28-35% of revenue | percent |
| `laborCostPercent` | input | Target 25-35% of revenue | percent |
| `primeCostPercent` | computed | foodCost + laborCost | percent |
| `occupancyCostPercent` | input | Rent + utilities | percent |
| `revPASH` | computed | revenue / (seats * openHours) | currency |
| `beverageCostPercent` | input | Typically 18-24% | percent |
| `foodWastePercent` | input | % food purchased wasted | percent |
| `averageCoverCount` | computed | seats * turns * occupancyRate | count |
| `breakEvenDailyCoverCount` | computed | fixedDailyCosts / (avgTicket - variableCostPerCover) | count |

### Event/Entertainment Business (15 type-specific variables)

| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `venueCapacity` | input | Max attendees | count |
| `bookingsPerMonth` | input | Number of events | count |
| `averageBookingValue` | input | Revenue per event | currency |
| `monthlyEventRevenue` | computed | bookings * avgBookingValue | currency |
| `occupancyRate` | computed | actualBookingDays / availableDays | percent |
| `seasonalityCoefficient` | input | Monthly multiplier (0.6x - 1.3x) | count |
| `adjustedMonthlyRevenue` | computed | baseRevenue * seasonalityCoefficient | currency |
| `ancillaryRevenuePerEvent` | input | A/V, catering, equipment | currency |
| `commissionRevenuePercent` | input | % from partner referrals | percent |
| `averageEventDuration` | input | Half-day vs full-day | count |
| `staffCostPerEvent` | input | Coordinators, setup/teardown | currency |
| `marketingCostPerBooking` | computed | totalMarketingSpend / bookings | currency |
| `peakSeasonRevenuePercent` | input | Typically 60-70% annual revenue in peak | percent |
| `cancellationRate` | input | % bookings that cancel | percent |
| `averageBookLeadTimeDays` | input | How far ahead events are booked | count |

### Manufacturing Startup (25+ type-specific variables)

**Unit Economics:**
| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `rawMaterialCostPerUnit` | input | Sum of all material costs | currency |
| `directLaborCostPerUnit` | input | Labor hours * hourly wage | currency |
| `mfgOverheadPerUnit` | computed | totalOverhead / unitsProduced | currency |
| `cogsPerUnit` | computed | rawMaterial + directLabor + mfgOverhead | currency |
| `sellingPricePerUnit` | input | Target retail/wholesale price | currency |
| `grossMarginPerUnit` | computed | sellingPrice - cogs | currency |
| `grossMarginPercent` | computed | grossMargin / sellingPrice * 100 | percent |

**Production:**
| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `maxDailyOutput` | input | Max units per day | count |
| `operatingDaysPerMonth` | input | Working days (20-22) | count |
| `maxMonthlyCapacity` | computed | maxDailyOutput * operatingDays | count |
| `actualMonthlyProduction` | input | Planned/actual output | count |
| `capacityUtilization` | computed | actualProduction / maxCapacity * 100 | percent |

**Inventory:**
| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `rawMaterialInventoryValue` | computed | qtyOnHand * unitCost | currency |
| `wipInventoryValue` | computed | unitsInProcess * accumulatedCost | currency |
| `finishedGoodsInventoryValue` | computed | completedUnits * fullCogs | currency |
| `totalInventoryValue` | computed | raw + wip + finished | currency |
| `inventoryTurnoverRatio` | computed | cogs / avgInventoryValue | count |

**Supply Chain & Logistics:**
| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `domesticShippingCostPerUnit` | input | Domestic freight per unit | currency |
| `internationalShippingCostPerUnit` | input | Cross-border per unit | currency |
| `importDutyRate` | input | HS-code-specific duty rate | percent |
| `customsBrokerageFee` | input | Per-shipment broker fee | currency |
| `totalLandedCostPerUnit` | computed | product + shipping + duties + brokerage | currency |

**R&D & IP:**
| Variable | Type | Formula | Unit |
|----------|------|---------|------|
| `rdBudgetAnnual` | input | Total R&D spend | currency |
| `rdAsPercentOfRevenue` | computed | rdBudget / revenue * 100 | percent |
| `totalPatentPortfolioCost` | computed | filing + maintenance + attorney | currency |
| `toolingCostPerUnit` | computed | toolingInitialCost / amortizationUnits | currency |

**Guitar Pickup Specific Context:**
- Magnets (Alnico/Ceramic): $2-$25/pickup, 25% US import duty (Jan 2026)
- Copper wire: +50% US import tariff
- Bobbins: ~$0.49-$3.00/unit wholesale
- Polepieces: ~$3.00/set
- China-origin components: 25% Section 301 tariff
- EU CBAM (Carbon Border Adjustment Mechanism) live since Jan 2026
</business_variables>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| User subcollections for multi-tenant | Root collections with roles map | 2024+ consensus | Sharing becomes trivial, no restructuring needed |
| Separate permissions document | Roles map on the document itself | Firebase best practice | Saves `get()` calls in security rules (10/read limit) |
| Manual schema migration | `withConverter` lazy migration | Firestore SDK pattern | Migration happens on read, zero downtime |
| `eval()` for formulas | mathjs or expr-eval | Security best practice | Prevents code injection in user-defined formulas |

**New patterns to consider:**
- **Firestore Bundles**: Pre-package template data for offline-first template loading
- **Firestore COUNT aggregation**: Available since late 2024 for dashboard metrics without reading all docs

**Critical 2026 tariff updates for manufacturing template:**
- 25% duty on permanent magnets (Jan 2026)
- +50% tariff on copper imports
- EU low-value import exemption removed (Jul 2026) — flat 3 EUR/item
- EU CBAM now live, adding compliance cost for importers

**Deprecated/outdated:**
- **Nested user subcollections for shared data**: Causes access path issues
- **`eval()` for math expressions**: Security vulnerability
- **Recursive wildcard security rules (`{document=**}`)**: Opens all subcollections unintentionally
</sota_updates>

<open_questions>
## Open Questions

1. **Formula syntax for end users**
   - What we know: mathjs supports standard math expressions with variable names as scope
   - What's unclear: Do users type formulas directly, or do they build them via UI (dropdown of variable names + operators)?
   - Recommendation: Start with UI-based formula builder (safer, less error-prone), add raw formula input as advanced option later

2. **Maximum variables per scenario**
   - What we know: 200+ variables in a single document map is feasible (well under Firestore limits)
   - What's unclear: At what point does client-side evaluation become slow enough to notice?
   - Recommendation: Benchmark with 200 variables during implementation. If slow, consider Web Worker for computation.

3. **Template administration**
   - What we know: Templates need to be admin-writable only (security rules block user writes)
   - What's unclear: How will templates be initially seeded? Firebase Admin SDK? Firestore console? Script?
   - Recommendation: Create a seed script that runs with admin credentials to populate initial 6 templates
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Firebase docs - Choose a data structure](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firebase docs - Role-based access](https://firebase.google.com/docs/firestore/solutions/role-based-access)
- [Firebase docs - Quotas and limits](https://firebase.google.com/docs/firestore/quotas)
- [Firebase docs - Batch writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firebase docs - Security rules conditions](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [toposort npm](https://github.com/marcelklehr/toposort)
- [mathjs docs](https://mathjs.org/docs/expressions/parsing.html)

### Secondary (MEDIUM confidence)
- [Captain Codeman - Schema Versioning with Firestore](https://www.captaincodeman.com/schema-versioning-with-google-firestore) — verified `withConverter` pattern
- [Firebase Talk - Subcollection performance](https://groups.google.com/g/firebase-talk/c/CtS7DV5EEPY) — official Firebase team member responses
- [Doug Stevenson - Per-user permissions](https://medium.com/firebase-developers/patterns-for-security-with-firebase-per-user-permissions-for-cloud-firestore-be67ee8edc4a)
- [Doug Stevenson - Group-based permissions](https://medium.com/firebase-developers/patterns-for-security-with-firebase-group-based-permissions-for-cloud-firestore-72859cdec8f6)
- [SBA - Write Your Business Plan](https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan)
- [Manufacturing Business Plan - US Chamber of Commerce](https://www.uschamber.com/co/start/strategy/manufacturing-business-plan-guide)

### Tertiary (LOW confidence - needs validation during implementation)
- [Maersk - Customs tariffs 2026](https://www.maersk.com/insights/resilience/2025/12/08/customs-tariffs-and-compliance-shifts-in-north-america) — tariff rates may change
- [MJ CPA - Transfer pricing in manufacturing](https://www.mjcpa.com/transfer-pricing-in-manufacturing-tax-compliance-across-borders/) — tax guidance needs professional review
- [USPTO patent fee schedule](https://patentfile.org/howmuchdoesitcosttopatentanidea/) — verify current fees
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Firestore multi-tenant data modeling
- Ecosystem: Firebase SDK, toposort, mathjs
- Patterns: Root collections with roles, flexible schemas via maps, variable DAGs, template instantiation, schema versioning
- Business domain: Variable libraries for 6 business types, manufacturing supply chain, 2026 tariffs

**Confidence breakdown:**
- Firestore data model: HIGH — official docs + community best practices verified
- Security rules: HIGH — from Firebase official examples
- Variable dependencies: HIGH — well-established computer science (topological sort)
- Business variables: MEDIUM — aggregated from multiple industry sources, may need refinement per real business needs
- Tariff data: LOW — 2026 rates are current but subject to policy changes

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days — Firestore patterns stable; tariff data may change sooner)
</metadata>

---

*Phase: 01-firestore-data-model*
*Research completed: 2026-02-11*
*Ready for planning: yes*
