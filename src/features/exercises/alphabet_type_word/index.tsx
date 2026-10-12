import { checkAnswer } from '../../../engine/answer-check';
import type { AlphabetTypeWord } from '../../../engine/session/alphabet';
import { useT } from '../../../i18n';
import { TextAnswer } from '../TextAnswer';
import type { ExerciseDefinition, TextAnswerState } from '../types';

/** See a word's Latin reading and meaning; type it in Cyrillic. */
export const alphabetTypeWord: ExerciseDefinition<AlphabetTypeWord, TextAnswerState> = {
  type: 'alphabet_type_word',
  graded: true,
  initialAnswer: () => ({ text: '', usedOnScreenKeyboard: false }),
  isReady: (answer) => answer.text.trim() !== '',
  // Transliteration is never accepted here: writing Cyrillic is the whole point of the drill.
  check: (exercise, answer) =>
    checkAnswer(answer.text, {
      accepted: [exercise.answer],
      language: 'bg',
      acceptTransliteration: false,
    }),
  inputMode: (answer) => (answer.usedOnScreenKeyboard ? 'onscreen_keyboard' : 'typed'),
  View: function TypeWordView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-center text-lg font-semibold">{t('ex.typeWord.prompt')}</h2>
        <p className="text-center">
          <span className="text-4xl font-bold">{exercise.latin}</span>
          <br />
          <span className="text-fg-muted">
            {t('ex.meaning', { meaning: exercise.meaning[ctx.lang] })}
          </span>
        </p>
        <TextAnswer value={answer} onChange={setAnswer} locked={locked} ctx={ctx} cyrillic />
      </div>
    );
  },
};
