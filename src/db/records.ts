import { z } from 'zod';

/*
 * Shapes of everything stored on the device (IndexedDB via Dexie).
 * These Zod schemas double as the validator for imported backup files,
 * so a hand-edited or corrupted backup can never put bad data in the DB.
 *
 * Times are stored as epoch milliseconds (numbers) so backups are plain JSON.
 */

export const sourceLanguageSchema = z.enum(['en', 'tr']);
export type SourceLanguage = z.infer<typeof sourceLanguageSchema>;

/** Which way a card is tested: Bulgarian → meaning (recognition) or meaning → Bulgarian (production). */
export const directionSchema = z.enum(['recognize', 'produce']);

/** One spaced-repetition card per (target, direction). Field names mirror ts-fsrs `Card`. */
export const cardRecordSchema = z.object({
  id: z.string().min(1), // `${targetId}::${direction}`
  targetId: z.string().min(1), // lexeme or grammar-point id
  direction: directionSchema,
  due: z.number(),
  stability: z.number(),
  difficulty: z.number(),
  scheduled_days: z.number(),
  learning_steps: z.number(),
  reps: z.number().int(),
  lapses: z.number().int(),
  state: z.number().int().min(0).max(3), // ts-fsrs State: New, Learning, Review, Relearning
  last_review: z.number().optional(),
  createdAt: z.number(),
});
export type CardRecord = z.infer<typeof cardRecordSchema>;

export const verdictSchema = z.enum([
  'correct',
  'correct_with_typo',
  'correct_with_note',
  'incorrect',
]);

export const reviewLogRecordSchema = z.object({
  id: z.number().int().optional(), // auto-increment
  exerciseId: z.string(),
  targets: z.array(z.string()),
  verdict: verdictSchema,
  rating: z.number().int().min(1).max(4), // ts-fsrs Rating: Again..Easy
  latencyMs: z.number().min(0),
  inputMode: z.enum(['tiles', 'typed', 'onscreen_keyboard', 'choice', 'speech']),
  timestamp: z.number(),
});
export type ReviewLogRecord = z.infer<typeof reviewLogRecordSchema>;

export const lessonStateRecordSchema = z.object({
  lessonId: z.string(),
  completed: z.boolean(),
  bestAccuracy: z.number().min(0).max(1),
  completedAt: z.number().optional(),
  timesCompleted: z.number().int().min(0),
});
export type LessonStateRecord = z.infer<typeof lessonStateRecordSchema>;

export const settingsSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
  stressDisplay: z.enum(['always', 'new', 'never']),
  soundEffects: z.boolean(),
  haptics: z.boolean(),
  heartsEnabled: z.boolean(),
  /** Beginners only: accept Latin transliteration (Streamlined System) and flag it. */
  acceptTransliteration: z.boolean(),
  onScreenKeyboard: z.boolean(),
  /**
   * Desktop: convert Latin key presses to Cyrillic using the phonetic layout (q → я, w → в…).
   * Added in Phase 1 — `.default()` fills it in for older saved data and backups, so this
   * additive change needs no DB migration (see CLAUDE.md).
   */
  phoneticTyping: z.boolean().default(true),
  /** FSRS desired retention (SPEC §10). */
  desiredRetention: z.number().min(0.7).max(0.99),
});
export type Settings = z.infer<typeof settingsSchema>;

export const dailyGoalXpSchema = z.union([z.literal(10), z.literal(20), z.literal(50)]);

export const userStateRecordSchema = z.object({
  id: z.literal('me'),
  sourceLanguage: sourceLanguageSchema,
  xp: z.number().int().min(0),
  streak: z.object({
    current: z.number().int().min(0),
    longest: z.number().int().min(0),
    /** Local calendar day (YYYY-MM-DD) of the last goal-reaching activity. */
    lastActiveDay: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
  }),
  streakFreezes: z.number().int().min(0),
  dailyGoalXp: dailyGoalXpSchema,
  settings: settingsSchema,
  createdAt: z.number(),
});
export type UserStateRecord = z.infer<typeof userStateRecordSchema>;

export const reportRecordSchema = z.object({
  id: z.number().int().optional(),
  exerciseId: z.string(),
  category: z.enum(['answer_should_be_accepted', 'translation_wrong', 'audio_wrong', 'other']),
  userAnswer: z.string().optional(),
  text: z.string(),
  contentVersion: z.string(),
  createdAt: z.number(),
});
export type ReportRecord = z.infer<typeof reportRecordSchema>;

export const metaRecordSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
export type MetaRecord = z.infer<typeof metaRecordSchema>;

export function defaultUserState(now: number = Date.now()): UserStateRecord {
  return {
    id: 'me',
    sourceLanguage: 'en',
    xp: 0,
    streak: { current: 0, longest: 0, lastActiveDay: null },
    streakFreezes: 0,
    dailyGoalXp: 20,
    settings: {
      theme: 'system',
      stressDisplay: 'new',
      soundEffects: true,
      haptics: true,
      heartsEnabled: false,
      acceptTransliteration: false,
      onScreenKeyboard: true,
      phoneticTyping: true,
      desiredRetention: 0.9,
    },
    createdAt: now,
  };
}
