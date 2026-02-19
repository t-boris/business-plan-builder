# Business Planning Platform

A multi-business planning and scenario calculator web app. Users create multiple businesses, each with configurable plan sections, financial scenario modeling with custom variables, and AI-powered content generation. The app emphasizes financial calculations and what-if scenarios as its core -- it is a business calculator first, document editor second.

## Tech Stack

- **Frontend:** React 19, Vite 7, TypeScript 5.9
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix primitives)
- **State:** Jotai (atomic state with derived computations)
- **Backend:** Firebase Auth (Google OAuth + email/password), Firestore
- **AI:** Google Gemini (`@google/genai`), Perplexity API (market research)
- **PDF Export:** `@react-pdf/renderer`
- **Charts:** Recharts

## Prerequisites

- Node.js 20+
- npm
- Firebase CLI: `npm i -g firebase-tools`
- gcloud CLI (only needed for `pull-prod` script)

## Getting Started

```bash
git clone git@github.com:<your-org>/my-business-planning.git
cd my-business-planning
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for details on each key. Firebase API keys are safe to expose in client code (access is restricted by Firestore security rules). AI provider keys are stored server-side in Firebase Functions secrets.

## Local Development

Start the Firestore/Functions/Storage emulators and the Vite dev server in two terminals:

```bash
# Terminal 1 -- Firestore + Functions + Storage emulators (8080/5001/9199, UI on port 4000)
npm run emulator

# Terminal 2 -- Vite dev server (port 5173)
npm run dev
```

In development mode, Firestore connects to its emulator by default. Storage and Functions emulators are opt-in via `VITE_USE_STORAGE_EMULATOR` and `VITE_USE_FUNCTIONS_EMULATOR` (see `.env.example`).

To seed your local emulator with production data:

```bash
# Requires: gcloud auth application-default login
npm run pull-prod
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server on port 5173 |
| `emulator` | `firebase emulators:start --only firestore,functions,storage ...` | Start Firestore + Functions + Storage emulators with persistent data |
| `pull-prod` | `node scripts/pull-prod-data.mjs` | Pull production Firestore data into the local emulator |
| `build` | `tsc -b && vite build` | TypeScript check + Vite production build |
| `lint` | `eslint .` | Run ESLint across the project |
| `preview` | `vite preview` | Preview the production build locally |

## Project Structure

```
src/
  app/          Router, layout, top-level providers
  components/   Shared UI components (sidebar, shadcn primitives)
  features/     Feature modules (businesses, sections, export, scenarios)
  hooks/        Shared React hooks (auth, market research)
  lib/          Utilities, Firebase client, AI clients, prompt definitions
  store/        Jotai atoms and derived state
  types/        TypeScript type definitions and Zod schemas
```

## Deployment

Build and deploy to Firebase Hosting:

```bash
# 1. Production build (TypeScript check + Vite)
npm run build

# 2. Deploy hosting
firebase deploy --only hosting

# 3. Deploy Firestore security rules (when changed)
firebase deploy --only firestore:rules
```

The app is deployed to `my-business-planning.web.app` (Firebase project: `my-business-planning`).

## Environment Variables

| Variable | Required | Description | Source |
|----------|----------|-------------|--------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Web API key | Firebase Console > Project Settings |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain | Firebase Console > Project Settings |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID | Firebase Console > Project Settings |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Cloud Storage bucket | Firebase Console > Project Settings |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | FCM sender ID | Firebase Console > Project Settings |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID | Firebase Console > Project Settings |
| `VITE_USE_FIRESTORE_EMULATOR` | No (dev) | Connect Firestore to localhost:8080 in dev | Default: `true` |
| `VITE_USE_STORAGE_EMULATOR` | No (dev) | Connect Storage to localhost:9199 in dev | Default: `false` |
| `VITE_USE_FUNCTIONS_EMULATOR` | No (dev) | Connect AI proxy calls to localhost:5001 in dev | Default: `false` |
| `VITE_FUNCTIONS_EMULATOR_HOST` | No (dev) | Functions emulator host when enabled | Default: `localhost` |
| `VITE_FUNCTIONS_EMULATOR_PORT` | No (dev) | Functions emulator port when enabled | Default: `5001` |

All variables are prefixed with `VITE_` so Vite exposes them to client code. AI provider keys are configured server-side in Firebase Functions secrets (`functions/.secret.local` for emulator/dev).

## Pre-Release Checklist

- [ ] `npm run build` passes (no TypeScript or bundler errors)
- [ ] `npm run lint` passes (no ESLint violations)
- [ ] Test key user flows: create business, edit section, scenario modeling, export PDF
- [ ] Verify `.env` is not committed (`git status` shows no `.env`)
- [ ] Firestore security rules are up to date (`firestore.rules`)
