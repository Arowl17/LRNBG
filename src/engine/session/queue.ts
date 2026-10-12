/**
 * Lesson queue with mistake recycling (SPEC §14): a wrong answer sends the exercise to the end
 * of the lesson, until it is answered correctly. Hearts are off, so there is no failing out.
 */
export interface SessionQueue {
  /** Exercise ids still to do, in order; the first one is current. */
  pending: string[];
  /** Ids answered correctly (or ungraded cards seen). */
  done: string[];
  /** Ids that were wrong at least once. */
  missed: string[];
  /** Number of distinct exercises in the session. */
  total: number;
}

export function createQueue(ids: readonly string[]): SessionQueue {
  const unique = [...new Set(ids)];
  return { pending: unique, done: [], missed: [], total: unique.length };
}

export function current(queue: SessionQueue): string | undefined {
  return queue.pending[0];
}

/** Record the result for the current exercise and move on. */
export function advance(queue: SessionQueue, correct: boolean): SessionQueue {
  const [id, ...rest] = queue.pending;
  if (id === undefined) return queue;
  if (correct) return { ...queue, pending: rest, done: [...queue.done, id] };
  return {
    ...queue,
    pending: [...rest, id],
    missed: queue.missed.includes(id) ? queue.missed : [...queue.missed, id],
  };
}

export function isFinished(queue: SessionQueue): boolean {
  return queue.pending.length === 0;
}

/** Share of exercises answered correctly on the first try (0–1). */
export function firstTryAccuracy(queue: SessionQueue, gradedIds?: readonly string[]): number {
  const graded = gradedIds ? new Set(gradedIds) : undefined;
  const count = graded ? graded.size : queue.total;
  if (count === 0) return 1;
  const missed = queue.missed.filter((id) => !graded || graded.has(id)).length;
  return (count - missed) / count;
}
