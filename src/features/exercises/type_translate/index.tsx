import type { Exercise } from '../../../content/schema';
import { checkAnswer } from '../../../engine/answer-check';
import { useT } from '../../../i18n';
import { BgPrompt } from '../BgText';
import { TextAnswer } from '../TextAnswer';
import { target } from '../translate';
import type { ExerciseDefinition, TextAnswerState } from '../types';

type TypeTranslate = Extract<Exercise, { type: 'type_translate' }>;

/** Type the translation, in either direction. */
export const typeTranslate: ExerciseDefinition<TypeTranslate, TextAnswerState> = {
  type: 'type_translate',
  graded: true,
  initialAnswer: () => ({ text: '', usedOnScreenKeyboard: false }),
  isReady: (a) => a.text.trim() !== '',
  check: (e, a, ctx) => {
    const { language, accepted } = target(e, ctx.lang);
    return checkAnswer(a.text, {
      accepted,
      language,
      strictTokens: e.strictTokens ?? [],
      acceptTransliteration: ctx.settings.acceptTransliteration,
    });
  },
  describeAnswer: (_e, a) => a.text,
  inputMode: (a) => (a.usedOnScreenKeyboard ? 'onscreen_keyboard' : 'typed'),
  View: function TypeTranslateView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    const toBg = exercise.direction === 'src_to_bg';
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">
          {toBg ? t('ex.translate.toBg') : t('ex.translate.prompt')}
        </h2>
        {toBg ? (
          <p className="text-center text-2xl font-bold">{exercise.meaning[ctx.lang]}</p>
        ) : (
          <BgPrompt text={exercise.bg} />
        )}
        <TextAnswer value={answer} onChange={setAnswer} locked={locked} ctx={ctx} cyrillic={toBg} />
      </div>
    );
  },
};
