/** Which language the learner is answering in. */
export type AnswerLanguage = 'bg' | 'en' | 'tr';

export type Verdict = 'correct' | 'correct_with_typo' | 'correct_with_note' | 'incorrect';

/**
 * Machine-readable notes; the UI turns them into localized messages.
 * - accent_grave_i: typed "и" where "ѝ" (her/to her) was expected — accepted, with a reminder
 * - homoglyphs_fixed: Latin look-alike letters (a, e, o, p, c…) inside Cyrillic were converted
 * - latin_input: answer typed in Latin letters; not graded — ask for Cyrillic
 * - transliteration_accepted: Latin answer matched via the Streamlined System (beginner setting)
 * - typo: a small typo was forgiven
 * - grammar_token: the error is in a word that carries the exercise's grammar target
 */
export type NoteCode =
  | 'accent_grave_i'
  | 'homoglyphs_fixed'
  | 'latin_input'
  | 'transliteration_accepted'
  | 'typo'
  | 'grammar_token';

export interface Note {
  code: NoteCode;
  expected?: string;
  actual?: string;
}

/**
 * One word in the comparison between the learner's answer and the closest accepted answer.
 * equal / typo / accent: matched (typo = forgiven small slip, accent = и for ѝ);
 * wrong: substituted word; missing: expected but not typed; extra: typed but not expected.
 */
export interface DiffToken {
  kind: 'equal' | 'typo' | 'accent' | 'wrong' | 'missing' | 'extra';
  expected?: string;
  actual?: string;
}

export interface CheckResult {
  verdict: Verdict;
  /**
   * False when the answer was not judged at all (e.g. typed in Latin letters) — the UI should
   * ask the learner to try again without counting a mistake.
   */
  graded: boolean;
  /** The first accepted answer — shown as "Correct answer" on mistakes. */
  canonical: string;
  /** The accepted answer closest to what the learner typed. */
  closest: string;
  diff: DiffToken[];
  notes: Note[];
}

export interface CheckOptions {
  /** Accepted answers in alternation syntax, e.g. "{Аз |}обичам {кафе|кафето}." */
  accepted: readonly string[];
  language: AnswerLanguage;
  /** Words that carry the grammar target: no typo tolerance (SPEC §9.6). */
  strictTokens?: readonly string[];
  /** Beginner setting: accept Bulgarian typed in Latin (Streamlined System), flagged. */
  acceptTransliteration?: boolean;
}
