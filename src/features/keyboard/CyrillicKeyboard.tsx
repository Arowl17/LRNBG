import { useT } from '../../i18n';
import { EXTRA_KEYS, KEY_FOR, ONSCREEN_ROWS } from './layout';

interface Props {
  onKey: (char: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const keyClass =
  'flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg border border-border bg-surface text-lg font-semibold hover:bg-surface-2 active:bg-surface-2 disabled:opacity-50';

/**
 * On-screen Cyrillic keyboard in phonetic layout order (SPEC §15). Each key shows, in small grey,
 * the physical key that types it on the Bulgarian phonetic layout / with phonetic typing.
 * Buttons don't take focus (mousedown is prevented) so the text field keeps its caret.
 */
export function CyrillicKeyboard({ onKey, onBackspace, disabled }: Props) {
  const t = useT();
  const keep = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div
      role="group"
      aria-label={t('keyboard.label')}
      className="flex flex-col gap-1.5 select-none"
    >
      {ONSCREEN_ROWS.map((row) => (
        <div key={row.join('')} className="flex gap-1">
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              lang="bg"
              disabled={disabled}
              onMouseDown={keep}
              onClick={() => onKey(letter)}
              className={`${keyClass} relative`}
            >
              {letter}
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-1 text-[0.625rem] font-normal text-fg-muted"
              >
                {KEY_FOR[letter]}
              </span>
            </button>
          ))}
        </div>
      ))}
      <div className="flex gap-1">
        {EXTRA_KEYS.map((ch) => (
          <button
            key={ch}
            type="button"
            lang="bg"
            disabled={disabled}
            onMouseDown={keep}
            onClick={() => onKey(ch)}
            className={keyClass}
          >
            {ch}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onMouseDown={keep}
          onClick={() => onKey(' ')}
          className={`${keyClass} flex-[4] text-sm`}
        >
          {t('keyboard.space')}
        </button>
        <button
          type="button"
          disabled={disabled}
          onMouseDown={keep}
          onClick={onBackspace}
          aria-label={t('keyboard.backspace')}
          className={`${keyClass} flex-[2]`}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
