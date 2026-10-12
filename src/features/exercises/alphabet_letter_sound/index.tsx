import type { AlphabetLetterSound } from '../../../engine/session/alphabet';
import { useT } from '../../../i18n';
import { ChoiceOptions, choiceResult } from '../choice';
import { LetterGlyph } from '../LetterGlyph';
import type { ExerciseDefinition } from '../types';

/** letter → sound, or sound → letter, as a 4-option choice. */
export const alphabetLetterSound: ExerciseDefinition<AlphabetLetterSound, number | null> = {
  type: 'alphabet_letter_sound',
  graded: true,
  initialAnswer: () => null,
  isReady: (answer) => answer !== null,
  check: (exercise, answer) => choiceResult(exercise.options, exercise.answerIndex, answer),
  inputMode: () => 'choice',
  View: function LetterSoundView({ exercise, answer, setAnswer, locked }) {
    const t = useT();
    const toSound = exercise.direction === 'letter_to_sound';
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">
          {toSound
            ? t('ex.letterSound.prompt')
            : t('ex.soundLetter.prompt', { sound: exercise.letter.sound })}
        </h2>
        {toSound ? (
          <LetterGlyph letter={exercise.letter} />
        ) : (
          <p className="text-center text-6xl font-bold">{exercise.letter.sound}</p>
        )}
        <ChoiceOptions
          options={exercise.options}
          selected={answer}
          onSelect={setAnswer}
          locked={locked}
          answerIndex={locked ? exercise.answerIndex : undefined}
          large={!toSound}
          {...(toSound ? {} : { lang: 'bg' })}
        />
      </div>
    );
  },
};
