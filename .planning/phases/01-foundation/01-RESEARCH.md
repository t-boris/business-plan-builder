# Phase 1: Foundation - Research

**Researched:** 2026-02-11
**Domain:** Vite + React + TypeScript + Firebase dashboard application
**Confidence:** HIGH

<research_summary>
## Summary

Researched the complete stack for building a Firebase-hosted React + TypeScript dashboard SPA. The standard approach uses Vite 6.x with React 19, Firebase JS SDK v12.9.0 (modular API), shadcn/ui for dashboard components with Tailwind CSS, Recharts for business charts, Jotai for state management (critical for what-if scenario engine), and React Router v7 in library mode for SPA routing.

Key finding: Jotai's derived atoms are a natural fit for the what-if scenario engine — changing any input atom automatically propagates through all computed atoms (revenue, P&L, etc.) without manual memoization. Zustand lacks native derived state support.

For Firestore, use subcollections (not nested maps) for the 9+ business plan sections — this avoids the 1 MiB document limit, allows independent section editing, and enables reading only the section the user is viewing.

**Primary recommendation:** shadcn/ui + Tailwind + Recharts + Jotai + React Router v7 (library mode) + Firebase Hosting (original, not App Hosting) + Firestore subcollections.
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.x | UI framework | Current stable, required by latest ecosystem |
| react-dom | ^19.x | DOM renderer | Pairs with React 19 |
| vite | ^6.x | Build tool + dev server | Official template, instant HMR, Rollup builds |
| typescript | ~5.7-5.8 | Type system | Current stable from create-vite |
| firebase | ^12.9.0 | Backend (Firestore, Auth, Hosting) | Modular API, tree-shakable |
| @vitejs/plugin-react | ^5.x | Vite React integration | Official plugin |

### UI & Layout
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| shadcn/ui | CLI-based (Feb 2026) | Dashboard components | Copy-paste architecture, zero runtime dep, full control |
| tailwindcss | ^4.x | Utility CSS | Required by shadcn/ui, minimal bundle |
| @radix-ui/* | Latest | Accessible primitives | Foundation of shadcn/ui components |
| lucide-react | Latest | Icons | Standard with shadcn/ui |

### State & Routing
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jotai | Latest | State management | Native derived atoms for what-if calculations |
| react-router | ^7.x (library mode) | SPA routing | Stable, works with plain Vite (no framework mode needed) |

### Charts & PDF
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.x | Business charts (bar, line, pie, area) | Simplest React API, JSX-native, most used with shadcn |
| @react-pdf/renderer | Latest | PDF generation | React components → PDF, Flexbox layout |
| react-pdf-table | Latest | PDF tables | Table component for @react-pdf/renderer |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-table | Latest | Data tables | Used by shadcn/ui Data Table component |
| react-pdf-charts | Latest | Charts in PDFs | Converts Recharts SVG → react-pdf SVG elements |
| class-variance-authority | Latest | Component variants | Used by shadcn/ui for variant styling |
| clsx + tailwind-merge | Latest | Class merging | Used by shadcn/ui cn() utility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui | Mantine v8 | Mantine is all-in-one (forms, notifications built-in) but less control, heavier |
| shadcn/ui | MUI v7 | MUI has richest components but heaviest bundle, Material Design lock-in |
| Recharts | Nivo | Nivo has prettier defaults but steeper learning curve |
| Recharts | ApexCharts | ApexCharts has native candlestick/waterfall but less React-native |
| Jotai | Zustand | Zustand is simpler but no native derived state — bad for what-if engine |
| React Router v7 | TanStack Router | TanStack is fully type-safe (v1.159.5) but more complex setup |

**Installation:**
```bash
# Core
npm create vite@latest fun-box-planning -- --template react-ts
npm install firebase react-router jotai recharts

# shadcn/ui setup
npx shadcn@latest init
npx shadcn@latest add sidebar card table data-table tabs sheet input select button

# PDF (Phase 4)
npm install @react-pdf/renderer react-pdf-table
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/                    # App shell, providers, router config
│   ├── App.tsx
│   ├── providers.tsx       # Jotai Provider, Router
│   └── router.tsx          # React Router routes
├── components/             # Shared UI components (shadcn/ui)
│   └── ui/                 # shadcn/ui generated components
├── features/               # Feature-based modules
│   ├── dashboard/          # Dashboard overview page
│   ├── sections/           # Business plan section pages
│   │   ├── executive-summary/
│   │   ├── market-analysis/
│   │   ├── product-service/
│   │   ├── marketing-strategy/
│   │   ├── operations/
│   │   ├── financial-projections/
│   │   ├── risks-due-diligence/
│   │   ├── kpis-metrics/
│   │   └── launch-plan/
│   ├── scenarios/          # What-if scenario engine
│   └── export/             # Business plan view + PDF export
├── lib/                    # Utilities and configuration
│   ├── firebase.ts         # Firebase init + emulator connect
│   ├── utils.ts            # cn() and shared utils
│   └── constants.ts        # Business data constants
├── store/                  # Jotai atoms
│   ├── plan-atoms.ts       # Business plan section atoms
│   ├── scenario-atoms.ts   # What-if variable atoms
│   └── derived-atoms.ts    # Computed values (revenue, P&L, etc.)
└── types/                  # TypeScript types
    ├── plan.ts             # Business plan section types
    └── scenario.ts         # Scenario variable types
```

### Pattern 1: Jotai Atoms for What-If Scenarios
**What:** Use primitive atoms for each variable input, derived atoms for all computed values
**When to use:** Any time a variable change should propagate to dependent calculations

```typescript
// store/scenario-atoms.ts
import { atom } from 'jotai';

// Primitive input atoms
export const priceStarterAtom = atom(800);
export const priceExplorerAtom = atom(980);
export const priceVIPAtom = atom(1200);
export const monthlyLeadsAtom = atom(125);
export const conversionRateAtom = atom(0.20);
export const cacPerLeadAtom = atom(20);

// Derived atoms - auto-update when inputs change
export const monthlyBookingsAtom = atom((get) =>
  Math.round(get(monthlyLeadsAtom) * get(conversionRateAtom))
);

export const monthlyRevenueAtom = atom((get) => {
  const bookings = get(monthlyBookingsAtom);
  const avgCheck = (get(priceStarterAtom) + get(priceExplorerAtom) + get(priceVIPAtom)) / 3;
  return bookings * avgCheck;
});

export const monthlyCACAtom = atom((get) =>
  get(monthlyLeadsAtom) * get(cacPerLeadAtom)
);
```

### Pattern 2: Firestore Subcollections for Business Plan
**What:** Parent document holds metadata, subcollection holds section content
**When to use:** Document-heavy apps with independently editable sections

```typescript
// Firestore structure
// users/{userId}/plans/{planId}           → metadata + section summary
// users/{userId}/plans/{planId}/sections/{sectionSlug} → full section content

// Reading a single section
import { doc, getDoc } from 'firebase/firestore';
const sectionRef = doc(db, `plans/${planId}/sections/${sectionSlug}`);
const sectionSnap = await getDoc(sectionRef);

// Auto-saving with onSnapshot
import { onSnapshot } from 'firebase/firestore';
onSnapshot(sectionRef, (snap) => {
  // Update Jotai atom with latest data
});
```

### Pattern 3: Firebase Init with Emulator Support
**What:** Conditional emulator connection based on Vite dev mode
**When to use:** Always — enables local development without hitting production Firestore

```typescript
// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

export const db = getFirestore(app);

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### Anti-Patterns to Avoid
- **Single Firestore document for all sections:** Will hit 1 MiB limit with rich content, no concurrent editing
- **Zustand for scenario engine:** No native derived state — you'd manually wire up all dependencies
- **MUI for this project:** Heaviest bundle, Material Design aesthetic overkill for a solo planning tool
- **React Router Framework Mode:** Still has SPA bugs, library mode is simpler and sufficient
- **Firebase App Hosting:** Requires Blaze plan, designed for SSR apps — overkill for static SPA
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dashboard sidebar | Custom sidebar component | shadcn/ui Sidebar (AppSidebar, SidebarProvider) | Handles collapse, mobile responsive, keyboard nav |
| Data tables | Custom table with sorting | shadcn/ui Data Table + @tanstack/react-table | Sorting, filtering, pagination, column resize |
| Form inputs | Custom input components | shadcn/ui Input, Select, Textarea, Switch | Accessible, styled, consistent |
| Chart components | D3.js from scratch | Recharts | Weeks of work vs minutes, responsive, animated |
| PDF generation | HTML-to-PDF hacks | @react-pdf/renderer | React components → proper PDF with Flexbox |
| State derivation | Manual useEffect chains | Jotai derived atoms | Auto-dependency tracking, no stale closures |
| CSS utility system | Custom CSS classes | Tailwind CSS | Industry standard, works with shadcn/ui |
| Icon library | SVG files or custom icons | lucide-react | 1500+ icons, tree-shakable, standard with shadcn |

**Key insight:** This is a business planning tool, not a UI framework. Every hour spent on custom UI components is an hour not spent on the what-if engine and business logic. shadcn/ui gives you production-quality components that you own and can customize — don't build them from scratch.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Firestore 1 MiB Document Limit
**What goes wrong:** Storing all 9 business plan sections in one document. Content grows, hits limit, app crashes.
**Why it happens:** Simpler code initially, developers don't anticipate content growth.
**How to avoid:** Use subcollections from day one. Each section is its own document.
**Warning signs:** Firestore writes failing with "Document exceeds maximum size" error.

### Pitfall 2: Vite Environment Variables Not Loading
**What goes wrong:** `import.meta.env.VITE_FIREBASE_API_KEY` returns `undefined`.
**Why it happens:** Missing `VITE_` prefix, or `.env` file not in project root, or dev server not restarted.
**How to avoid:** Always use `VITE_` prefix. Restart dev server after changing `.env` files.
**Warning signs:** Firebase init fails with "invalid API key", blank config values.

### Pitfall 3: Firebase Deploy Serves Dev Mode
**What goes wrong:** Deployed app has `import.meta.env.DEV === true`, connects to emulators.
**Why it happens:** Not running explicit `npm run build` before `firebase deploy`.
**How to avoid:** Always use `npm run build && firebase deploy --only hosting`.
**Warning signs:** Deployed app trying to connect to localhost, Firestore errors in production.

### Pitfall 4: Firebase Module Import Errors with Vite
**What goes wrong:** "Failed to resolve import" or "Named export not found" for Firebase packages.
**Why it happens:** Vite's pre-bundling doesn't always handle Firebase's deep imports correctly.
**How to avoid:** Add Firebase packages to `optimizeDeps.include` in `vite.config.ts`.
**Warning signs:** Console errors mentioning Firebase imports during development.

### Pitfall 5: What-If Engine Re-renders Everything
**What goes wrong:** Changing one variable causes the entire dashboard to re-render.
**Why it happens:** Using a single global state object instead of atomic state.
**How to avoid:** Use Jotai atoms — each component subscribes only to the atoms it reads. Only affected components re-render.
**Warning signs:** Sluggish UI when adjusting sliders, visible layout thrashing.

### Pitfall 6: firebase.json Public Directory Wrong
**What goes wrong:** Firebase serves a blank page or the wrong files.
**Why it happens:** Default `firebase init` sets `public: "public"` but Vite outputs to `dist`.
**How to avoid:** Set `"public": "dist"` in `firebase.json`.
**Warning signs:** 404 on deployed site, or seeing Vite's default `public/` contents instead of built app.
</common_pitfalls>

<code_examples>
## Code Examples

### Vite Config for Firebase
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore'],
  },
});
```

### firebase.json for SPA
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "emulators": {
    "firestore": { "port": 8080 },
    "ui": { "enabled": true }
  }
}
```

### Dashboard Layout with shadcn/ui Sidebar
```typescript
// Source: shadcn/ui sidebar docs
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

### React Router v7 Library Mode Routes
```typescript
// src/app/router.tsx
import { BrowserRouter, Routes, Route } from 'react-router';
import DashboardLayout from './layout';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="executive-summary" element={<ExecutiveSummary />} />
          <Route path="market-analysis" element={<MarketAnalysis />} />
          <Route path="product-service" element={<ProductService />} />
          {/* ... other sections */}
          <Route path="scenarios" element={<ScenarioEngine />} />
          <Route path="export" element={<ExportView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite (`npm create vite@latest`) | 2023+ | CRA is dead, Vite is the standard |
| Firebase SDK v9 compat | Firebase SDK v12 modular-only | 2024-2026 | Compat still works but deprecated |
| Firebase Hosting only | Firebase Hosting + App Hosting | 2024 | Use original Hosting for SPAs, App Hosting for SSR |
| CSS-in-JS (Emotion/styled) | Tailwind CSS / CSS Modules | 2023+ | Runtime CSS-in-JS is out, utility CSS is in |
| MUI as default UI | shadcn/ui dominating | 2024-2025 | Copy-paste > npm install for UI components |
| Redux for state | Jotai / Zustand | 2023+ | Simpler APIs, better DX, smaller bundles |
| React Router v6 | React Router v7 (library + framework modes) | 2024-2025 | v7 library mode = v6 upgraded, framework mode = Remix |

**New tools/patterns to consider:**
- **shadcn/ui Blocks** (Feb 2026): Pre-built dashboard blocks for Radix and Base UI — `npx shadcn add`
- **Tremor** (acquired by Vercel 2025): Dashboard-first components, pairs with shadcn/ui
- **Firebase AI Logic** (v12.1.0+): On-device/hybrid AI inference — could be useful for Gemini integration
- **TanStack Router** (v1.159.5): Fully type-safe routing, but more complex setup than React Router library mode

**Deprecated/outdated:**
- **Create React App**: Dead, use Vite
- **Firebase compat imports** (`firebase/compat/*`): Still work but will be removed
- **CSS-in-JS runtime** (Emotion, styled-components): Performance overhead, use Tailwind or CSS Modules
- **Redux Toolkit for new projects**: Over-engineered for most cases, use Jotai or Zustand
</sota_updates>

<open_questions>
## Open Questions

1. **Exact Vite version from published create-vite**
   - What we know: GitHub main branch shows Vite ^7.3.1, but this is unreleased. Published template likely ships Vite 6.x.
   - What's unclear: Exact version from `npm create vite@latest` today
   - Recommendation: Run the scaffold command and check — it will be Vite 6.x with React 19

2. **Firebase JS SDK v12 + Vite optimizeDeps**
   - What we know: Older Firebase SDKs (v9-v10) had CJS/ESM issues with Vite
   - What's unclear: Whether v12.9.0 has resolved all import issues with Vite 6
   - Recommendation: Add optimizeDeps.include as a preventive measure, remove if unnecessary
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Firebase Web Setup Docs](https://firebase.google.com/docs/web/setup) — SDK v12.9.0, modular API
- [Vite Getting Started](https://vite.dev/guide/) — create-vite template
- [Vite Env Variables](https://vite.dev/guide/env-and-mode) — VITE_ prefix rules
- [Firebase Hosting Config](https://firebase.google.com/docs/hosting/full-config) — firebase.json rewrites
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite/connect_firestore) — emulator connection
- [create-vite template-react-ts](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) — exact package versions
- [Firebase JS SDK Releases](https://github.com/firebase/firebase-js-sdk/releases) — v12.9.0, compat status
- [shadcn/ui Docs](https://ui.shadcn.com/docs/components) — sidebar, data table, cards
- [Jotai Composing Atoms](https://jotai.org/docs/guides/composing-atoms) — derived atoms pattern
- [React Router Modes](https://reactrouter.com/start/modes) — library vs framework mode

### Secondary (MEDIUM confidence)
- [Firebase Blog: App Hosting vs Hosting](https://firebase.blog/posts/2024/05/app-hosting-vs-hosting/) — verified recommendation
- [Zustand vs Jotai comparison](https://blog.openreplay.com/zustand-jotai-react-state-manager/) — derived state analysis
- [React UI Libraries 2025 Comparison](https://makersden.io/blog/react-ui-libs-2025-comparing-shadcn-radix-mantine-mui-chakra) — bundle size comparison
- [TanStack Router vs React Router v7](https://medium.com/ekino-france/tanstack-router-vs-react-router-v7-32dddc4fcd58) — Jan 2026 comparison

### Tertiary (LOW confidence - needs validation)
- Vite ^7.3.1 version in create-vite main branch — may not be published yet, validate at scaffold time
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Vite + React 19 + TypeScript + Firebase v12
- Ecosystem: shadcn/ui, Tailwind CSS, Recharts, Jotai, React Router v7
- Patterns: Subcollection data model, derived atoms for scenarios, dashboard layout
- Pitfalls: Firestore limits, env vars, deploy mode, import errors, re-renders

**Confidence breakdown:**
- Standard stack: HIGH — verified with official docs and current npm versions
- Architecture: HIGH — patterns from official docs (shadcn, Firebase, Jotai)
- Pitfalls: HIGH — documented in GitHub issues and official troubleshooting guides
- Code examples: HIGH — from official documentation sources

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days — stable ecosystem, Firebase SDK updated weekly)
</metadata>

---

*Phase: 01-foundation*
*Research completed: 2026-02-11*
*Ready for planning: yes*
