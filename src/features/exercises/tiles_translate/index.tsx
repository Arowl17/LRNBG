import { useMemo } from 'react';
import type { Exercise } from '../../../content/schema';
import { checkAnswer } from '../../../engine/answer-check';
import { useT } from '../../../i18n';
import { BgPrompt } from '../BgText';
import { emptyTiles, TileAnswer, tilesText, type TileAnswerState } from '../TileAnswer';
import { buildTiles } from '../tiles';
import { target } from '../translate';
import type { ExerciseContext, ExerciseDefinition } from '../types';

type TilesTranslate = Extract<Exercise, { type: 'tiles_translate' }>;

function tilesFor(e: TilesTranslate, ctx: ExerciseContext) {
  const { language, accepted } = target(e, ctx.lang);
  return buildTiles(e.id, accepted[0]!, e.distractors?.[language] ?? []);
}

/** Build the translation from word tiles, in either direction. */
export const tilesTranslate: ExerciseDefinition<TilesTranslate, TileAnswerState> = {
  type: 'tiles_translate',
  graded: true,
  initialAnswer: emptyTiles,
  isReady: (a) => a.picked.length > 0,
  check: (e, a, ctx) => {
    const { language, accepted } = target(e, ctx.lang);
    return checkAnswer(tilesText(tilesFor(e, ctx), a), {
      accepted,
      language,
      strictTokens: e.strictTokens ?? [],
    });
  },
  describeAnswer: (e, a, ctx) => tilesText(tilesFor(e, ctx), a),
  inputMode: () => 'tiles',
  View: function TilesTranslateView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    const tiles = useMemo(() => tilesFor(exercise, ctx), [exercise, ctx]);
    const toBg = exercise.direction === 'src_to_bg';
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">{t('ex.translate.prompt')}</h2>
        {toBg ? (
          <p className="text-center text-2xl font-bold">{exercise.meaning[ctx.lang]}</p>
        ) : (
          <BgPrompt text={exercise.bg} />
        )}
        <TileAnswer
          tiles={tiles}
          answer={answer}
          setAnswer={setAnswer}
          locked={locked}
          lang={toBg ? 'bg' : ctx.lang}
        />
      </div>
    );
  },
};
