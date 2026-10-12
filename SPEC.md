# SPEC — Bulgarian Learning App (build brief for Claude Code)

> **How to use this file:** put it in the root of an empty project folder as `SPEC.md`, open Claude Code there and say:
> *"Read SPEC.md fully. Fill in nothing yourself from the Config block — ask me about any `{{…}}` I left blank. Then start Phase 0 in plan mode."*
> Keep this file in the repo. It is the source of truth across sessions; `CLAUDE.md` (which you will generate in Phase 0) is the short operational summary.

---

## 0. Config (fill these in before starting)

| Key | Value |
|---|---|
| `{{APP_NAME}}` | *(working name — must NOT contain "Duolingo", "Duo", or anything confusable)* |
| `{{MY_CODING_LEVEL}}` | *(none / beginner / can read code / professional)* — controls how much you explain |
| `{{SOURCE_LANGUAGES}}` | English, Turkish |
| `{{MY_BULGARIAN_LEVEL}}` | A1 |
| `{{TARGET_CEFR_SCOPE_V1}}` | Cyrillic + A1, then A2 |
| `{{OS}}` | *(Windows / macOS / Linux)* |
| `{{TTS_PROVIDER}}` | Azure AI Speech (default — see §11) |
| `{{GITHUB_REPO}}` | *(empty for now / owner/name)* |

---

## 1. Your role and the mission

You are the **lead engineer, learning designer, and QA lead** for `{{APP_NAME}}`: a Duolingo-*style* (not Duolingo-*branded*) web app for learning **Bulgarian**, which Duolingo does not offer.

Primary user: me — an A1 learner whose native language is Turkish and who is fluent in English. Secondary users (later): people I share it with, including learners coming from English or Turkish.

What "done well" means, in priority order:

1. **The Bulgarian is correct.** A beautiful app that teaches wrong Bulgarian is worse than no app. Linguistic accuracy beats features, always.
2. **It actually teaches.** Short lessons, spaced repetition, immediate feedback, explicit grammar where Bulgarian needs it (articles, aspect, clitics, counting form).
3. **It's fun and habit-forming** without being manipulative.
4. **It costs ~€0 to run** for a single user and stays cheap when shared.
5. **It's maintainable by a solo owner** — boring, well-documented choices over clever ones.

---

## 2. Non-negotiables

- **No Duolingo IP.** No name, owl, green-owl palette clones, sound effects, illustrations, copy, or UI screenshots used as assets. Mechanics (lessons, XP, streaks) are fine; trade dress is not. Create an original identity. Mascot suggestion: a stork (щъркел) or hedgehog (таралеж) — your call, but original.
- **Never invent linguistic facts.** If you are not sure a Bulgarian form, stress, or usage is correct, mark the item `reviewStatus: "ai_draft"` and add it to `content/REVIEW_QUEUE.md` with your specific doubt. Never mark your own output as verified.
- **Local-first.** The app must be fully usable offline with no account. Accounts/sync come in a later phase and are optional for the user.
- **No dependency or architecture swaps without asking.** The stack in §4 is decided. Propose changes with a reason; don't just do them.
- **Verify, don't assume, current tooling.** Before installing anything, check the current stable version and current API of each library (docs/changelog). Don't write code against APIs from memory if they may have changed.
- **Metric units and European formats** everywhere (dates `DD.MM.YYYY` in BG/TR UI, 24h time, euro prices).

---

## 3. Who the learner is (design for this)

- Turkish native → Bulgarian has hundreds of **Turkish loanwords** (turcisms). This is a huge free advantage; exploit it (§13).
- Knows English well → English is the default source language; Turkish is a full second source language.
- Learns on a **phone** in short bursts and on a **desktop** with a physical keyboard. Both must be first-class.
- Will type Bulgarian on keyboards that may not have Cyrillic → on-screen Cyrillic keyboard is mandatory.

---

## 4. Tech stack (decided)

| Concern | Choice | Why |
|---|---|---|
| Build / framework | **Vite + React + TypeScript (strict)** | No server needed; static site is free to host and works offline |
| Styling | **Tailwind CSS** + CSS variables for design tokens | Fast iteration, easy dark mode |
| Routing | React Router | Standard |
| App state | Zustand | Small, simple |
| Persistence | **Dexie (IndexedDB)** | Local-first progress storage with schema migrations |
| Offline / install | `vite-plugin-pwa` (Workbox) | Installable on phone, offline lessons and audio |
| Spaced repetition | **`ts-fsrs`** (FSRS algorithm) | Modern, better than SM-2; TS-native |
| Schemas | **Zod** | One schema validates content at build time and data at runtime |
| Content source format | **YAML** in `content/`, compiled to JSON at build | Human-editable by me and by native reviewers |
| Animation | Motion (Framer Motion) — sparingly | Feedback feel |
| Tests | **Vitest** + Testing Library; **Playwright** for e2e | |
| Package manager | pnpm | |
| CI | GitHub Actions | typecheck, lint, test, content validation on every push |
| Hosting | Cloudflare Pages (static) | Free, fast, global |
| Later: accounts & sync | Supabase (Auth + Postgres + Row Level Security) | Only progress/user data goes to the backend; content stays static |

Not Next.js: there is no server-side need in v1, and a pure static PWA is simpler, cheaper, and better offline.

---

## 5. Repository layout (target)

```
/
├─ SPEC.md                    # this file (source of truth)
├─ CLAUDE.md                  # short operational rules for Claude Code (you write it in Phase 0)
├─ content/
│  ├─ lexicon/                # one YAML per lexeme group; canonical word data
│  ├─ grammar/                # grammar point definitions + learner-facing notes
│  ├─ units/                  # unit → lessons → exercises (YAML)
│  ├─ stories/                # short dialogues/stories
│  ├─ REVIEW_QUEUE.md         # items needing native-speaker review, with your doubts
│  └─ ATTRIBUTION.md          # every third-party source + license
├─ scripts/
│  ├─ content-build.ts        # YAML → validated JSON bundles
│  ├─ content-validate.ts     # all linguistic + structural validators (§12)
│  ├─ audio-build.ts          # incremental TTS generation (§11)
│  └─ content-stats.ts        # coverage report (words per unit, CEFR coverage, review status)
├─ src/
│  ├─ app/                    # shell, routing, layout
│  ├─ features/
│  │  ├─ path/                # course map / skill tree
│  │  ├─ lesson/              # lesson player
│  │  ├─ exercises/           # one folder per exercise type, shared interface
│  │  ├─ practice/            # SRS review sessions
│  │  ├─ alphabet/            # Cyrillic trainer
│  │  ├─ profile/             # stats, streak, settings, backup
│  │  └─ keyboard/            # on-screen Cyrillic keyboard
│  ├─ engine/
│  │  ├─ answer-check/        # normalization, matching, typo tolerance, diffing
│  │  ├─ srs/                 # ts-fsrs wrapper + rating mapping
│  │  ├─ session/             # lesson/practice session composer
│  │  └─ gamification/        # XP, streaks, goals, achievements
│  ├─ db/                     # Dexie schema + migrations
│  ├─ content/                # typed loaders for compiled bundles
│  ├─ i18n/                   # UI strings EN/TR (later BG)
│  └─ ui/                     # design system components
├─ public/audio/              # generated audio, content-hashed filenames
└─ tests/                     # e2e (Playwright)
```

---

## 6. Data model

Write these as Zod schemas in `src/content/schema.ts` and derive TS types from them. Below is the intent; refine but don't drop fields without telling me.

### 6.1 Lexeme (the atomic thing being learned)

```ts
Lexeme {
  id: string                       // stable slug, e.g. "lex.kafe"
  lemma: string                    // dictionary form, Cyrillic. Verbs: 1st person sg present (Bulgarian has no infinitive)
  stressIndex: number              // index of stressed vowel in lemma (stress is unmarked in normal writing but learners need it)
  pos: "noun"|"verb"|"adj"|"adv"|"pron"|"num"|"prep"|"conj"|"part"|"interj"|"phrase"
  gender?: "m"|"f"|"n"             // nouns
  forms?: Record<string,string>    // e.g. { pl, def_sg_full, def_sg_short, def_pl, count_form, voc } for nouns;
                                   // { pres_1sg..pres_3pl, aor_*, imp_*, imperative_* } for verbs
  aspect?: "pf"|"ipf"              // verbs
  aspectPartnerId?: string         // perfective/imperfective pair
  translations: { en: string[]; tr: string[] }   // first entry = primary gloss
  turcism?: { trSource: string; note?: string; falseFriend?: boolean }
  cefr: "A1"|"A2"|"B1"|"B2"
  frequencyRank?: number
  tags: string[]                   // topic tags: food, family, travel…
  reviewStatus: "ai_draft"|"self_checked"|"native_verified"
  sources: string[]                // ids from ATTRIBUTION.md
}
```

### 6.2 Grammar point

```ts
GrammarPoint {
  id: string                       // "gram.definite-article.masc-full-short"
  title: { en: string; tr: string }
  cefr: …
  explanation: { en: string; tr: string }   // short markdown "Tips" shown before/inside lessons
  examples: { bg: string; en: string; tr: string }[]
  prerequisites: string[]
  reviewStatus: …
}
```

### 6.3 Course structure

```ts
Unit { id, order, title{en,tr}, cefr, goals{en,tr}[], grammarIds[], lessonIds[], checkpoint?: boolean }
Lesson { id, unitId, order, newLexemeIds[], grammarIds[], exercises: Exercise[] }   // 8–15 exercises, 3–7 new words max
```

### 6.4 Exercise (discriminated union on `type`)

Every exercise has: `id`, `type`, `targets` (lexeme/grammar ids it trains — this is what feeds the SRS), `prompt`, `accepted` (see §9), `reviewStatus`. Types in §8.

### 6.5 Progress (Dexie)

```
cards        // one per (targetId, direction) — FSRS state from ts-fsrs
reviewLog    // every answer: exerciseId, targets, correct, rating, latencyMs, inputMode, timestamp
lessonState  // per lesson: completed, bestAccuracy, completedAt, timesCompleted
userState    // xp, streak, streakFreezes, dailyGoalXp, settings, sourceLanguage
reports      // "report a problem" submissions (§16)
meta         // schema version, content version
```

Include **versioned migrations** from day one. Include **Export/Import progress as JSON** in Settings in the same phase you create the DB — local-only data is one cleared browser away from gone.

---

## 7. Curriculum design

### 7.1 Principles
- **i+1:** each exercise may contain at most one unknown element. The validator enforces that every Bulgarian word in an exercise is either introduced in this lesson or earlier.
- **New-word budget:** 3–7 new lexemes per lesson; each new word appears ≥3 times in its lesson across different exercise types.
- **Explicit grammar for Bulgarian's hard parts**, implicit for the rest. Short "Tips" cards, never walls of text.
- **Recognition before production:** BG→source and tap-the-tiles before free typing BG.
- **Checkpoints** at the end of every ~4 units: mixed review, must pass to "crown" the section (skipping ahead allowed via test-out).
- **Real-life content:** greetings, café/food, family, directions, shopping (prices in **euro** — Bulgaria adopted the euro on 1 Jan 2026; verify, and treat лев/стотинка as legacy vocabulary still heard), transport, time, weather, phone/texting phrases.

### 7.2 Section 0 — Cyrillic (Bulgarian alphabet, 30 letters)
Separate alphabet trainer, not just lessons:
- Letter ↔ sound, letter groups introduced by difficulty: (1) same as Latin: а, е, к, м, о, т; (2) false friends: в, н, р, с, у, х; (3) new shapes: б, г, д, ж, з, и, й, л, п, ф, ц, ч, ш; (4) Bulgarian specials: **щ = "sht"**, **ъ = a vowel (schwa)**, **ь only in "ьо"**, ю, я.
- Read-the-word drills using real, already-familiar words (turcisms are perfect here: чанта, кафе, чорба).
- Typing drills on the on-screen keyboard.
- Handwriting/italic forms are a later nice-to-have.

### 7.3 A1 skeleton (refine, but keep the grammar sequencing logic)
1. Greetings & politeness — здравей/здравейте, добро утро, добър ден, добър вечер, благодаря, мерси, моля, довиждане, чао. Cultural note: head gestures for yes/no are commonly reversed vs. most of Europe.
2. **съм** + personal pronouns; pro-drop ("Аз съм…" / "Студент съм.")
3. Noun gender by ending (-consonant m / -а,-я f / -о,-е n) and plurals
4. **Definite article** — postfixed: -ът/-ят (full) vs -а/-я (short) for masculine; -та, -то, -те. Full form when the noun is the subject; short form otherwise.
5. Present tense — the three conjugation types; **имам / нямам**; negation **не**; questions with **ли**
6. Numbers 0–100, prices, age; **counting form** for masculine nouns (два стола, три града); **двама/трима** for male persons
7. Food & café (turcism-rich unit)
8. Family & possessives — long forms (моят, моята…) and **short possessive clitics** (майка ми, баща ти)
9. Time, days, months
10. **Clitic pronouns** (го, я, ги, ми, ти, му, ѝ, ни, ви, им) and **placement**: never sentence-initial (Виждам го. / Аз го виждам. — but not *Го виждам.)
11. Future: **ще** + present; negative future **няма да** + present
12. Past: **aorist** for completed events (core past for A1)
13. **да-constructions** (no infinitive): Искам да ям. Трябва да тръгвам.

### 7.4 A2 → B1 (later phases)
Verb **aspect** pairs and choice; imperfect vs aorist; perfect; imperative; comparative/superlative (по-, най-); vocative; reflexive се/си; conditional бих; relative pronouns (който, която…); and at B1, an introduction to the **renarrative mood** (преизказно наклонение) with recognition-first exercises.

---

## 8. Exercise types

Shared interface: `render(props)`, `check(answer) → CheckResult`, `targets`, keyboard shortcuts, accessible labels, reduced-motion support. Build a registry so adding a type is one folder.

| Type | Description | Phase |
|---|---|---|
| `alphabet_*` | letter↔sound, read-the-word, type-the-word | 1 |
| `select_meaning` | BG word/phrase → choose meaning (4 options, plausible distractors from same unit/POS) | 2 |
| `tiles_translate` | Build the translation from word tiles (both directions); distractor tiles chosen to target likely errors (e.g., wrong article form) | 2 |
| `type_translate` | Free typing, both directions | 2 |
| `listen_tiles` | Hear BG, build it from tiles | 2 |
| `listen_type` | Dictation | 2 |
| `match_pairs` | 5 pairs: BG↔meaning, audio↔text | 2 |
| `fill_blank` | Grammar-targeted blank with options (article form, verb ending, clitic) | 2 |
| `stress_tap` | Tap the stressed syllable — **Bulgarian-specific**, stress is free and meaning-relevant | 3 |
| `reorder_clitic` | Put words in a valid order; multiple valid orders allowed | 4 |
| `conjugate` | Produce a verb form in context | 4 |
| `aspect_choice` | Pick pf/ipf in context, with explanation on feedback | A2 |
| `dialogue` / `story` | Short illustrated-by-text stories with comprehension questions inline | 4 |
| `speak` | Pronunciation via Web Speech API (`bg-BG`) where the browser supports it; graceful skip otherwise | 8 |

Distractor quality is a feature, not an afterthought: generate distractors that test the specific grammar target, never random noise.

---

## 9. Answer-checking engine (`src/engine/answer-check/`) — the heart of the app

This module must be pure, deterministic, and have **≥95% branch coverage** with a large table-driven test file. Pipeline:

1. **Unicode normalize** to NFC.
2. **Stress marks:** strip combining acute **U+0301** only. **Do not** blanket-strip combining marks: `ѝ` (U+045D, "her/to her") vs `и` ("and") is a real orthographic distinction; NFD-stripping all marks would destroy it. If the learner types `и` where `ѝ` is expected, accept with a gentle "note the accent: ѝ" message.
3. **Homoglyphs:** detect Latin look-alikes inside Cyrillic input (a, e, o, p, c, x, y, k, m, t, h, b…) and convert them, with a one-time tip about switching keyboard layout. Detect fully-Latin input and say "type in Cyrillic — use the on-screen keyboard"; optionally (setting, beginners only) accept transliteration using the official Bulgarian Streamlined System (щ→sht, ъ→a, ж→zh, ц→ts, ч→ch, ш→sh, ю→yu, я→ya, й→y, х→h) and flag it.
4. Case-fold, strip punctuation except where meaningful, collapse whitespace.
5. **Match against accepted answers.** Accepted answers are authored with a compact alternation syntax, expanded at build time (with a cap and a warning if expansion explodes):
   - `{Аз |}обичам {кафе|кафето}.` → 4 accepted strings
   - The first expansion is the **canonical** answer shown on errors.
6. **Typo tolerance:** Damerau–Levenshtein ≤1 per word for words ≥5 letters → `correct_with_typo` (shown, counted as correct, rated Hard in SRS). **Never** apply typo tolerance to tokens that carry the exercise's grammar target — `столът` vs `стола` is a grammar error, not a typo. Exercises declare their `strictTokens`.
7. **Feedback:** return the closest accepted answer and a token-level diff for highlighting. Include a short reason when an error matches a known pattern (wrong article form, missing counting form, clitic at sentence start, wrong aspect).

Return type:
```ts
CheckResult { verdict: "correct"|"correct_with_typo"|"correct_with_note"|"incorrect",
              canonical: string, closest: string, diff: DiffToken[], notes: string[] }
```

---

## 10. Spaced repetition (`src/engine/srs/`)

- Use `ts-fsrs`. Cards are **targets** (lexeme × direction, grammar point), not exercises — exercises are just ways of testing a card.
- Rating mapping: incorrect → Again; correct_with_typo or used a hint → Hard; correct → Good; correct + fast + production-type exercise → Easy. Make thresholds configurable and document them.
- Cards are created when a lesson introduces a target. **Practice** sessions pull due cards, pick an exercise type suited to card state (recognition for young cards, production for mature), and cap new-vs-review mix.
- "Weak words" view: lowest retrievability first.
- Desired retention default 0.9, configurable.
- Unit tests with a fake clock simulating weeks of reviews.

---

## 11. Audio

- **Pre-generate** all audio at build time; never call TTS from the client at runtime (cost + offline).
- Default provider: **Azure AI Speech neural voices for `bg-BG`** (one female, one male voice; verify which voices currently exist). Keep the provider behind an interface so Google Cloud TTS or ElevenLabs can be swapped in.
- Filenames = `sha256(text + voice + rate + provider)` → incremental builds; only new/changed strings are synthesized. Normal + slow (≈0.75×) variants.
- Per-item `ttsOverride` field (SSML or respelled text) for when the TTS misstresses a word — TTS stress errors in Bulgarian are common; log suspected ones to `REVIEW_QUEUE.md`.
- API keys only in `.env` (gitignored), with `.env.example` committed. Script must print the character count and estimated cost before running and ask for confirmation above a threshold.
- Future: `nativeAudio` field overrides TTS when a real recording exists.
- Runtime fallback if a file is missing: Web Speech API with a `bg-BG` voice if the device has one; otherwise hide the play button.

---

## 12. Bulgarian accuracy rules + automated validators (`pnpm content:validate`)

LLM-written Bulgarian commonly leaks **Russian**. Treat that as the #1 content risk. The validator must fail the build on:

- **Letters that do not exist in modern Bulgarian:** ы, э, ё, ѣ, ѫ (and any Latin letters inside Cyrillic fields).
- **Known Russianisms list** (maintained in `content/validators/russianisms.yaml`, extendable): e.g. здравствуйте (→ здравейте), спасибо (→ благодаря/мерси), хорошо (→ добре), сейчас (→ сега), который (→ който), что (→ какво / че), нет (→ не / няма). Flag, don't just replace.
- **Case-inflected noun forms**: modern Bulgarian nouns have no case declension (apart from vocative and pronouns). Flag suspicious Russian-style endings for review.
- **Article check:** masculine singular subject with short article → warning; heuristic, routed to review rather than failing.
- **Clitic at sentence start** → error.
- **Masculine non-personal noun after a numeral without counting form** → warning.
- **Vocabulary gating (i+1):** every BG token must be known by that point in the course (lemmatize via lexicon `forms`).
- **Referential integrity:** every id referenced exists; every exercise has ≥1 accepted answer; every lexeme has both `en` and `tr` translations; every BG string has audio (after `audio:build`).
- **Duplicate detection** across exercises and lexemes.

Also produce `pnpm content:stats`: words per unit, CEFR coverage, % of items by `reviewStatus`, turcism count, grammar points without exercises.

Honesty rule: heuristics can't prove correctness. The validator catches *classes* of error; native review catches the rest. Both are required before something is `native_verified`.

---

## 13. Turkish-speaker track

- Full UI and translations in Turkish; source language switchable in Settings (EN/TR), and mixed exercises can show both.
- **Turcism badges ("Tanıdık kelime")** on lexemes with Turkish origin, e.g. чорба–çorba, чанта–çanta, джоб–cep, кибрит–kibrit, килим–kilim, чаршаф–çarşaf, тава–tava, чекмедже–çekmece, бакър–bakır, кюфте–köfte. Verify each etymology before tagging.
- **False-friend warnings** where meaning drifted (e.g. мерак in Bulgarian leans toward "keen desire/passion", unlike Turkish *merak* "curiosity/worry" — verify, then expand the list carefully). Never fabricate false friends.
- A dedicated early "Familiar words" lesson in Section 0 so a Turkish speaker reads real Bulgarian on day one.
- TR-specific tips where Turkish helps or hurts: e.g., Turkish has no grammatical gender and no articles — so gender and the postfixed article need extra explicit practice for TR learners.

---

## 14. Gamification (motivating, not manipulative)

- **XP** per exercise, bonus for perfect lessons; **daily goal** (casual/regular/serious); **streak** with earned **streak freezes**; streak counted in the user's local timezone.
- **Hearts/lives: OFF by default** (setting to enable). Punishing mistakes slows learning; mistakes instead get recycled to the end of the lesson until answered correctly.
- **Unit levels** (e.g., 0–5 per unit) earned by completing lessons and later "legendary"-style hard review; original naming and art.
- Achievements: first lesson, 7/30/100-day streak, 100/500/1000 words, alphabet mastered, first story, etc.
- Satisfying feedback: original sounds (CC0 or self-made, listed in ATTRIBUTION.md), subtle animations, haptics via `navigator.vibrate` where supported; all of it toggleable; respect `prefers-reduced-motion`.
- Leagues/friends only after accounts exist (Phase 7+), and opt-in.

---

## 15. UI / UX

- Mobile-first (min width 360 px), full desktop support with keyboard shortcuts: number keys select tiles/options, Enter = check/continue, Space = replay audio, Ctrl/Cmd+Space = slow audio.
- **On-screen Cyrillic keyboard** in phonetic layout order, toggleable, plus a "physical layout" hint for users who install a Bulgarian keyboard.
- Show **stress marks** on new words (setting: always / new words only / never).
- Dark mode, design tokens in CSS variables, tap targets ≥44 px, WCAG 2.2 AA contrast.
- Screens: Course path (vertical path of units/lessons), Lesson player, Lesson complete (XP, accuracy, words learned), Practice, Words list (searchable lexicon with audio, stress, forms, SRS strength), Grammar tips library, Profile/stats (streak calendar, accuracy by grammar point, weakest items), Settings (source language, daily goal, sounds, stress display, hearts, export/import, reset).
- UI copy is localized via `src/i18n` (EN + TR in v1; no hardcoded strings).

---

## 16. Content pipeline (how you, Claude Code, produce content)

1. For each unit, first write a **unit plan** (goals, grammar ids, lexeme list with frequency rationale, lesson breakdown) and show it to me before generating exercises.
2. Generate lexemes → grammar tips → exercises, in YAML, all `reviewStatus: "ai_draft"`.
3. Run a **separate adversarial review pass** (set up a project subagent, e.g. `.claude/agents/bg-content-reviewer.md` — check the current Claude Code docs for the correct subagent and custom-command conventions) whose only job is to hunt for: Russianisms, unnatural phrasing, wrong article form, wrong aspect, clitic order, counting form, wrong stress, translations that are too literal, and accepted-answer gaps (valid answers a learner might type that we'd mark wrong). It writes findings to `REVIEW_QUEUE.md`.
4. Run `content:validate`, fix, re-run until clean.
5. Items I have checked → `self_checked`. Items a native speaker has checked → `native_verified`. Provide a **review export** (one CSV/printable page per unit: BG, stress, translations, notes, a column for corrections) so a native speaker can review without touching YAML, and an **import script** that applies their corrections.
6. In-app **"Report a problem"** on every exercise (categories: my answer should be accepted / translation wrong / audio wrong / other + free text). Stored locally in v1, exportable; synced to the backend in Phase 7. "My answer should be accepted" reports are the fastest way to grow the accepted-answers lists.
7. Optional: a custom slash command (e.g. `/new-unit <topic>`) that runs steps 1–4 consistently.

### Licensing
- If you ingest any external data (frequency lists, Wiktionary, Tatoeba sentences, etc.), check its license first and record it in `ATTRIBUTION.md`. Note that **CC BY-SA** sources (e.g. Wiktionary) impose share-alike on derived content. Keep **code license** (suggest MIT) and **content license** (decide with me) separate. No scraping of commercial courses or textbooks.

---

## 17. Quality gates (CI must enforce)

- `tsc --noEmit` strict, ESLint, Prettier.
- Unit tests: answer-check ≥95% branch coverage; SRS and session composer ≥90%.
- `content:validate` passes with zero errors.
- Playwright e2e: complete Section 0 lesson, complete A1 lesson 1 with deliberate mistakes, practice session, export → wipe → import progress, offline mode (service worker) lesson completion.
- Lighthouse (mobile): Performance ≥90, Accessibility ≥95, PWA installable.
- Initial JS ≤200 KB gzip; unit content and audio lazy-loaded and cached per unit.

---

## 18. Phased roadmap

**Rules for every phase:** start in plan mode, show me the plan, wait for my approval; work in small commits with Conventional Commit messages; end each phase with (a) what was built, (b) exact commands to run and what I should click to test it, (c) known gaps, (d) the next phase's plan. Do not start the next phase without my go-ahead.

| Phase | Scope | Done when |
|---|---|---|
| **0 — Foundations** | Scaffold per §4–5, `CLAUDE.md`, lint/format/test setup, CI, design tokens, app shell, i18n scaffolding, Zod schemas, Dexie DB + migrations + export/import | `pnpm dev` runs, CI green, schemas compile, empty course path renders |
| **1 — Alphabet + engine core** | Exercise registry, answer-check engine with full test table, on-screen keyboard, Section 0 alphabet trainer + content | I can learn and drill all 30 letters on phone and desktop |
| **2 — Lesson player + first units** | Lesson player, mistake recycling, feedback UI, exercise types marked Phase 2, content build + validators, audio pipeline, A1 units 1–3 | I can complete units 1–3 with audio; validator catches seeded Russianisms |
| **3 — Memory & motivation** | FSRS integration, practice sessions, words list, stats, XP/streak/goal/achievements, `stress_tap` | Due reviews appear on the right days (verified with fake-clock tests) |
| **4 — Full A1** | Units 4–13, grammar tips library, `reorder_clitic`, `conjugate`, stories/dialogues, checkpoints + test-out, review export/import tooling | Full A1 playable end to end; `content:stats` report shows coverage |
| **5 — Turkish track** | TR UI + translations everywhere, turcism badges, false friends, Familiar-words lesson | Switching to TR changes all UI + prompts with no missing strings (test enforces) |
| **6 — Polish** | PWA offline hardening, a11y audit, performance budgets, animations/sounds, onboarding + placement quiz | All §17 gates pass |
| **7 — Sharing** | Supabase auth (email magic link + Google), progress sync with conflict strategy (last-write-wins per card + review-log merge), problem reports to backend, privacy-friendly analytics or none, public deploy, privacy policy page | A second person can sign up on another device and their progress syncs; mine is unaffected |
| **8 — Beyond** | A2 content, `aspect_choice`, `speak`, native audio, friends/leagues (opt-in), BG UI language | — |

---

## 19. Working agreement

- Explain decisions at the depth set by `{{MY_CODING_LEVEL}}`. When I need to do something manually (accounts, API keys, DNS), give exact numbered steps.
- Ask before: adding a dependency, changing the schema in a breaking way, anything that costs money (TTS runs, paid services), deleting content.
- When unsure about Bulgarian, say so explicitly and queue it for review — do not guess silently.
- Keep `CLAUDE.md` updated with: commands, conventions, where things live, current phase, and "gotchas" learned.
- Keep a `CHANGELOG.md` and a short `docs/decisions/` ADR file for every non-obvious technical decision.
- Prefer boring, readable code. No premature abstraction; no framework churn.
- Never commit secrets. Never weaken a test or validator to make it pass — fix the cause or ask me.

---

## 20. First actions (Phase 0, in plan mode)

1. Read this whole spec. List any contradictions or risks you see, and ask me about any blank `{{…}}` values.
2. Verify current stable versions/APIs for every library in §4 and flag anything that changed meaningfully.
3. Propose the Phase 0 plan (files, commands, CI config, schemas) and wait for approval.
