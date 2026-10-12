# 0001 — Stack and pinned versions

- Status: accepted (Phase 0, 12.10.2026)

## Context

SPEC §4 fixes the stack. Several libraries had new major versions by October 2026, and one of them
can't be used yet.

## Decision

Exact versions are pinned in `package.json` (no `^` ranges), so installs are reproducible:

| Package           | Version | Note                                                                                                                         |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| typescript        | 6.0.3   | **Not 7.x.** TS 7 (the native Go port) is out, but `typescript-eslint` 8.71 only supports `<6.1`. Revisit when it adds TS 7. |
| vite              | 8.3.4   | Rolldown-based; `@vitejs/plugin-react` 6 requires Vite 8                                                                     |
| react / react-dom | 19.3.0  |                                                                                                                              |
| react-router      | 8.4.0   | Used in **data mode** (`createBrowserRouter` + `RouterProvider`), not framework mode — no server. Requires Node ≥ 22.22.     |
| tailwindcss       | 4.3.3   | CSS-first config (`@theme` in `src/index.css`), no `tailwind.config.js`                                                      |
| zod               | 4.6.6   |                                                                                                                              |
| dexie             | 4.4.6   |                                                                                                                              |
| zustand           | 5.0.15  |                                                                                                                              |
| ts-fsrs           | 5.4.2   | Installed now so DB card records mirror its `Card` type; used from Phase 3                                                   |
| vite-plugin-pwa   | 2.0.0   | `registerType: 'prompt'` so an update never reloads mid-lesson                                                               |
| vitest            | 5.0.4   | jsdom environment, v8 coverage                                                                                               |
| eslint            | 10.12.0 | Flat config only                                                                                                             |
| @playwright/test  | 1.64.0  |                                                                                                                              |

Extra dev dependencies approved in Phase 0: `yaml`, `jsdom`, `fake-indexeddb`, `@vitest/coverage-v8`,
`eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `@types/node` (plus their small helpers
`@eslint/js`, `globals`, `@testing-library/jest-dom`, `@testing-library/user-event`).

- **No `tsx`/`ts-node`:** Node ≥ 22.18 runs `.ts` files directly by stripping types. Scripts in
  `scripts/` therefore use only "erasable" TypeScript (no enums, no namespaces) and import other
  `.ts` files _with_ the `.ts` extension. `tsconfig` has `erasableSyntaxOnly` to enforce this.
- **No i18n library:** a typed dictionary (`src/i18n/en.ts`, `tr.ts`) + `translate()` is ~20 lines
  and adds no bundle weight. Plurals via `Intl.PluralRules` when first needed.
- **No icon library:** a handful of inline SVG paths in `src/ui/Icon.tsx`.
- `eslint-plugin-jsx-a11y` 6.10.2 hasn't declared ESLint 10 support (last release 2024) but works;
  the peer warning is silenced in `package.json` → `pnpm.peerDependencyRules`. If it breaks, drop it
  and rely on Playwright + axe checks in Phase 6.
- CI runs on Node 24 (LTS), pinned in `.node-version`.

## Consequences

Upgrades are deliberate: bump a version, run `pnpm check && pnpm build && pnpm e2e`, note it in
CHANGELOG.md.
