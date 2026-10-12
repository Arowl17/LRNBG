import { expandAlternatives } from '../../engine/answer-check';
import { seededRng, shuffle, hashString } from '../../lib/random';

export interface Tile {
  id: number;
  text: string;
}

/** Words of the canonical answer, without surrounding punctuation ("кафе." → "кафе"). */
export function answerWords(pattern: string): string[] {
  const canonical = expandAlternatives(pattern).answers[0] ?? '';
  return canonical
    .split(/\s+/)
    .map((w) => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean);
}

/** The tile bank: answer words plus distractors, shuffled the same way every time for this exercise. */
export function buildTiles(
  exerciseId: string,
  pattern: string,
  distractors: readonly string[] = [],
): Tile[] {
  const words = [...answerWords(pattern), ...distractors];
  return shuffle(words, seededRng(hashString(exerciseId))).map((text, id) => ({ id, text }));
}
