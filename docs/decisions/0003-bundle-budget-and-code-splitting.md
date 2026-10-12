# 0003 — Initial bundle budget and code splitting

- Status: accepted (Phase 0, 12.10.2026)

## Context

SPEC §17 caps initial JS at 200 KB gzip. With an empty app shell the libraries alone already weigh
~158 KB gzip (measured with a sourcemap, raw sizes): react-dom ~202 KB, dexie ~93 KB, zod ~90 KB,
react-router ~90 KB, app code ~27 KB.

## Decision

- The course path (landing page) is in the initial bundle; **every other route is lazy-loaded**
  (`lazy` in `src/app/routes.tsx`). The lesson player, practice and alphabet trainer must be lazy
  routes too. The service worker precaches all chunks, so lazy routes still work offline.
- `pnpm size` (`scripts/bundle-size.ts`) measures the scripts referenced by `dist/index.html` and
  fails CI above 200 KB.
- Motion (animations) will be loaded lazily / via `LazyMotion` when it is introduced.

## If the budget gets tight

Biggest available saving: switch runtime validation to `zod/mini` (tree-shakeable, roughly
−20 KB gzip) while build scripts keep full `zod`. Not done now because the classic API is easier to
read and the budget still has ~40 KB headroom.
