import { useMemo } from 'react';
import type { Exercise } from '../../../content/schema';
import { checkAnswer } from '../../../engine/answer-check';
import { useT } from '../../../i18n';
import { AudioButton } from '../AudioButton';
import { emptyTiles, TileAnswer, tilesText, type TileAnswerState } from '../TileAnswer';
import { buildTiles } from '../tiles';
import type { ExerciseDefinition } from '../types';

type ListenTiles = Extract<Exercise, { type: 'listen_tiles' }>;
const tilesFor = (e: ListenTiles) => buildTiles(e.id, e.accepted[0]!, e.distractors ?? []);

/** Hear Bulgarian, build it from tiles. */
export const listenTiles: ExerciseDefinition<ListenTiles, TileAnswerState> = {
  type: 'listen_tiles',
  graded: true,
  initialAnswer: emptyTiles,
  isReady: (a) => a.picked.length > 0,
  check: (e, a) =>
    checkAnswer(tilesText(tilesFor(e), a), {
      accepted: e.accepted,
      language: 'bg',
      strictTokens: e.strictTokens ?? [],
    }),
  describeAnswer: (e, a) => tilesText(tilesFor(e), a),
  inputMode: () => 'tiles',
  View: function ListenTilesView({ exercise, answer, setAnswer, locked, ctx }) {
    const t = useT();
    const tiles = useMemo(() => tilesFor(exercise), [exercise]);
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-center text-lg font-semibold">{t('ex.listen.prompt')}</h2>
        <div className="flex justify-center">
          <AudioButton text={exercise.bg} autoPlay shortcut size="large" />
        </div>
        <TileAnswer tiles={tiles} answer={answer} setAnswer={setAnswer} locked={locked} lang="bg" />
        {locked && <p className="text-center text-fg-muted">{exercise.meaning[ctx.lang]}</p>}
      </div>
    );
  },
};
