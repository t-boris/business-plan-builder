# Technology Stack

**Analysis Date:** 2026-02-11

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (`package.json`, `tsconfig.app.json`)

**Secondary:**
- CSS - Global styles with Tailwind (`src/index.css`)
- JavaScript - Build configs (`eslint.config.js`, `vite.config.ts`)

## Runtime

**Environment:**
- Node.js (no version pinned, no `.nvmrc`)
- Browser runtime - ES2022 target (`tsconfig.app.json`)
- ESM module type (`package.json`: `"type": "module"`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.2.0 - UI framework (`package.json`)
- React Router 7.13.0 - Client-side routing (`src/app/router.tsx`)
- Jotai 2.17.1 - Atomic state management (`src/store/`)

**UI:**
- Tailwind CSS 4.1.18 - Utility-first CSS (`src/index.css`, `vite.config.ts`)
- Radix UI 1.4.3 - Headless component primitives (`src/components/ui/`)
- shadcn - Component library on Radix + Tailwind (`src/components/ui/`)
- Lucide React 0.563.0 - Icon library
- class-variance-authority 0.7.1 - CSS variant management
- clsx 2.1.1 + tailwind-merge 3.4.0 - Class utilities (`src/lib/utils.ts`)
- tw-animate-css 1.4.0 - Animation utilities

**Testing:**
- Not configured (no test framework installed)

**Build/Dev:**
- Vite 7.3.1 - Bundler + dev server (`vite.config.ts`)
- @vitejs/plugin-react 5.1.1 - React + Fast Refresh
- @tailwindcss/vite 4.1.18 - Tailwind Vite plugin
- TypeScript 5.9.3 - Type checking

**Linting:**
- ESLint 9.39.1 - Flat config (`eslint.config.js`)
- typescript-eslint 8.48.0 - TS rules
- eslint-plugin-react-hooks 7.0.1 - Hooks rules
- eslint-plugin-react-refresh 0.4.24 - Fast Refresh rules

## Key Dependencies

**Critical:**
- Jotai 2.17.1 - All state management (`src/store/*.ts`)
- Firebase 12.9.0 - Auth + Firestore database (`src/lib/firebase.ts`)
- @google/generative-ai - Gemini AI content generation (`src/lib/ai/gemini-client.ts`)
- Zod 4.3.6 - Schema validation for AI responses (`src/lib/ai/section-prompts.ts`)
- zod-to-json-schema 3.25.1 - Converts Zod to JSON Schema for Gemini

**Infrastructure:**
- Recharts 3.7.0 - Financial projection charts (`src/features/dashboard/`)
- @react-pdf/renderer 4.3.2 - PDF generation (`src/features/export/pdf/`)
- html2canvas 1.4.1 - Chart screenshot capture for PDF
- file-saver 2.0.5 - Browser file download

## Configuration

**Environment:**
- `.env` files with `VITE_*` prefix (Vite convention)
- Required vars (from `.env.example` and `src/lib/firebase.ts`):
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_GEMINI_API_KEY`
  - `VITE_PERPLEXITY_API_KEY`

**Build:**
- `vite.config.ts` - Vite config with React, Tailwind plugins, `@/` path alias, Firebase optimizeDeps
- `tsconfig.json` - References `tsconfig.app.json` + `tsconfig.node.json`
- `tsconfig.app.json` - Strict mode, ES2022, path alias `@/*` -> `./src/*`

## Platform Requirements

**Development:**
- Any platform with Node.js
- Firebase Firestore emulator on port 8080 (`firebase.json`, `src/lib/firebase.ts`)

**Production:**
- Firebase Hosting - SPA with `dist/` as public directory (`firebase.json`)
- Browser: ES2022-compatible

---

*Stack analysis: 2026-02-11*
*Update after major dependency changes*
