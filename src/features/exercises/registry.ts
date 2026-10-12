import { alphabetIntro } from './alphabet_intro';
import { alphabetLetterSound } from './alphabet_letter_sound';
import { alphabetReadWord } from './alphabet_read_word';
import { alphabetTypeWord } from './alphabet_type_word';
import type { ExerciseDefinition, ExerciseType, SessionExercise } from './types';

/**
 * Each definition is fully typed in its own folder. The registry only needs to know which
 * exercise type it handles; the answer type is opaque here (the session just passes it back).
 */
type Erased<E extends SessionExercise> = ExerciseDefinition<E, unknown>;
const erase = <E extends SessionExercise, A>(def: ExerciseDefinition<E, A>) =>
  def as unknown as Erased<E>;

/** One entry per exercise type (SPEC §8). TypeScript errors here if a type is missing. */
const registry: { [K in ExerciseType]: Erased<Extract<SessionExercise, { type: K }>> } = {
  alphabet_intro: erase(alphabetIntro),
  alphabet_letter_sound: erase(alphabetLetterSound),
  alphabet_read_word: erase(alphabetReadWord),
  alphabet_type_word: erase(alphabetTypeWord),
};

export function definitionFor(exercise: SessionExercise): Erased<SessionExercise> {
  return registry[exercise.type] as Erased<SessionExercise>;
}
