# Changelog

All notable changes. Format: [Keep a Changelog](https://keepachangelog.com/); dates DD.MM.YYYY.

## [Unreleased]

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
