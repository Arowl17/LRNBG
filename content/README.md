# Course content

Human-editable YAML. `pnpm content:build` compiles it to JSON in `public/content/`;
`pnpm content:validate` checks it (see SPEC.md §12). All new items start as
`reviewStatus: ai_draft`.

| Folder        | One file holds                                                |
| ------------- | ------------------------------------------------------------- |
| `lexicon/`    | a list of lexemes (words/phrases), grouped by topic           |
| `grammar/`    | a list of grammar points with EN/TR tips                      |
| `units/`      | one unit: `unit:` plus its `lessons:` (with exercises inline) |
| `stories/`    | short dialogues/stories (Phase 4)                             |
| `validators/` | data used by the validator, e.g. `russianisms.yaml`           |

Stress: write U+0301 (combining acute accent) right after the stressed vowel — `кафе́`,
`градове́`. See `docs/decisions/0002-inline-stress-marks.md`.

Accepted answers use alternation: `{Аз |}обичам {кафе|кафето}.` → 4 answers; the first
expansion is the one shown to learners.
