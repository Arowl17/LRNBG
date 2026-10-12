import type { AlphabetIntro } from '../../../engine/session/alphabet';
import { readingOf } from '../../../engine/session/alphabet';
import { useT } from '../../../i18n';
import { showStress } from '../display';
import { LetterGlyph } from '../LetterGlyph';
import { AudioButton } from '../AudioButton';
import type { ExerciseDefinition, ExerciseViewProps } from '../types';

/** A "new letter" card. Not graded: the learner reads it and continues. */
export function LetterCard({
  exercise,
  ctx,
}: Pick<ExerciseViewProps<AlphabetIntro, null>, 'exercise' | 'ctx'>) {
  const t = useT();
  const { letter, example } = exercise;
  const word = showStress(example.lemma, ctx.settings.stressDisplay, true);
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <LetterGlyph letter={letter} />
      <p className="text-lg">
        <span className="text-fg-muted">{t('alphabet.reads')}: </span>
        <strong className="text-2xl">{letter.sound}</strong>
      </p>
      <p className="max-w-md">{letter.hint[ctx.lang]}</p>
      {letter.lookalike && (
        <p className="rounded-card bg-danger-bg px-3 py-2 font-semibold text-danger">
          {t('alphabet.lookalike', { latin: letter.lookalike })}
        </p>
      )}
      <div className="w-full max-w-sm rounded-card border border-border bg-surface p-4">
        <p className="text-sm text-fg-muted">{t('alphabet.example')}</p>
        <p lang="bg" className="text-3xl font-bold">
          {word}
        </p>
        <p className="text-fg-muted">
          {readingOf(example)} · {example.translations[ctx.lang][0]}
        </p>
        <div className="mt-2">
          <AudioButton text={example.lemma} />
        </div>
      </div>
    </div>
  );
}

export const alphabetIntro: ExerciseDefinition<AlphabetIntro, null> = {
  type: 'alphabet_intro',
  graded: false,
  initialAnswer: () => null,
  isReady: () => true,
  check: (exercise) => ({
    verdict: 'correct',
    graded: false,
    canonical: exercise.letter.lower,
    closest: exercise.letter.lower,
    diff: [],
    notes: [],
  }),
  inputMode: () => 'choice',
  View: function AlphabetIntroView({ exercise, ctx }) {
    const t = useT();
    return (
      <>
        <h2 className="mb-4 text-center text-lg font-semibold text-fg-muted">
          {t('ex.intro.title')}
        </h2>
        <LetterCard exercise={exercise} ctx={ctx} />
      </>
    );
  },
};
