import { useEffect } from 'react';
import type { CheckResult } from '../../engine/answer-check';

/** CheckResult for a multiple-choice answer. */
export function choiceResult(
  options: readonly string[],
  answerIndex: number,
  chosen: number | null,
): CheckResult {
  const correct = options[answerIndex]!;
  return {
    verdict: chosen === answerIndex ? 'correct' : 'incorrect',
    graded: true,
    canonical: correct,
    closest: correct,
    diff: [],
    notes: [],
  };
}

interface ChoiceOptionsProps {
  options: readonly string[];
  selected: number | null;
  onSelect: (index: number) => void;
  locked: boolean;
  /** Shown after checking: highlight the right option. */
  answerIndex?: number | undefined;
  /** Set when the options are Bulgarian, for screen readers and fonts. */
  lang?: string;
  /** Larger text for single letters. */
  large?: boolean;
}

/** Answer buttons; number keys 1–4 select (SPEC §15). */
export function ChoiceOptions({
  options,
  selected,
  onSelect,
  locked,
  answerIndex,
  lang,
  large,
}: ChoiceOptionsProps) {
  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= options.length) {
        e.preventDefault();
        onSelect(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked, options.length, onSelect]);

  return (
    <div className="grid grid-cols-2 gap-3" role="group">
      {options.map((option, i) => {
        const isSelected = selected === i;
        const showCorrect = locked && answerIndex === i;
        const showWrong = locked && isSelected && answerIndex !== i;
        const state = showCorrect
          ? 'border-success bg-success-bg'
          : showWrong
            ? 'border-danger bg-danger-bg'
            : isSelected
              ? 'border-primary bg-surface-2'
              : 'border-border bg-surface hover:bg-surface-2';
        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            disabled={locked}
            onClick={() => onSelect(i)}
            className={`relative flex min-h-14 items-center justify-center rounded-card border-2 px-3 py-2 font-semibold disabled:cursor-default ${state} ${large ? 'text-3xl' : 'text-xl'}`}
          >
            <span aria-hidden="true" className="absolute top-1 left-2 text-xs text-fg-muted">
              {i + 1}
            </span>
            <span lang={lang}>{option}</span>
          </button>
        );
      })}
    </div>
  );
}
