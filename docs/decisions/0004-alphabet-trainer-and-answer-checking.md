# 0004 — Alphabet trainer and answer checking

- Status: accepted (Phase 1, 12.10.2026)

## Generated alphabet exercises

Section 0 exercises are **generated at runtime** from `content/alphabet/alphabet.yaml` (letters,
lessons, reading words) instead of being authored one by one. Four types: intro card,
letter ↔ sound choice, read-the-word choice, type-the-word. Distractors target real confusions:
Latin look-alikes (в read as "b", н as "h") and similar sounds (ш / щ / ч, ъ / а).
`content:validate` enforces i+1 for reading words: each uses only letters already taught.

Each letter has a short `sound` label separate from its official transliteration, because the
Streamlined System writes both а and ъ as "a" (ъ gets "ă" in drills).

## Answer-check notes are codes, not text

SPEC §9 lists `notes: string[]`. The engine returns `{ code, expected?, actual? }` instead, and the
UI translates codes into EN/TR. This keeps the engine pure and language-independent. The engine
also adds `graded: false` for answers that should not count (typed in Latin letters), so the
learner can retype without a mistake being recorded.

Not done yet (needs lexicon data, Phase 2+): explanations for known error patterns (wrong article
form, clitic at sentence start, missing counting form, aspect). Strict tokens already block typo
tolerance on grammar words and produce a `grammar_token` note.

## Phonetic typing

A setting (on by default) converts Latin key presses to Cyrillic using the Bulgarian phonetic
layout (q → я, w → в, [ → ш, ] → щ, `→ ч, \ → ю, x → ь), verified against xkeyboard-config`symbols/bg`(variant`phonetic`). This lets desktop users type Bulgarian without installing a
keyboard layout. It only affects physical keyboards (on phones, keys arrive as text input, not
key presses).

## On-screen keyboard key size

Keys are 44 px tall but narrower than 44 px (10 keys per row must fit a 360 px phone), like any
phone keyboard. This meets WCAG 2.2 AA target size (24 px), not the 44 px SPEC target. Revisit in
the Phase 6 accessibility audit.
