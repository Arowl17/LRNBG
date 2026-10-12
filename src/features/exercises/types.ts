import type { ComponentType } from 'react';
import type { Settings, SourceLanguage } from '../../db/records';
import type { CheckResult } from '../../engine/answer-check';
import type { AlphabetExercise } from '../../engine/session/alphabet';

/** Every exercise the session player can run. Course exercise types join this in Phase 2. */
export type SessionExercise = AlphabetExercise;
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
  isReady: (answer: A) => boolean;
  check: (exercise: E, answer: A, ctx: ExerciseContext) => CheckResult;
  inputMode: (answer: A) => InputMode;
  View: ComponentType<ExerciseViewProps<E, A>>;
}

/** Answer state for typed exercises. */
export interface TextAnswerState {
  text: string;
  /** True if any character came from the on-screen keyboard (for the review log). */
  usedOnScreenKeyboard: boolean;
}
