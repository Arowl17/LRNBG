import { db } from '../../db/db';
import type { LessonStateRecord } from '../../db/records';
import { ratingFor } from '../../engine/srs/rating';
import type { AnswerRecord } from './ExerciseSession';

/** Save one graded answer to the review log (feeds spaced repetition from Phase 3). */
export async function logAnswer(record: AnswerRecord, now = Date.now()): Promise<void> {
  await db.reviewLog.add({
    exerciseId: record.exercise.id,
    targets: record.exercise.targets,
    verdict: record.result.verdict,
    rating: ratingFor(record.result.verdict),
    latencyMs: record.latencyMs,
    inputMode: record.inputMode,
    timestamp: now,
  });
}

/** Mark a lesson completed, keeping the best accuracy and a completion count. */
export async function completeLesson(
  lessonId: string,
  accuracy: number,
  now = Date.now(),
): Promise<LessonStateRecord> {
  return db.transaction('rw', db.lessonState, async () => {
    const previous = await db.lessonState.get(lessonId);
    const next: LessonStateRecord = {
      lessonId,
      completed: true,
      bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy),
      completedAt: now,
      timesCompleted: (previous?.timesCompleted ?? 0) + 1,
    };
    await db.lessonState.put(next);
    return next;
  });
}

/** Lesson states for the given ids (missing = not started). */
export async function lessonStates(
  ids: readonly string[],
): Promise<Map<string, LessonStateRecord>> {
  const rows = await db.lessonState.bulkGet([...ids]);
  return new Map(rows.filter((r): r is LessonStateRecord => !!r).map((r) => [r.lessonId, r]));
}
