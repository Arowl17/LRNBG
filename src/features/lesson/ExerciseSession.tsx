import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CheckResult, Note } from '../../engine/answer-check';
import {
  advance,
  createQueue,
  current,
  firstTryAccuracy,
  isFinished,
} from '../../engine/session/queue';
import { useT } from '../../i18n';
import { Button } from '../../ui/Button';
import { definitionFor } from '../exercises/registry';
import type { ExerciseContext, InputMode, SessionExercise } from '../exercises/types';
import { Feedback, NoteText } from './Feedback';

export interface AnswerRecord {
  exercise: SessionExercise;
  result: CheckResult;
  latencyMs: number;
  inputMode: InputMode;
}

export interface SessionSummary {
  /** Share of graded exercises answered right on the first try (0–1). */
  accuracy: number;
  gradedCount: number;
}

interface Props {
  exercises: SessionExercise[];
  ctx: ExerciseContext;
  /** Called after every graded answer (for the review log). */
  onAnswer?: (record: AnswerRecord) => void;
  onFinish: (summary: SessionSummary) => void;
  onQuit: () => void;
}

/**
 * Runs a list of exercises: Check → feedback → Continue. Wrong answers come back at the end until
 * answered correctly (hearts are off by default — SPEC §14). Enter = Check / Continue.
 */
export function ExerciseSession({ exercises, ctx, onAnswer, onFinish, onQuit }: Props) {
  const t = useT();
  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const gradedIds = useMemo(
    () => exercises.filter((e) => definitionFor(e).graded).map((e) => e.id),
    [exercises],
  );
  const [queue, setQueue] = useState(() => createQueue(exercises.map((e) => e.id)));
  const exercise = byId.get(current(queue) ?? '');
  const def = exercise && definitionFor(exercise);

  const [answer, setAnswer] = useState<unknown>(() => def?.initialAnswer());
  const [result, setResult] = useState<CheckResult | undefined>();
  const [retryNote, setRetryNote] = useState<Note | undefined>();
  const shownAt = useRef(0);
  // Counts screens shown; a recycled exercise gets a fresh view because the step changes.
  const [step, setStep] = useState(0);

  useEffect(() => {
    shownAt.current = performance.now();
  }, [step]);

  const check = useCallback(() => {
    if (!exercise || !def || result || !def.isReady(answer)) return;
    const r = def.check(exercise, answer, ctx);
    if (!r.graded && def.graded) {
      setRetryNote(r.notes[0]); // e.g. typed in Latin letters: ask again, no penalty
      return;
    }
    setRetryNote(undefined);
    setResult(r);
    if (def.graded) {
      onAnswer?.({
        exercise,
        result: r,
        latencyMs: Math.round(performance.now() - shownAt.current),
        inputMode: def.inputMode(answer),
      });
    }
  }, [answer, ctx, def, exercise, onAnswer, result]);

  const next = useCallback(() => {
    const correct = !def?.graded || (result !== undefined && result.verdict !== 'incorrect');
    const nextQueue = advance(queue, correct);
    setQueue(nextQueue);
    setStep((n) => n + 1);
    setResult(undefined);
    setRetryNote(undefined);
    if (isFinished(nextQueue)) {
      onFinish({ accuracy: firstTryAccuracy(nextQueue, gradedIds), gradedCount: gradedIds.length });
      return;
    }
    const upcoming = byId.get(current(nextQueue)!)!;
    setAnswer(definitionFor(upcoming).initialAnswer());
  }, [byId, def, gradedIds, onFinish, queue, result]);

  const primary = useCallback(() => {
    if (!def) return;
    if (!def.graded || result) next();
    else check();
  }, [check, def, next, result]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing || e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'BUTTON') return; // let buttons handle their own Enter
      e.preventDefault();
      primary();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [primary]);

  if (!exercise || !def) return null;
  const View = def.View;
  const progress = queue.total === 0 ? 1 : queue.done.length / queue.total;
  const ready = def.isReady(answer);

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-2xl flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onQuit}
          aria-label={t('session.quit')}
          className="flex size-11 items-center justify-center rounded-card text-2xl text-fg-muted hover:text-fg"
        >
          ×
        </button>
        <div
          role="progressbar"
          aria-label={t('session.progress')}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1" key={step} data-exercise-id={exercise.id}>
        <View
          exercise={exercise}
          answer={answer}
          setAnswer={setAnswer}
          locked={!!result}
          result={result}
          ctx={ctx}
        />
      </div>

      {retryNote && (
        <p role="alert" className="rounded-card bg-danger-bg p-3 font-semibold text-danger">
          <NoteText note={retryNote} />
        </p>
      )}
      {result && def.graded && <Feedback result={result} />}

      <Button
        onClick={primary}
        disabled={def.graded && !result && !ready}
        className="w-full text-lg"
      >
        {!def.graded || result ? t('session.continue') : t('session.check')}
      </Button>
    </div>
  );
}
