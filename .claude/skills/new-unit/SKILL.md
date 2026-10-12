---
description: Create a new course unit end to end — plan, generate YAML, adversarial review, validate (SPEC §16).
argument-hint: <unit number and topic, e.g. "4 definite article">
disable-model-invocation: true
---

Create the course unit: $ARGUMENTS

Follow SPEC.md §16 exactly, in this order, and stop where it says to stop.

1. **Unit plan first.** Write the plan into `docs/plans/` (goals; grammar ids; lexeme list with
   frequency rationale; lesson breakdown with 3–7 new words each; sample sentences; doubts marked
   ⚠). Show it to the owner and **wait for approval** before generating anything.
2. **Generate** (after approval), all with `reviewStatus: ai_draft` and `sources: [own]`:
   - lexemes → `content/lexicon/<unit>.yaml` (stress with U+0301; forms used in the unit);
   - grammar tips → `content/grammar/<unit>.yaml` (short EN + TR, examples);
   - unit + lessons + exercises → `content/units/<unit>.yaml`. Recognition before production;
     8–15 exercises per lesson; every new word ≥3× in ≥2 exercise types; distractors that target
     the unit's grammar; generous `accepted` lists; `strictTokens` for grammar words.
3. **Review**: run the `bg-content-reviewer` subagent on the new files. Fix clear problems; leave
   doubtful ones in `content/REVIEW_QUEUE.md`.
4. **Validate**: `pnpm content:validate` until there are 0 errors; explain any warnings you keep.
5. Run `pnpm test` and report what was created, what is uncertain, and what needs native review.

Never invent linguistic facts. If unsure, keep the item `ai_draft` and write the doubt down.
