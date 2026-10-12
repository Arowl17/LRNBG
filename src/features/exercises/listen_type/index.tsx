import type { Exercise } from '../../../content/schema';
import { checkAnswer } from '../../../engine/answer-check';
import { useT } from '../../../i18n';
import { AudioButton } from '../AudioButton';
import { TextAnswer } from '../TextAnswer';
import type { ExerciseDefinition, TextAnswerState } from '../types';

type ListenType = Extract<Exercise, { type: 'listen_type' }>;

/** Dictation: hear Bulgarian, type it. */
export const listenType: ExerciseDefinition<ListenType, TextAnswerState> = {
  type: 'listen_type',
  graded: true,
  initialAnswer: () => ({ text: '', usedOnScreenKeyboard: false }),
  isReady: (a) => a.text.trim() !== '',
  check: (e, a, ctx) =>
    checkAnswer(a.text, {
      accepted: e.accepted,
      language: 'bg',
      strictTokens: e.strictTokens ?? [],
      acceptTransliteration: ctx.settings.acceptTransliteration,
    }),
  describeAnswer: (_e, a) => a.text,
  inputMode: (a) => (a.usedOnScreenKeyboard ? 'onscreen_keyboard' : 'typed'),
  View: function ListenTypeView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">{t('ex.listenType.prompt')}</h2>
        <div className="flex justify-center">
          <AudioButton text={exercise.bg} autoPlay shortcut size="large" />
        </div>
        <TextAnswer value={answer} onChange={setAnswer} locked={locked} ctx={ctx} cyrillic />
        {locked && <p className="text-center text-fg-muted">{exercise.meaning[ctx.lang]}</p>}
      </div>
    );
  },
};
