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
