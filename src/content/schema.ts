import { z } from 'zod';

/*
 * Course content schemas (SPEC §6). One source of truth used in two places:
 *  - at build time, scripts/content-build.ts validates the YAML in content/ with these;
 *  - at runtime, the app validates the compiled JSON bundles before using them.
 *
 * Stress convention (ADR 0002): Bulgarian text that needs stress shown carries the
 * combining acute accent U+0301 directly after the stressed vowel, e.g. "кафе́", "градове́".
 * Stress positions are derived from that (see stress.ts) rather than stored as indexes,
 * because stress moves between forms of the same word.
 */

export const STRESS_MARK = '́';

// ---------------------------------------------------------------------------
// Primitives

/** Stable dotted slug, e.g. "lex.kafe", "gram.definite-article.masc-full-short". */
const idOf = (prefix: string) =>
  z
    .string()
    .regex(
      new RegExp(`^${prefix}\\.[a-z0-9]+(?:[.-][a-z0-9]+)*$`),
      `must look like "${prefix}.some-slug"`,
    );

export const lexemeId = idOf('lex');
export const grammarId = idOf('gram');
export const unitId = idOf('unit');
export const lessonId = idOf('lesson');
export const exerciseId = idOf('ex');
/** Anything an exercise can train: a lexeme or a grammar point. */
export const targetId = z.union([lexemeId, grammarId]);

export const cefrSchema = z.enum(['A1', 'A2', 'B1', 'B2']);
export const reviewStatusSchema = z.enum(['ai_draft', 'self_checked', 'native_verified']);
export const posSchema = z.enum([
  'noun',
  'verb',
  'adj',
  'adv',
  'pron',
  'num',
  'prep',
  'conj',
  'part',
  'interj',
  'phrase',
]);

const VOWELS = 'аеиоуъюяѝ';
const stressMarkOnlyAfterVowel = new RegExp(`(^|[^${VOWELS}])${STRESS_MARK}`, 'iu');

/** Bulgarian text: non-empty, NFC-normalised, stress marks (if any) only directly after a vowel. */
export const bgText = z
  .string()
  .min(1)
  .refine((s) => s === s.normalize('NFC'), 'must be Unicode NFC-normalised')
  .refine((s) => !stressMarkOnlyAfterVowel.test(s), 'stress mark (U+0301) must follow a vowel');

const nonEmpty = z.string().trim().min(1);

/** Text in every source language. */
export const localizedSchema = z.object({ en: nonEmpty, tr: nonEmpty });
export type Localized = z.infer<typeof localizedSchema>;

// ---------------------------------------------------------------------------
// 6.1 Lexeme

export const lexemeSchema = z
  .object({
    id: lexemeId,
    /** Dictionary form in Cyrillic, with stress mark. Verbs: 1st person singular present. */
    lemma: bgText,
    pos: posSchema,
    gender: z.enum(['m', 'f', 'n']).optional(),
    /** Inflected forms, each with stress mark, e.g. { pl: "градове́", def_sg_full: "градъ́т" }. */
    forms: z.record(z.string().regex(/^[a-z0-9_]+$/), bgText).optional(),
    aspect: z.enum(['pf', 'ipf']).optional(),
    aspectPartnerId: lexemeId.optional(),
    /** First entry of each list is the primary gloss. */
    translations: z.object({ en: z.array(nonEmpty).min(1), tr: z.array(nonEmpty).min(1) }),
    turcism: z
      .object({
        trSource: nonEmpty,
        note: nonEmpty.optional(),
        falseFriend: z.boolean().optional(),
      })
      .optional(),
    cefr: cefrSchema,
    frequencyRank: z.number().int().positive().optional(),
    tags: z.array(nonEmpty),
    /** SSML or respelled text for when TTS mis-stresses the word (SPEC §11). */
    ttsOverride: nonEmpty.optional(),
    reviewStatus: reviewStatusSchema,
    /** Source ids from content/ATTRIBUTION.md ("own" for original content). */
    sources: z.array(nonEmpty).min(1),
  })
  .superRefine((lex, ctx) => {
    if (lex.pos === 'noun' && !lex.gender) {
      ctx.addIssue({ code: 'custom', path: ['gender'], message: 'nouns need a gender' });
    }
    if (lex.pos !== 'noun' && lex.gender) {
      ctx.addIssue({ code: 'custom', path: ['gender'], message: 'only nouns have a gender' });
    }
    if (lex.pos !== 'verb' && (lex.aspect || lex.aspectPartnerId)) {
      ctx.addIssue({ code: 'custom', path: ['aspect'], message: 'only verbs have aspect' });
    }
  });
export type Lexeme = z.infer<typeof lexemeSchema>;

// ---------------------------------------------------------------------------
// 6.2 Grammar point

export const grammarPointSchema = z.object({
  id: grammarId,
  title: localizedSchema,
  cefr: cefrSchema,
  /** Short markdown "Tips" card. */
  explanation: localizedSchema,
  examples: z.array(z.object({ bg: bgText, en: nonEmpty, tr: nonEmpty })).min(1),
  prerequisites: z.array(grammarId),
  reviewStatus: reviewStatusSchema,
});
export type GrammarPoint = z.infer<typeof grammarPointSchema>;

// ---------------------------------------------------------------------------
// 6.4 Exercises — a discriminated union on `type`.
// Accepted answers are authored with alternation syntax, e.g. "{Аз |}обичам {кафе|кафето}.",
// and expanded by the answer-check engine; the first expansion is the canonical answer.

const exerciseBase = {
  id: exerciseId,
  /** Lexeme/grammar ids this exercise trains — what feeds the SRS. */
  targets: z.array(targetId).min(1),
  /** Tokens that carry the grammar target: never typo-tolerated (SPEC §9.6). */
  strictTokens: z.array(nonEmpty).optional(),
  reviewStatus: reviewStatusSchema,
};

const acceptedList = z.array(nonEmpty).min(1);

/** A Bulgarian sentence paired with its meaning in each source language. */
const sentencePair = { bg: bgText, meaning: localizedSchema };

export const selectMeaningSchema = z
  .object({
    ...exerciseBase,
    type: z.literal('select_meaning'),
    bg: bgText,
    options: z.array(localizedSchema).min(2).max(4),
    answerIndex: z.number().int().min(0),
  })
  .refine((e) => e.answerIndex < e.options.length, {
    path: ['answerIndex'],
    message: 'answerIndex out of range',
  });

/**
 * Translation exercises in either direction.
 * bg_to_src: learner sees `bg`, answers in their source language → needs accepted.en and accepted.tr.
 * src_to_bg: learner sees `meaning`, answers in Bulgarian → needs accepted.bg.
 */
const translationFields = {
  ...sentencePair,
  direction: z.enum(['bg_to_src', 'src_to_bg']),
  accepted: z.object({
    bg: acceptedList.optional(),
    en: acceptedList.optional(),
    tr: acceptedList.optional(),
  }),
};

type AcceptedByDirection = {
  direction: 'bg_to_src' | 'src_to_bg';
  accepted: { bg?: string[] | undefined; en?: string[] | undefined; tr?: string[] | undefined };
};
const hasAcceptedForDirection = (e: AcceptedByDirection) =>
  e.direction === 'src_to_bg' ? !!e.accepted.bg : !!e.accepted.en && !!e.accepted.tr;
const acceptedForDirectionMessage = {
  path: ['accepted'],
  message: 'src_to_bg needs accepted.bg; bg_to_src needs accepted.en and accepted.tr',
};

export const tilesTranslateSchema = z
  .object({
    ...exerciseBase,
    type: z.literal('tiles_translate'),
    ...translationFields,
    /** Extra wrong tiles targeting likely errors (e.g. the other article form). */
    distractors: z
      .object({
        bg: z.array(nonEmpty).optional(),
        en: z.array(nonEmpty).optional(),
        tr: z.array(nonEmpty).optional(),
      })
      .optional(),
  })
  .refine(hasAcceptedForDirection, acceptedForDirectionMessage);

export const typeTranslateSchema = z
  .object({ ...exerciseBase, type: z.literal('type_translate'), ...translationFields })
  .refine(hasAcceptedForDirection, acceptedForDirectionMessage);

export const listenTilesSchema = z.object({
  ...exerciseBase,
  type: z.literal('listen_tiles'),
  ...sentencePair,
  accepted: acceptedList,
  distractors: z.array(nonEmpty).optional(),
});

export const listenTypeSchema = z.object({
  ...exerciseBase,
  type: z.literal('listen_type'),
  ...sentencePair,
  accepted: acceptedList,
});

export const matchPairsSchema = z.object({
  ...exerciseBase,
  type: z.literal('match_pairs'),
  pairs: z
    .array(z.object({ bg: bgText, meaning: localizedSchema }))
    .min(3)
    .max(6),
});

export const BLANK = '___';

export const fillBlankSchema = z
  .object({
    ...exerciseBase,
    type: z.literal('fill_blank'),
    /** Bulgarian sentence with exactly one "___" where the answer goes. */
    bg: bgText,
    meaning: localizedSchema,
    options: z.array(nonEmpty).min(2).max(4),
    answerIndex: z.number().int().min(0),
    /** Shown on feedback: why the answer is what it is. */
    explanation: localizedSchema.optional(),
  })
  .refine((e) => e.bg.split(BLANK).length === 2, {
    path: ['bg'],
    message: `must contain exactly one "${BLANK}"`,
  })
  .refine((e) => e.answerIndex < e.options.length, {
    path: ['answerIndex'],
    message: 'answerIndex out of range',
  });

// Alphabet exercise types (alphabet_*) are designed in Phase 1 and added here then.

export const exerciseSchema = z.discriminatedUnion('type', [
  selectMeaningSchema,
  tilesTranslateSchema,
  typeTranslateSchema,
  listenTilesSchema,
  listenTypeSchema,
  matchPairsSchema,
  fillBlankSchema,
]);
export type Exercise = z.infer<typeof exerciseSchema>;
export type ExerciseType = Exercise['type'];

// ---------------------------------------------------------------------------
// 6.3 Course structure

export const lessonSchema = z.object({
  id: lessonId,
  unitId,
  order: z.number().int().min(0),
  /** Short lesson name shown on the course path, e.g. "Hello & goodbye". */
  title: localizedSchema.optional(),
  newLexemeIds: z.array(lexemeId),
  grammarIds: z.array(grammarId),
  exercises: z.array(exerciseSchema).min(1),
});
export type Lesson = z.infer<typeof lessonSchema>;

export const unitSchema = z.object({
  id: unitId,
  order: z.number().int().min(0),
  title: localizedSchema,
  cefr: cefrSchema,
  goals: z.array(localizedSchema),
  grammarIds: z.array(grammarId),
  lessonIds: z.array(lessonId),
  checkpoint: z.boolean().optional(),
});
export type Unit = z.infer<typeof unitSchema>;

/** public/content/units/<unit id>.json — everything one unit needs, loaded when it is opened. */
export const unitBundleSchema = z.object({
  contentVersion: nonEmpty,
  unit: unitSchema,
  lessons: z.array(lessonSchema),
  /** Lexemes introduced or trained in this unit. */
  lexemes: z.array(lexemeSchema),
  /** Grammar points introduced in this unit. */
  grammar: z.array(grammarPointSchema),
});
export type UnitBundle = z.infer<typeof unitBundleSchema>;

/**
 * The small file the app loads first (public/content/course.json): the list of units.
 * Lessons, lexemes and grammar are loaded per unit later, so the first load stays small.
 */
export const courseManifestSchema = z.object({
  contentVersion: nonEmpty,
  units: z.array(unitSchema),
  /** Lesson titles for the course page, so it needn't download every unit. */
  lessons: z
    .array(z.object({ id: lessonId, unitId, title: localizedSchema.optional() }))
    .default([]),
  /** Section 0 lesson ids, so the course page can show alphabet progress without loading it. */
  alphabetLessonIds: z.array(lessonId).default([]),
});
export type CourseManifest = z.infer<typeof courseManifestSchema>;

// ---------------------------------------------------------------------------
// Section 0 — the Cyrillic alphabet trainer (SPEC §7.2)

/** The 30 letters of the modern Bulgarian alphabet, in alphabetical order. */
export const BULGARIAN_ALPHABET = [...'абвгдежзийклмнопрстуфхцчшщъьюя'];

export const alphabetLetterSchema = z.object({
  lower: z.string().length(1),
  upper: z.string().length(1),
  /** Official Streamlined System transliteration (ъ → "a", щ → "sht"). */
  latin: nonEmpty,
  /** Short, unique sound label used in letter↔sound drills ("ă" for ъ, so it differs from а). */
  sound: nonEmpty,
  /** How it sounds, for the learner. */
  hint: localizedSchema,
  /** A Latin letter it looks like but must not be read as (в looks like B). */
  lookalike: nonEmpty.optional(),
  /** A word containing the letter, readable at the lesson that introduces it. */
  exampleLexemeId: lexemeId,
  reviewStatus: reviewStatusSchema,
});
export type AlphabetLetter = z.infer<typeof alphabetLetterSchema>;

export const alphabetLessonSchema = z.object({
  id: lessonId,
  order: z.number().int().min(0),
  /** Difficulty group from SPEC §7.2: 1 same as Latin, 2 false friends, 3 new shapes, 4 specials. */
  group: z.number().int().min(1).max(4),
  title: localizedSchema,
  /** Letters introduced in this lesson (lower case). */
  newLetters: z.array(z.string().length(1)).min(1),
  /** Real words to read, using only letters known by the end of this lesson. */
  readingWordIds: z.array(lexemeId).min(3),
});
export type AlphabetLesson = z.infer<typeof alphabetLessonSchema>;

/** content/alphabet/alphabet.yaml */
export const alphabetFileSchema = z.object({
  letters: z.array(alphabetLetterSchema),
  lessons: z.array(alphabetLessonSchema),
});

/** public/content/alphabet.json — what the alphabet trainer loads. */
export const alphabetBundleSchema = z.object({
  contentVersion: nonEmpty,
  letters: z.array(alphabetLetterSchema),
  lessons: z.array(alphabetLessonSchema),
  /** Every lexeme the alphabet lessons refer to. */
  words: z.array(lexemeSchema),
});
export type AlphabetBundle = z.infer<typeof alphabetBundleSchema>;
