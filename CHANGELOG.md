# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com/); dates DD.MM.YYYY.

## [Unreleased]

### Phase 1 — Alphabet + answer-check engine (12.10.2026)

- Answer-check engine (SPEC §9): NFC, stress-mark stripping that keeps ѝ, и-for-ѝ accepted with a
  note, Latin look-alike conversion, "type in Cyrillic" for Latin input (not counted as a mistake),
  optional Streamlined transliteration, alternation syntax `{a|b}` with a cap, typo tolerance
  (one edit in words of 5+ letters, never in strict grammar words), closest answer and word diff.
  102 table-driven tests; CI requires ≥95% coverage (currently ~99% of branches).
- Exercise registry (one folder per type) and a session player: Check / Continue, Enter and number
  keys, wrong answers recycled to the end, feedback with highlighted mistakes and notes.
- Section 0 alphabet trainer: 30 letters in 6 lessons (4 difficulty groups), 44 reading words
  (including Turkish loanwords), letter chart with sound hints in EN/TR, mixed practice, progress
  saved per lesson and to the review log. All content `ai_draft`.
- On-screen Cyrillic keyboard (phonetic layout order, with physical key hints) and "phonetic typing"
  for desktop (Latin keys → Cyrillic), both toggleable in Settings.
- Device text-to-speech fallback (Listen button only if the device has a Bulgarian voice).
- Validator: alphabet checks (all 30 letters, transliteration, i+1 for reading words).
- Fix: the "ready offline" notice no longer covers the lesson buttons on phones.
- ADR 0004 (alphabet trainer and answer checking).

### Phase 0 — Foundations (12.10.2026)

- Project scaffold: Vite 8 + React 19 + TypeScript 6 (strict), Tailwind 4, React Router 8, Zustand,
  Dexie, Zod 4, vite-plugin-pwa; ESLint 10, Prettier, Vitest 5, Playwright.
- App shell: course path (empty), Practice, Words, Grammar, Profile, Settings; bottom nav on phones,
  sidebar on desktop; light/dark themes from CSS design tokens with a contrast test.
- Original identity: name Щъркел / Shtarkel, placeholder stork mark, blue/orange palette.
- i18n: English and Turkish UI dictionaries with a key-parity test.
- Content schemas (Zod) for lexemes, grammar points, units, lessons and 7 exercise types.
- Local database (IndexedDB via Dexie) with versioned schema; Export / Import / Reset progress.
- Content pipeline: `content:build` (YAML → JSON) and `content:validate` (structure, duplicate ids,
  references, forbidden letters, Latin look-alikes, Russianisms list).
- CI: typecheck, lint, format, unit tests with coverage, content validation, build, bundle-size
  budget, Playwright e2e on phone and desktop viewports.
- Decisions: ADR 0001 (stack/versions), 0002 (inline stress marks), 0003 (bundle budget).
