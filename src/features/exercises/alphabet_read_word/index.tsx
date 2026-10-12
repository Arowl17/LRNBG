import type { AlphabetReadWord } from '../../../engine/session/alphabet';
import { useT } from '../../../i18n';
import { ChoiceOptions, choiceResult } from '../choice';
import { showStress } from '../display';
import type { ExerciseDefinition } from '../types';

/** Read a real word in Cyrillic and pick its Latin reading. */
export const alphabetReadWord: ExerciseDefinition<AlphabetReadWord, number | null> = {
  type: 'alphabet_read_word',
  graded: true,
  initialAnswer: () => null,
  isReady: (answer) => answer !== null,
  check: (exercise, answer) => choiceResult(exercise.options, exercise.answerIndex, answer),
  inputMode: () => 'choice',
  View: function ReadWordView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">{t('ex.readWord.prompt')}</h2>
        <p lang="bg" className="text-center text-5xl font-bold">
          {showStress(exercise.word.lemma, ctx.settings.stressDisplay, true)}
        </p>
        <ChoiceOptions
          options={exercise.options}
          selected={answer}
          onSelect={setAnswer}
          locked={locked}
          answerIndex={locked ? exercise.answerIndex : undefined}
        />
        {locked && (
          <p className="text-center text-fg-muted">
            {t('ex.meaning', { meaning: exercise.word.translations[ctx.lang][0]! })}
          </p>
        )}
      </div>
    );
  },
};
