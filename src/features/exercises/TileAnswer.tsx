import { useEffect } from 'react';
import { useT } from '../../i18n';
import type { Tile } from './tiles';

export interface TileAnswerState {
  /** Tile ids in the order the learner picked them. */
  picked: number[];
}

export const emptyTiles = (): TileAnswerState => ({ picked: [] });
export const tilesText = (tiles: readonly Tile[], answer: TileAnswerState) =>
  answer.picked.map((id) => tiles.find((t) => t.id === id)?.text ?? '').join(' ');

interface Props {
  tiles: Tile[];
  answer: TileAnswerState;
  setAnswer: (a: TileAnswerState) => void;
  locked: boolean;
  lang: string;
}

/** Build an answer from word tiles. Number keys pick a tile from the bank; Backspace removes the last. */
export function TileAnswer({ tiles, answer, setAnswer, locked, lang }: Props) {
  const t = useT();
  const bank = tiles.filter((tile) => !answer.picked.includes(tile.id));

  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Backspace' && answer.picked.length) {
        e.preventDefault();
        setAnswer({ picked: answer.picked.slice(0, -1) });
        return;
      }
      const n = Number(e.key);
      const tile = Number.isInteger(n) && n >= 1 ? bank[n - 1] : undefined;
      if (tile) {
        e.preventDefault();
        setAnswer({ picked: [...answer.picked, tile.id] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, bank, locked, setAnswer]);

  const tileClass =
    'min-h-11 rounded-card border-2 border-border bg-surface px-3 text-lg font-semibold';
  return (
    <div className="flex flex-col gap-6">
      <div
        aria-label={t('ex.answerLabel')}
        role="group"
        className="flex min-h-16 flex-wrap items-start gap-2 border-b-2 border-border pb-3"
      >
        {answer.picked.map((id) => {
          const tile = tiles.find((x) => x.id === id)!;
          return (
            <button
              key={id}
              type="button"
              lang={lang}
              disabled={locked}
              onClick={() => setAnswer({ picked: answer.picked.filter((p) => p !== id) })}
              className={`${tileClass} hover:bg-surface-2`}
            >
              {tile.text}
            </button>
          );
        })}
      </div>
      <div
        role="group"
        aria-label={t('ex.wordBank')}
        className="flex flex-wrap justify-center gap-2"
      >
        {bank.map((tile, i) => (
          <button
            key={tile.id}
            type="button"
            lang={lang}
            disabled={locked}
            onClick={() => setAnswer({ picked: [...answer.picked, tile.id] })}
            className={`${tileClass} relative hover:bg-surface-2`}
          >
            {i < 9 && (
              <span
                aria-hidden="true"
                className="absolute top-0 left-1 text-[0.625rem] text-fg-muted"
              >
                {i + 1}
              </span>
            )}
            {tile.text}
          </button>
        ))}
      </div>
    </div>
  );
}
