import type { Exercise } from '../../../content/schema';
import { useT } from '../../../i18n';
import { BgPrompt } from '../BgText';
import { ChoiceOptions, choiceResult } from '../choice';
import type { ExerciseDefinition } from '../types';

type SelectMeaning = Extract<Exercise, { type: 'select_meaning' }>;

/** Bulgarian word or phrase → choose its meaning. */
export const selectMeaning: ExerciseDefinition<SelectMeaning, number | null> = {
  type: 'select_meaning',
  graded: true,
  initialAnswer: () => null,
  isReady: (a) => a !== null,
  check: (e, a, ctx) =>
    choiceResult(
      e.options.map((o) => o[ctx.lang]),
      e.answerIndex,
      a,
    ),
  inputMode: () => 'choice',
  View: function SelectMeaningView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">{t('ex.selectMeaning.prompt')}</h2>
        <BgPrompt text={exercise.bg} />
        <ChoiceOptions
          options={exercise.options.map((o) => o[ctx.lang])}
          selected={answer}
          onSelect={setAnswer}
          locked={locked}
          answerIndex={locked ? exercise.answerIndex : undefined}
        />
      </div>
    );
  },
};
