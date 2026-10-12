import { useMemo, useState } from 'react';
import type { Exercise } from '../../../content/schema';
import { useT } from '../../../i18n';
import { hashString, seededRng, shuffle } from '../../../lib/random';
import type { ExerciseDefinition } from '../types';

type MatchPairs = Extract<Exercise, { type: 'match_pairs' }>;

export interface MatchState {
  matched: number[];
  mistakes: number;
}

/**
 * Match Bulgarian words to their meanings. Any wrong pairing makes the exercise come back at the
 * end of the lesson (it is recognition practice, so repeating it is cheap and useful).
 */
export const matchPairs: ExerciseDefinition<MatchPairs, MatchState> = {
  type: 'match_pairs',
  graded: true,
  initialAnswer: () => ({ matched: [], mistakes: 0 }),
  isReady: (a, e) => a.matched.length === e.pairs.length,
  check: (_e, a) => ({
    verdict: a.mistakes === 0 ? 'correct' : 'incorrect',
    graded: true,
    canonical: '',
    closest: '',
    diff: [],
    notes: [],
  }),
  inputMode: () => 'choice',
  View: function MatchPairsView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    const [left, setLeft] = useState<number | null>(null);
    const [right, setRight] = useState<number | null>(null);
    const [wrong, setWrong] = useState<[number, number] | null>(null);
    const order = useMemo(() => {
      const rng = seededRng(hashString(exercise.id));
      const idx = exercise.pairs.map((_, i) => i);
      return { left: shuffle(idx, rng), right: shuffle(idx, rng) };
    }, [exercise]);

    function pick(side: 'left' | 'right', i: number) {
      const l = side === 'left' ? i : left;
      const r = side === 'right' ? i : right;
      if (l === null || r === null) {
        if (side === 'left') setLeft(i);
        else setRight(i);
        return;
      }
      setLeft(null);
      setRight(null);
      if (l === r) {
        setWrong(null);
        setAnswer({ ...answer, matched: [...answer.matched, l] });
      } else {
        setWrong([l, r]);
        setAnswer({ ...answer, mistakes: answer.mistakes + 1 });
      }
    }

    const button = (side: 'left' | 'right', i: number, label: string, lang: string) => {
      const done = answer.matched.includes(i);
      const selected = (side === 'left' ? left : right) === i;
      const isWrong = wrong !== null && wrong[side === 'left' ? 0 : 1] === i;
      return (
        <button
          key={`${side}-${i}`}
          type="button"
          lang={lang}
          disabled={locked || done}
          aria-pressed={selected}
          onClick={() => pick(side, i)}
          className={`min-h-12 rounded-card border-2 px-3 text-lg font-semibold ${
            done
              ? 'border-success bg-success-bg text-success opacity-60'
              : isWrong
                ? 'border-danger bg-danger-bg'
                : selected
                  ? 'border-primary bg-surface-2'
                  : 'border-border bg-surface hover:bg-surface-2'
          }`}
        >
          {label}
        </button>
      );
    };

    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">{t('ex.matchPairs.prompt')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3">
            {order.left.map((i) => button('left', i, exercise.pairs[i]!.bg, 'bg'))}
          </div>
          <div className="flex flex-col gap-3">
            {order.right.map((i) =>
              button('right', i, exercise.pairs[i]!.meaning[ctx.lang], ctx.lang),
            )}
          </div>
        </div>
      </div>
    );
  },
};
