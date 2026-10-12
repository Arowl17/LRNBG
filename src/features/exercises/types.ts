import type { ComponentType } from 'react';
import type { Settings, SourceLanguage } from '../../db/records';
import type { CheckResult } from '../../engine/answer-check';
import type { AlphabetExercise } from '../../engine/session/alphabet';
import type { LessonItem } from '../../engine/session/lesson';

/** Every exercise (or card) the session player can run. */
export type SessionExercise = AlphabetExercise | LessonItem;
export type ExerciseType = SessionExercise['type'];

export type InputMode = 'tiles' | 'typed' | 'onscreen_keyboard' | 'choice' | 'speech';

export interface ExerciseContext {
  lang: SourceLanguage;
  settings: Settings;
}

export interface ExerciseViewProps<E, A> {
  exercise: E;
  answer: A;
  setAnswer: (answer: A) => void;
  /** True after "Check": the answer can no longer change. */
  locked: boolean;
  result: CheckResult | undefined;
  ctx: ExerciseContext;
}

/**
 * The shared interface every exercise type implements (SPEC §8). Adding a type = one folder
 * exporting one of these, plus a line in registry.ts.
 */
export interface ExerciseDefinition<E extends SessionExercise, A> {
  type: E['type'];
  /** Ungraded exercises (intro cards) only need "Continue". */
  graded: boolean;
  initialAnswer: () => A;
  /** Can the learner press Check yet? */
  isReady: (answer: A, exercise: E) => boolean;
  check: (exercise: E, answer: A, ctx: ExerciseContext) => CheckResult;
  inputMode: (answer: A) => InputMode;
  /** The learner's answer as text, for "my answer should be accepted" reports. */
  describeAnswer?: (exercise: E, answer: A, ctx: ExerciseContext) => string;
  View: ComponentType<ExerciseViewProps<E, A>>;
}

/** Answer state for typed exercises. */
export interface TextAnswerState {
  text: string;
  /** True if any character came from the on-screen keyboard (for the review log). */
  usedOnScreenKeyboard: boolean;
}
