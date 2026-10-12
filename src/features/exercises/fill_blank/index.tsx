import type { Exercise } from '../../../content/schema';
import { BLANK } from '../../../content/schema';
import { useT } from '../../../i18n';
import { AudioButton } from '../AudioButton';
import { ChoiceOptions, choiceResult } from '../choice';
import type { ExerciseDefinition } from '../types';

type FillBlank = Extract<Exercise, { type: 'fill_blank' }>;

/** Choose the word that fills the gap (article form, verb ending, clitic…). */
export const fillBlank: ExerciseDefinition<FillBlank, number | null> = {
  type: 'fill_blank',
  graded: true,
  initialAnswer: () => null,
  isReady: (a) => a !== null,
  check: (e, a) => choiceResult(e.options, e.answerIndex, a),
  inputMode: () => 'choice',
  View: function FillBlankView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    const [before, after] = exercise.bg.split(BLANK) as [string, string];
    const filled = answer === null ? null : exercise.options[answer];
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">{t('ex.fillBlank.prompt')}</h2>
        <p lang="bg" className="text-center text-3xl font-bold">
          {before}
          <span className="mx-1 inline-block min-w-16 border-b-4 border-primary text-primary">
            {filled ?? ' '}
          </span>
          {after}
        </p>
        <p className="text-center text-fg-muted">{exercise.meaning[ctx.lang]}</p>
        <ChoiceOptions
          options={exercise.options}
          selected={answer}
          onSelect={setAnswer}
          locked={locked}
          answerIndex={locked ? exercise.answerIndex : undefined}
          lang="bg"
        />
        {locked && (
          <div className="flex flex-col items-center gap-2">
            <AudioButton
              text={exercise.bg.replace(BLANK, exercise.options[exercise.answerIndex]!)}
            />
            {exercise.explanation && (
              <p className="text-center">{exercise.explanation[ctx.lang]}</p>
            )}
          </div>
        )}
      </div>
    );
  },
};
