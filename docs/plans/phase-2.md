# Phase 2 plan — lesson player, Phase-2 exercises, audio, A1 units 1–3

Status: **approved (12.10.2026)** and built — audio generation waits for the Azure key.
Done when (SPEC §18): units 1–3 can be completed with audio; the validator catches seeded
Russianisms.

All Bulgarian below is `ai_draft`. Stress is written with an accent (´) after the stressed vowel.
Items marked ⚠ are things I'm unsure about; they go to `content/REVIEW_QUEUE.md`.

---

## Part A — Engineering

1. **Course lessons in the app.** Units appear on the course page under Section 0. Each unit
   lists its lessons; a lesson runs in the same player as the alphabet trainer (Check/Continue,
   mistakes recycled). Lesson-complete screen shows accuracy and the words learned.
   Content is built per unit (`public/content/units/<id>.json`) and loaded only when opened.
2. **Seven exercise types** (SPEC §8), one folder each:
   `select_meaning`, `tiles_translate` (both directions), `type_translate` (both directions),
   `listen_tiles`, `listen_type`, `match_pairs`, `fill_blank`. Tile and option distractors are
   authored per exercise to target a specific mistake (e.g. "си" vs "е", "една" vs "едно").
3. **Grammar tip cards** shown before a lesson that introduces a grammar point (EN/TR, short).
4. **"Report a problem"** button on every exercise (SPEC §16.6): categories "my answer should be
   accepted / translation wrong / audio wrong / other" + free text. Saved on the device, included
   in backups. (Sending them to a server is Phase 7.)
5. **Validators** (SPEC §12) added to `content:validate`:
   - vocabulary gating (i+1): every Bulgarian word in a lesson must be introduced in that lesson or
     earlier — words are matched through each lexeme's lemma _and_ all its forms;
   - clitic at sentence start → error (ме, го, ни, ви, ги, ми, му, ѝ, им, се, съм, сме, сте, са,
     си). "те" and "ти" are skipped (they are also "they"/"you"), "е" is only a warning ("Е, добре.");
   - lessons: 3–7 new words (warning outside), each new word used ≥3 times (error);
   - every exercise answerable (≥1 accepted answer, alternation syntax valid, no expansion blow-up);
   - masculine noun with the short article as the first word of a sentence → warning;
   - numeral + masculine non-person noun in plain plural instead of counting form → warning;
   - suspicious Russian case endings in lexicon forms → warning; duplicate exercises → warning;
   - a test fixture with seeded Russianisms (спасибо, хорошо, что…) proves the build fails.
6. **Audio pipeline** (`pnpm audio:build`, SPEC §11):
   - Azure text-to-speech through its REST API — **no new dependency** (plain `fetch`).
     Voices: `bg-BG-KalinaNeural` (female), `bg-BG-BorislavNeural` (male).
   - Every Bulgarian string gets a normal and a slow (≈0.75×) MP3. File name =
     sha256(text + voice + rate + provider), so re-runs only synthesize new or changed text.
   - Prints the character count and cost before running; asks for confirmation above a threshold.
   - Per-item `ttsOverride` for when the voice stresses a word wrongly.
   - In the app: Space = replay, Ctrl/⌘+Space = slow. If a file is missing → device voice →
     otherwise no play button. Audio is cached by the service worker for offline use.
   - `content:validate --require-audio` checks every string has audio (run after `audio:build`).
   - Expected size for units 1–3: ~300 strings → ~600 MP3s, roughly 5–8 MB. Character count
     ≈15,000 — well inside Azure's free 500,000 characters/month.
7. **Content review helper**: a project subagent (`.claude/agents/bg-content-reviewer.md`) whose
   only job is to hunt for Russianisms, unnatural phrasing, wrong article/aspect/clitic order/
   counting form/stress, overly literal translations and missing accepted answers, and write
   findings to `REVIEW_QUEUE.md`. Plus a `/new-unit` command running plan → generate → review →
   validate. (I'll check the current Claude Code conventions for these before writing them.)

New dependencies: **none planned.**

---

## Part B — Unit plans (SPEC §16 step 1)

Order of exercises inside a lesson: recognition first (choose meaning, match pairs, listen and
build), production last (type the Bulgarian). 10–14 exercises per lesson; every new word appears
at least 3 times.

### Unit 1 — Поздрави / Greetings (A1)

**Goals:** greet people at any time of day, say goodbye, thank, apologise, say yes/no, ask
"how are you?" — and know when to be formal.

**Grammar / tips:** `gram.greetings.formal-informal` (здраве́й vs здраве́йте; ти-form vs
ви-form), `gram.culture.head-gestures` (many Bulgarians nod for "no" and shake the head for
"yes" — the words да/не are what count).

| Lesson                   | New words                                    | Why these                            |
| ------------------------ | -------------------------------------------- | ------------------------------------ |
| 1.1 Hello & goodbye      | здраве́й, здраве́йте, ча́о, дови́ждане           | the four everyday hello/bye words    |
| 1.2 Times of day         | добро́ у́тро, до́бър де́н, до́бър ве́чер, ле́ка но́щ | fixed greetings, very high frequency |
| 1.3 Being polite         | благодаря́, мерси́, мо́ля, извине́те             | politeness core                      |
| 1.4 Yes, no, how are you | да, не, добре́, ка́к си, ка́к сте, а ти́         | first mini-dialogue                  |

Sample sentences: «Добро утро!», «Как сте? — Добре, благодаря. А вие?», «Извинете!», «Чао!»

⚠ Doubts: чао mainly "bye" but also used as an informal "hi" — I'll teach "bye" first.
«мо́ля» means both "please" and "you're welcome" — both accepted.

### Unit 2 — Аз съм… / I am… (A1)

**Goals:** say who you are and where you're from; use all forms of съм ("to be"); drop the
pronoun like Bulgarians do.

**Grammar / tips:** `gram.pronouns.personal`, `gram.sam.present` (съм, си, е, сме, сте, са),
`gram.pro-drop`, `gram.clitic.sam-position` — forms of съм never start a sentence:
«Студе́нт съм.» ✔ «Съм студент.» ✘. (A Turkish speaker's instinct "Öğrenciyim" → «Студент съм»
actually matches Bulgarian word order — a useful TR tip.)

| Lesson                  | New words                                                 | Example                                          |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| 2.1 I am, you are       | аз, ти, съм (+ form си), студе́нт, студе́нтка               | «Аз съм студент.» «Ти си студентка.»             |
| 2.2 He, she, it         | то́й, тя́, то́, учи́тел, учи́телка (+ form е)                  | «Той е учител.» «Тя е тук.»                      |
| 2.3 We, you, they       | ни́е, ви́е, те́, и (+ forms сме, сте, са)                    | «Ние сме тук.» «Ти и аз сме тук.»                |
| 2.4 Where from?         | от, Бълга́рия, Ту́рция, бълга́рин, бълга́рка, ту́рчин, турки́ня | «Аз съм от Турция.»                              |
| 2.5 Without the pronoun | съ́що, но, в                                               | «Студент съм.» «Туркиня съм, но съм в България.» |

⚠ Doubts: polite «Вие сте учител.» (formal you to one person with a singular noun) — I believe
this is correct; please confirm. «то́» examples are thin before articles (unit 4); I'll keep
them minimal.

### Unit 3 — Род и множествено число / Gender and plural (A1)

**Goals:** recognise a noun's gender from its ending, use един/една/едно, ask «Какво е това?»,
and form regular plurals.

**Grammar / tips:** `gram.noun.gender-by-ending` (consonant → masculine, -а/-я → feminine,
-о/-е → neuter, with the warning that it's about the ending, not the person: моми́че "girl" is
neuter), `gram.noun.plural` (-и, -ове for one-syllable masculine nouns, -а/-та for neuter,
irregular дете́ → деца́), `gram.number.one` (един/една/едно). TR tip: Turkish has no gender, so
this unit has extra gender drills.

| Lesson        | New words (plural)                                                                              | Example                                                                   |
| ------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 3.1 Masculine | това́, какво́, гра́д (градове́), сто́л (⚠ plural stress), хля́б (⚠ plural stress), телефо́н (телефо́ни) | «Какво е това? — Това е стол.»                                            |
| 3.2 Feminine  | жена́ (жени́), кни́га (кни́ги), ста́я (ста́и), ча́нта (ча́нти)                                          | «Това е книга.»                                                           |
| 3.3 Neuter    | село́ (села́), море́ (морета́), кафе́ (кафета́), дете́ (деца́)                                          | «Това е кафе.»                                                            |
| 3.4 One       | еди́н / една́ / едно́, мъ́ж (мъже́), момче́ (момчета́), моми́че (моми́чета)                              | «една жена, едно момиче»                                                  |
| 3.5 Plurals   | мно́го, та́м (+ all plural forms above)                                                           | «Това са книги.» «Там са децата» ✘ (article — unit 4), so «Там са книги.» |

Section 0 reading words (град, телефон, чанта, море, кафе) are introduced again here as real
vocabulary, so learners who skipped the alphabet aren't lost.

⚠ Doubts: plural stress of **стол** and **хляб** (сто́лове? столове́?), **мъже́**, **момчета́**;
whether «Там са книги.» sounds natural (vs «Там има книги.» — има comes in unit 5).
Lesson 3.5 has only 2 new lexemes (it teaches plural _forms_) — I propose allowing review lessons
below the 3-word minimum (validator warning, not error).

---

## Part C — What I need from you

1. Approve (or change) the engineering plan and the three unit plans.
2. Azure account for audio (free tier) — now, or later. Until then the app uses the device voice.
3. Where audio files live: in the git repo (simple; fine up to ~100 MB) or Cloudflare R2.
4. Voices: alternate the female/male voice per sentence (half the files, more variety), or record
   every sentence in both voices.
