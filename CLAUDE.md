# CLAUDE.md — operational rules for Claude Code

`SPEC.md` is the source of truth. This file is the short version. Keep it updated.

## Current phase

**Phase 1 — Alphabet + answer-check engine: done (awaiting owner review).** Next: Phase 2
(lesson player for course units, Phase-2 exercise types, audio pipeline, A1 units 1–3).
Never start a phase without the owner's go-ahead; start each with a plan (SPEC §18).

## Owner

Beginner coder on **Windows** — explain briefly, give PowerShell-friendly commands, numbered steps
for anything manual. Native Turkish, fluent English, Bulgarian A1.

## Commands

| Command                                                | What it does                                                      |
| ------------------------------------------------------ | ----------------------------------------------------------------- |
| `pnpm dev`                                             | build content, start dev server (http://localhost:5173)           |
| `pnpm check`                                           | typecheck + lint + format check + unit tests + content validation |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Vitest unit tests                                                 |
| `pnpm build` then `pnpm size`                          | production build; enforce 200 KB gzip initial JS                  |
| `pnpm e2e`                                             | Playwright against the build (run `pnpm build` first)             |
| `pnpm content:validate` / `pnpm content:build`         | check / compile `content/` YAML                                   |
| `pnpm format`                                          | auto-format with Prettier                                         |

In the cloud container, Playwright needs `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## Where things live

- `content/` — YAML course content (+ `REVIEW_QUEUE.md`, `ATTRIBUTION.md`, `validators/`)
- `scripts/` — Node scripts run directly as `.ts` (`lib/content.ts` holds loader + checks)
- `src/content/schema.ts` — Zod schemas for all content (shared by scripts and app)
- `src/db/` — Dexie DB (`db.ts`), record schemas (`records.ts`), backup export/import (`backup.ts`)
- `src/i18n/` — `en.ts`, `tr.ts` (same keys, enforced by test); `useT()` hook
- `src/app/` — router (`routes.tsx`), layout, Zustand user store
- `src/features/<feature>/` — pages; `src/engine/` — pure logic (answer-check, srs, session, gamification)
- `src/engine/answer-check/` — the answer checker (SPEC §9); `checkAnswer()` is the entry point
- `src/features/exercises/<type>/` — one folder per exercise type; register it in `registry.ts`
- `src/features/lesson/ExerciseSession.tsx` — runs any list of exercises (Check/Continue, recycling)
- `src/engine/session/alphabet.ts` — generates Section 0 exercises from `content/alphabet/`
- `src/features/keyboard/layout.ts` — phonetic keyboard map (verified against xkeyboard-config)
- `src/ui/` — design tokens (`tokens.css`) and shared components
- `docs/decisions/` — ADRs; `CHANGELOG.md`

## Conventions

- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`…), small commits.
- No hardcoded UI strings — add keys to both `en.ts` and `tr.ts`.
- Colours only via tokens (`bg-surface`, `text-fg-muted`…); never raw hex in components.
- New pages are lazy routes (bundle budget, ADR 0003).
- DB schema change → new `version(N)` block in `db.ts`, never edit old ones; add a test.
- New _setting_ or other additive field → add it to the Zod record schema with `.default(...)`;
  `loadOrCreateUser` and backup import parse records, so old data gets the default. No migration.
- Scripts: erasable TS only, import local files with the `.ts` extension.
- Dates `DD.MM.YYYY`, 24h time (`src/lib/format.ts`); metric; euro.
- Ask before: new dependencies, breaking schema changes, anything that costs money, deleting content.
- Never weaken a test or validator to make it pass.

## Bulgarian content rules (the #1 risk)

- Never invent linguistic facts. Unsure → `reviewStatus: ai_draft` + entry in `content/REVIEW_QUEUE.md`
  with the specific doubt. Never mark own output `native_verified`.
- Watch for Russian leaking in (ы э ё, Russianisms list). Stress = U+0301 after the vowel (ADR 0002).
- Only strip U+0301 — `ѝ` ≠ `и`.

## Gotchas

- TypeScript is pinned to 6.0.x because typescript-eslint doesn't support 7 yet (ADR 0001).
- `eslint-plugin-jsx-a11y` peer warning for ESLint 10 is expected and silenced.
- React Router 8 needs Node ≥ 22.22 (CI uses Node 24).
- `public/content/` is generated — don't edit or commit it.
- When editing files with scripts, **assert the old text matched**: Prettier reflows code, and a
  silent no-op replacement once dropped the alphabet checks and the alphabet routes.
- Official transliteration of ъ is "a": България → "Balgaria" (not "Bulgaria").
- The "offline ready" toast sits at the top on phones so it never covers lesson buttons.
