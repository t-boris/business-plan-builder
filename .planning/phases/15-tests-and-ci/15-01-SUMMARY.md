---
phase: 15-tests-and-ci
plan: 01
subsystem: test-infrastructure
tags: [vitest, testing, unit-tests, formula-engine]

requires: []
provides:
  - Vitest test infrastructure configured and working
  - npm scripts: test, test:run, test:watch, verify
  - Formula-engine unit tests (14 tests, 3 functions fully covered)
affects:
  - vitest.config.ts
  - src/test/setup.ts
  - package.json
  - package-lock.json
  - src/lib/__tests__/formula-engine.test.ts

tech-stack:
  added:
    - vitest@4.0.18
    - jsdom@28.1.0
    - "@testing-library/react@16.3.2"
    - "@testing-library/user-event@14.6.1"
    - "@testing-library/jest-dom@6.9.1"
  patterns:
    - "Vitest with jsdom environment and globals for describe/it/expect"
    - "Test setup file importing @testing-library/jest-dom for DOM matchers"
    - "Inline fixture factories (inputVar, computedVar) for test data"

key-files:
  created:
    - vitest.config.ts
    - src/test/setup.ts
    - src/lib/__tests__/formula-engine.test.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Used separate vitest.config.ts (not merged into vite.config.ts) for clean separation of build and test config"
  - "Mirrored @ alias and __APP_VERSION__ define from vite.config.ts"
  - "Set passWithNoTests: true so vitest run exits cleanly when no test files exist"
  - "verify script uses 'eslint . && vitest run && vite build' (skips tsc -b due to pre-existing type errors)"
  - "Test file uses inline fixture factories rather than shared test utilities (sufficient for single test file)"

patterns-established:
  - "Test files live in __tests__ directories adjacent to source (e.g., src/lib/__tests__/)"
  - "Pure logic modules are tested first (no React rendering, no mocking needed)"
  - "Factory functions for VariableDefinition test fixtures"

issues-created: []

duration: 10min
completed: 2026-02-18
---

# Phase 15 Plan 01: Vitest Infrastructure and Formula-Engine Tests

**Set up Vitest test infrastructure with jsdom, @testing-library, and npm scripts. Wrote 14 unit tests covering all 3 exported functions in the formula-engine module. All tests pass.**

## Performance

- **Duration:** 10 min
- **Tasks:** 2
- **Files created:** 3
- **Files modified:** 2

## Accomplishments

### Task 1: Test Infrastructure

- Installed vitest, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom as dev dependencies
- Created `vitest.config.ts` with jsdom environment, globals: true, @ alias, __APP_VERSION__ define, and passWithNoTests
- Created `src/test/setup.ts` importing @testing-library/jest-dom for DOM matchers
- Added npm scripts: `test` (interactive), `test:run` (CI), `test:watch` (dev), `verify` (lint + test + build)
- Verified vitest runs cleanly with 0 tests

### Task 2: Formula-Engine Unit Tests (14 tests)

- **getEvaluationOrder** (4 tests): input-only returns empty, linear chain ordering, diamond dependency graph, circular dependency throws
- **evaluateVariables** (6 tests): input passthrough, computed evaluation, multi-level chain, bad formula returns 0 gracefully, empty variables, percent-unit variables
- **validateFormula** (4 tests): valid formula, unknown variable reference, syntax error, empty formula

## Task Commits

Each task was committed atomically:

1. **Task 1: Vitest infrastructure and npm scripts** - `4f837f8`
2. **Task 2: Formula-engine unit tests** - `5351b47`

## Files Created/Modified

- `vitest.config.ts` - Vitest configuration with jsdom, globals, aliases, defines
- `src/test/setup.ts` - Test setup importing @testing-library/jest-dom
- `src/lib/__tests__/formula-engine.test.ts` - 14 unit tests for all 3 exported functions
- `package.json` - Added test/test:run/test:watch/verify scripts + dev dependencies
- `package-lock.json` - Lockfile updated with 81 new packages

## Decisions Made

- Kept vitest.config.ts separate from vite.config.ts for clean separation (test config does not need React plugin or tailwind)
- Used `passWithNoTests: true` so the verify script does not fail when run before any test files exist
- Skipped `tsc -b` in verify script due to pre-existing type errors in the codebase
- Used inline factory functions (inputVar, computedVar) rather than a shared test-utils module

## Deviations from Plan

- Added `passWithNoTests: true` to vitest config (not in original plan, but needed for vitest run to exit 0 with no tests)
- Removed triple-slash reference (`/// <reference types="vitest/config" />`) to fix eslint error; the import from `vitest/config` is sufficient
- verify script uses `vite build` instead of `tsc -b && vite build` (pre-existing type errors)

## Issues Encountered

- Pre-existing eslint errors in the codebase (14 errors, 7 warnings across various source files). These are not related to the test infrastructure and were not introduced by this plan.

## Verification

- [x] `npx vitest run` passes all 14 tests
- [x] New files pass eslint with 0 errors
- [x] Formula engine tests cover: evaluation order, variable evaluation, formula validation

## Next Phase Readiness

- Vitest is fully configured and running
- Pattern established for pure-logic unit tests
- Ready for 15-02 (hook/component tests) and 15-03 (CI pipeline)

---
*Phase: 15-tests-and-ci*
*Completed: 2026-02-18*
