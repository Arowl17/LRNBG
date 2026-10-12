import type { WordIntroCard } from '../../../engine/session/lesson';
import { useT } from '../../../i18n';
import { AudioButton } from '../AudioButton';
import { showStress } from '../display';
import type { ExerciseDefinition } from '../types';

/** "New word" card: the word with stress, its meaning, and audio. Not graded. */
export const wordIntro: ExerciseDefinition<WordIntroCard, null> = {
  type: 'word_intro',
  graded: false,
  initialAnswer: () => null,
  isReady: () => true,
  check: (e) => ({
    verdict: 'correct',
    graded: false,
    canonical: e.lexeme.lemma,
    closest: e.lexeme.lemma,
    diff: [],
    notes: [],
  }),
  inputMode: () => 'choice',
  View: function WordIntroView({ exercise, ctx }) {
    const t = useT();
    const { lexeme } = exercise;
    const genderKey = lexeme.gender ? (`gender.${lexeme.gender}` as const) : undefined;
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-lg font-semibold text-fg-muted">{t('ex.newWord')}</h2>
        <p lang="bg" className="text-5xl font-bold">
          {showStress(lexeme.lemma, ctx.settings.stressDisplay, true)}
        </p>
        <AudioButton text={lexeme.lemma} autoPlay shortcut size="large" />
        <p className="text-2xl">{lexeme.translations[ctx.lang].join(', ')}</p>
        {genderKey && <p className="text-sm text-fg-muted">{t(genderKey)}</p>}
      </div>
    );
  },
};
