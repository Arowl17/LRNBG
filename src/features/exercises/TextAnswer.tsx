import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useT } from '../../i18n';
import { CyrillicKeyboard } from '../keyboard/CyrillicKeyboard';
import { phoneticChar, SHIFTED_KEYS } from '../keyboard/layout';
import type { ExerciseContext, TextAnswerState } from './types';

interface Props {
  value: TextAnswerState;
  onChange: (value: TextAnswerState) => void;
  locked: boolean;
  ctx: ExerciseContext;
  /** Bulgarian answers get the Cyrillic keyboard and phonetic typing. */
  cyrillic: boolean;
}

/** A text field for typed answers, with the on-screen Cyrillic keyboard and phonetic typing. */
export function TextAnswer({ value, onChange, locked, ctx, cyrillic }: Props) {
  const t = useT();
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(ctx.settings.onScreenKeyboard);

  // After inserting text programmatically, put the caret right after it.
  useLayoutEffect(() => {
    if (caret.current !== null && input.current) {
      input.current.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  });

  function insert(text: string, fromKeyboard: boolean) {
    const el = input.current;
    const start = el?.selectionStart ?? value.text.length;
    const end = el?.selectionEnd ?? value.text.length;
    caret.current = start + text.length;
    onChange({
      text: value.text.slice(0, start) + text + value.text.slice(end),
      usedOnScreenKeyboard: value.usedOnScreenKeyboard || fromKeyboard,
    });
  }

  function backspace() {
    const el = input.current;
    const start = el?.selectionStart ?? value.text.length;
    const end = el?.selectionEnd ?? value.text.length;
    const from = start === end ? Math.max(0, start - 1) : start;
    caret.current = from;
    onChange({
      ...value,
      text: value.text.slice(0, from) + value.text.slice(end),
      usedOnScreenKeyboard: true,
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!cyrillic || !ctx.settings.phoneticTyping || e.ctrlKey || e.metaKey || e.altKey) return;
    const letter = SHIFTED_KEYS[e.key] ?? phoneticChar(e.key);
    if (letter) {
      e.preventDefault();
      insert(letter, false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={input}
        type="text"
        value={value.text}
        onChange={(e) => onChange({ ...value, text: e.target.value })}
        onKeyDown={onKeyDown}
        readOnly={locked}
        lang={cyrillic ? 'bg' : ctx.lang}
        aria-label={t('ex.answerLabel')}
        placeholder={cyrillic ? t('ex.typeWord.placeholder') : ''}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- the answer field is the task's focus
        autoFocus
        className="min-h-12 w-full rounded-card border-2 border-border bg-surface px-4 text-xl focus:border-primary"
      />
      {cyrillic && !locked && (
        <>
          <button
            type="button"
            onClick={() => setShowKeyboard((v) => !v)}
            className="self-end text-sm font-semibold text-primary underline"
          >
            {showKeyboard ? t('keyboard.hide') : t('keyboard.show')}
          </button>
          {showKeyboard && (
            <>
              <CyrillicKeyboard
                onKey={(ch) => insert(ch, true)}
                onBackspace={backspace}
                disabled={locked}
              />
              <p className="hidden text-sm text-fg-muted md:block">{t('keyboard.hint')}</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
