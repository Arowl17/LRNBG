# 0002 — Stress is written inline (U+0301), not stored as an index

- Status: accepted (Phase 0, 12.10.2026). Changes SPEC §6.1 `stressIndex`.

## Context

SPEC §6.1 gave each lexeme a `stressIndex` on its lemma. Bulgarian stress is free and often moves
between forms of the same word (singular vs plural vs definite form), so one index on the lemma
can't drive `stress_tap` exercises or stress display for inflected forms.

## Decision

Every Bulgarian string that should show stress carries the combining acute accent **U+0301**
directly after the stressed vowel: `lemma: кафе́`, `forms: { pl: кафета́ }`. Stress positions are
derived with `stressIndices()` in `src/content/stress.ts`; `stripStress()` removes them.

- The schema rejects a U+0301 that doesn't follow a vowel, and non-NFC text.
- Only U+0301 is ever stripped. Never strip all combining marks: `ѝ` (U+045D, "her") vs `и`
  ("and") is a real distinction (SPEC §9.2).
- Exercise sentences normally have no stress marks (normal Bulgarian writing); the display
  setting (always / new words / never) decides when the app shows lexeme stress.

## Consequences

- No `stressIndex` field; one source of truth per form.
- The answer checker must strip U+0301 from learner input and accepted answers before comparing
  (already planned in SPEC §9.2).
- Authors need a way to type U+0301 — documented in `content/README.md`; the review export
  (Phase 4) will show stress visibly.
