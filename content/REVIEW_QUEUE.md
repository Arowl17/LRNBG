# Review queue

Items that need a native Bulgarian speaker's check, with the specific doubt.
Nothing here may be marked `native_verified` until a native speaker has confirmed it.

Format: `- [ ] <id or file> — <the doubt>`

## Validator lists

- [ ] `content/validators/russianisms.yaml`, entries with `origin: ai_draft` (пожалуйста, до свидания,
      извините, очень, только, сегодня, где, почему, здесь, хочу) — confirm that none of these is
      also valid modern Bulgarian. A false positive would block correct content.

## Open questions for later phases

- [ ] Euro vocabulary (Phase 2, prices) — the everyday words for euro cents, and the counting form
      after numerals (e.g. how "two euros" / "50 cents" are said and written on price tags).
- [ ] Stress shifts in noun forms — confirm stress for the plural/definite forms used in the
      schema tests and future content (e.g. град → градове́ is assumed, not verified).

## Section 0 — alphabet (Phase 1)

All of `content/alphabet/alphabet.yaml` and `content/lexicon/section-0-words.yaml` is `ai_draft`.
Specific doubts:

- [ ] Sound hints for **ъ** — EN "like the a in _about_", TR "Türkçedeki ı'ya yakın". Close, but
      Bulgarian ъ and Turkish ı are not identical; is "yakın" (close to) fair?
- [ ] Sound hint for **х** — "breathy h, like Scottish _loch_ but softer". Too strong or right?
- [ ] Sound hint for **ь** — presented only as part of "ьо" = "yo" (e.g. шофьор). Correct for
      modern Bulgarian spelling?
- [ ] Stress: **чарша́ф** (final stress?), **ухо́**, **тава́**, **бана́н**, **кюфте́**, **чекмедже́** —
      please confirm each.
- [ ] **тава** — tagged as a Turkish loan (confirmed: Ottoman Turkish _tava_). Meaning given as
      "baking tray / roasting pan", with a note that Turkish _tava_ is usually a frying pan. Is this
      meaning shift right? (Not marked as a false friend until confirmed.)
- [ ] Turkish-origin tags not yet confirmed by a dictionary (couldn't reach one): **чорба, чанта,
      джоб, кибрит, килим, чаршаф, бакър, кюфте**. Confirmed by a source: **чекмедже, тава**.
      Not tagged although probably Turkish-related: **чай, чешма, ютия** (left out until verified).
- [ ] Translations: **ток** = "electric current, electricity" (TR "elektrik akımı, elektrik");
      **мак** = "poppy" (TR "gelincik, haşhaş"); **като** = "like, as" (TR "gibi"); **ето** = "here is"
      (TR "işte"). Natural primary glosses?

## Units 1–3 — adversarial review (Phase 2)

Reviewer: `bg-content-reviewer` (AI). Nothing below is native-verified; `reviewStatus` untouched.
Scope: `content/{lexicon,grammar,units}/a1-0{1,2,3}.yaml` + new plurals in `section-0-words.yaml`.
No Russianisms found (no ы/э/ё, no спасибо/сейчас/что/здесь etc.). No `turcism` tags in these units.

### Grammar and explanations

- [x] _(fixed by the author)_ `gram.noun.plural`, `ex.a1-03-05.03` — "short masculine nouns take -ове" is over-general, and **мъж → мъже** (used in `ex.a1-03-05.07`, lexeme `lex.mazh`) contradicts it with no explanation → "Many one-syllable masculine nouns take -ове (град → градове, стол → столове), but not all: мъж → мъже." (confidence: high)
- [x] _(fixed by the author)_ `gram.noun.gender-by-ending` — "consonant → masculine" with no exception, but unit 1 already taught **лека нощ** (feminine adjective) and **добър вечер** (вечер is feminine); learners will notice the clash → add "A few nouns ending in a consonant are feminine: нощ, вечер." (confidence: high)
- [ ] `gram.noun.gender-by-ending` — "It's about the ending, not the person" is too absolute (баща, чичо are masculine despite -а/-о) → soften to "Usually it's about the ending…" (confidence: medium)
- [x] _(fixed by the author)_ `gram.noun.plural` (TR especially) — missing the #1 Turkish-speaker trap: Turkish keeps the noun singular after _çok_ / numbers (_çok kitap_), Bulgarian uses the plural (**много книги**, never _много книга_) → add one line in both languages; the TR glosses "Çok çocuk", "çok kitap" currently reinforce the wrong pattern without comment. (confidence: high)
- [x] _(fixed by the author)_ `ex.a1-01-04.07` — ambiguous fill_blank: "Как си? — Добре, благодаря. А вие?" is perfectly natural with asymmetric politeness (adult → child, teacher → student), so си is defensible and the explanation's logic ("the answer uses вие, so the question is formal") is wrong. EN prompt doesn't disambiguate (TR "Nasılsınız?" does). → add a cue, e.g. "Здравейте, госпожо Петрова! Как ___?", explanation "You address Mrs Petrova politely → Как сте?" (confidence: high)
- [x] _(fixed by the author)_ `ex.a1-01-02.06` — explanation "Утро goes with добро" gives no reason → "утро is neuter (ends in -о), so: добро утро. ден is masculine: добър ден. Добър вечер is a fixed greeting (вечер is feminine)." (confidence: medium)
- [ ] `ex.a1-02-02.09`, `gram.pronouns.he-she-it` — "то = it" invites a one-to-one mapping; for things Bulgarian uses той/тя/то by the noun's gender (the phone → той, the bag → тя). The tip mentions gender, but the EN explanation of the exercise should say "то = it, for neuter nouns; a masculine thing is той, a feminine one тя." (confidence: high)
- [x] _(fixed by the author)_ `gram.culture.head-gestures` — description is imprecise. Bulgarian "yes" is a side-to-side **sway/wobble** of the head (not a sharp shake); "no" is a single **upward toss** of the head/chin (often with a tongue click) — essentially the Turkish _cık_ / head-up "hayır". TR "başı aşağı yukarı sallamak … не" misdescribes it and misses the best hook for Turkish learners → TR: "Hayır için başını yukarı atar — tıpkı Türkçedeki 'cık' gibi. Evet için başını iki yana sallar." EN: "'No' is often a quick upward toss of the head." Also TR "başa değil, kelimelere bak" → "baş hareketine değil, söylenen söze kulak ver"; TR title "ve başın" → "ve baş hareketleri". (confidence: medium)

### Naturalness

- [ ] `ex.a1-02-02.13`, `ex.a1-02-02.09` — "То е тук." as a stand-alone sentence is textbook-only; a native would drop the pronoun ("Тук е.") or say "Ето го." Sentence-initial "То…" also reads as the filler particle "well…". → use a noun: "Детето е тук." (later, after articles) or keep but accept "Тук е." in any typed variant. (confidence: medium)
- [x] _(fixed by the author)_ `ex.a1-02-03.05` — TR "O ve o burada." is not natural Turkish (EN "He and she are here" is also stiff) → use names: BG "Иван и Мария са тук." / EN "Ivan and Maria are here." / TR "Ivan ve Maria burada." (confidence: high)
- [ ] `ex.a1-02-05.07` — "Аз също съм студент." is correct, but in speech "И аз съм студент." is far more frequent → mention in a tip and accept it in any future typed "I'm a student too" item. (confidence: medium)
- [ ] `ex.a1-02-05.04` — "Туркиня съм, но съм в България." is grammatical but slightly odd ("but I am located in Bulgaria"); "…, но сега съм в България" or later "…, но живея в България" is what people say. (confidence: low)

### Translations (EN/TR)

- [ ] `ex.a1-03-05.03`, `ex.a1-03-05.04` — TR "Bunlar şehir." / "Bunlar çocuk." sound odd (with people Turkish prefers "Bunlar çocuklar" / "Onlar çocuk") → TR meaning "Bunlar şehirler." / "Bunlar çocuklar." (accepted lists unaffected; these are fill_blank). (confidence: medium)
- [ ] `ex.a1-01-02.07`, `lex.dobar-den` — "Tünaydın" is in the TDK dictionary but bookish/rare; fine to accept, never show it as a gloss or canonical answer (currently it isn't). (confidence: high)
- [x] _(fixed by the author)_ `lesson.a1-01-02` — TR title "Günün saatleri" means "hours of the day" → "Günün vakitleri" or "Günün bölümleri". (confidence: medium)
- [x] _(fixed by the author)_ `gram.pronouns.he-she-it` — TR title "o, o, o" is cute but reads like a typo → "той, тя, то — üç ayrı 'o'". (confidence: low)
- [x] _(fixed by the author)_ `unit.a1-02` goal — TR "Zamiri bir Bulgar gibi düşürmek": "düşürmek" is linguist jargon → "Bir Bulgar gibi zamiri söylemeden konuşmak". (confidence: low)
- [x] _(fixed by the author)_ `ex.a1-03-05.13` — TR "Bunlar kızlar ve erkek çocuklar." is stiff → "Bunlar kızlar ve oğlanlar." or "Bunlar kız ve erkek çocuklar." (confidence: low)
- [ ] `lex.molya` — missing two very common senses: "Моля?" = "Pardon? / Sorry? (didn't catch that)" (TR "Efendim?") and "here you are" when handing something. Add to glosses later. (confidence: medium)

### Stress

- [x] _(fixed by the author)_ `lex.dobar-den`, `lex.leka-nosht` — monosyllables **де́н** and **но́щ** carry a stress mark, contrary to the convention used everywhere else (`как си`, `а ти` unmarked) → "до́бър ден", "ле́ка нощ". (confidence: high)
- [ ] `lex.stol`, `lex.hlyab`, `lex.momche` (unmarked plurals) — my reading: **столове́**, **хлябове́**, **момче́та**; `мъже́` as marked is right. Native check still needed. (confidence: medium-high)
- [ ] `section-0-words.yaml` new plurals — **градове́, телефо́ни, ча́нти, морета́, кафета́** all look right to me; no change proposed, still needs native confirmation. (confidence: medium-high)

### Accepted answers and exercise design

- [x] _(fixed by the author)_ `ex.a1-01-04.06` — EN prompt "And you?" doesn't say informal, yet the tile bank offers "вие" as a distractor, so an EN learner who builds the (valid) "А вие?" is marked wrong; TR "Ya sen?" is unambiguous → EN meaning "Fine, thank you. And you? (informal)" or swap the distractor "вие" for "да". (confidence: high)
- [x] _(fixed by the author)_ `ex.a1-01-01.09` — accepts "Чао!" for "Hi!". чао is overwhelmingly "bye"; accepting it teaches the wrong mapping → remove "Чао!" (confidence: medium)
- [x] _(fixed by the author)_ `ex.a1-01-01.11` — "Hi!" is a wrong option for Здравейте!, but `ex.a1-01-01.07` accepts "Hi" as a translation of Здравейте! → replace the distractor "Hi!" with e.g. "Good night!" (confidence: medium)
- [x] _(fixed by the author)_ `ex.a1-01-01.04` — match pairs чао = "bye" / довиждане = "goodbye" are interchangeable in EN → "bye (informal)" / "goodbye (formal)". (confidence: medium)
- [x] _(fixed by the author)_ `ex.a1-01-03.03` — благодаря = "thank you" / мерси = "thanks" (TR teşekkür ederim / sağ ol) are interchangeable → mark мерси "thanks (informal)" or swap one pair for something distinct. (confidence: medium)
- [ ] `ex.a1-02-01.11` — EN "You are a student." doesn't distinguish ти/вие; "Вие сте студент(ка)." is valid for EN but wrong for TR "Sen…". Since accepted.bg is shared, leave as is but note it; consider "You are a student. (informal)" in EN. (confidence: low)
- [x] _(fixed by the author)_ answer checker (systemic, not a content file) — Turkish learners on non-Turkish keyboards: "Iyi" lower-cases to "ıyi" under the tr locale and fails against "İyi"; "ogrenciyim" vs "öğrenciyim" is 2 edits → rejected. Consider folding ı/i, ö/o, ü/u, ş/s, ç/c, ğ/g for `tr` with a "use Turkish letters" note. (confidence: medium)
- [x] _(fixed by the author)_ `ex.a1-03-02.04` — distractor "е" duplicates the answer word "е" → two identical tiles. Replace with "са". (confidence: medium)
- [x] _(fixed by the author)_ `ex.a1-03-01.06` — accepted "This's a phone" is non-standard English; harmless, but drop "This's" for tidiness. (confidence: low)

### Author's open doubts — reviewer opinion

- [ ] "Добър вечер" — correct and standard as the fixed greeting despite вечер being feminine; "Добра вечер" exists but is less common. Keep; accept "Добра вечер" if a typed BG item is ever added. (confidence: high)
- [ ] "Вие сте учител." — correct per the normative rule for polite вие: verb plural, **noun and adjective predicate singular** (Вие сте учител, Вие сте любезен), past participles plural (Вие сте дошли). (confidence: high for the noun; medium for the adjective detail)
- [ ] ъ ≈ Turkish ı — "yakın" is fair for learners (ъ is a mid central vowel, ı is higher/further back); keep. (confidence: medium)

### Accepted answers added by the reviewer (additions only; first answers unchanged)

- `ex.a1-01-03.09` en: "{I'm|I am} sorry!"
- `ex.a1-01-04.08` en: "{I'm|I am} {fine|good|well|OK|okay}, thank{ you|s}." · tr: "{İyiyim|İyi}, sağ olun."
- `ex.a1-02-01.08` en: "{You are|You're} a female student."
- `ex.a1-02-04.06` en: "{She is|She's} a Bulgarian woman." · tr: "O bir Bulgar{| kadın}."
- `ex.a1-03-01.12` bg: "Това какво е?"
- `ex.a1-03-02.05` en: "{That's|It's} a {bag|handbag}."
- `ex.a1-03-03.05` en: "{That's|It's} a village."
- `ex.a1-03-04.07` bg: "жена и мъж" — _reverted by the author: the drill is about един/една, so the prompt now says "one woman and one man"_
- `ex.a1-03-05.08` tr: "Şunlar sandalye{ler|}."

Author's note on the review (12.10.2026): fixed items are ticked above. Still open for a native
speaker: "То е тук." naturalness, "И аз съм…" vs "Аз също съм…", "Туркиня съм, но съм в България.",
the extra senses of моля, polite вие vs ти for English prompts, Turkish "Bunlar çocuk/şehir", plural
stress (столове, хлябове, момчета), and the head-gesture description (rewritten, still unverified).
Note the gender tip still says "about the ending, not the person" without the баща/чичо exception —
those words aren't taught yet; add the exception when they are.
