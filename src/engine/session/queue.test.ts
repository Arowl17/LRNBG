import { describe, expect, it } from 'vitest';
import { advance, createQueue, current, firstTryAccuracy, isFinished } from './queue';

describe('session queue', () => {
  it('walks through exercises in order', () => {
    let q = createQueue(['a', 'b', 'a']);
    expect(q.total).toBe(2);
    expect(current(q)).toBe('a');
    q = advance(q, true);
    expect(current(q)).toBe('b');
    q = advance(q, true);
    expect(isFinished(q)).toBe(true);
    expect(firstTryAccuracy(q)).toBe(1);
  });

  it('recycles mistakes to the end until answered correctly', () => {
    let q = createQueue(['a', 'b', 'c']);
    q = advance(q, false); // a wrong
    expect(q.pending).toEqual(['b', 'c', 'a']);
    q = advance(q, true);
    q = advance(q, true);
    q = advance(q, false); // a wrong again
    expect(q.pending).toEqual(['a']);
    expect(q.missed).toEqual(['a']);
    q = advance(q, true);
    expect(isFinished(q)).toBe(true);
    expect(firstTryAccuracy(q)).toBeCloseTo(2 / 3);
  });

  it('computes accuracy over graded exercises only', () => {
    let q = createQueue(['intro', 'x', 'y']);
    q = advance(q, true);
    q = advance(q, false);
    q = advance(q, true);
    q = advance(q, true);
    expect(firstTryAccuracy(q, ['x', 'y'])).toBe(0.5);
    expect(firstTryAccuracy(q, [])).toBe(1);
    expect(firstTryAccuracy(createQueue([]))).toBe(1);
  });

  it('advancing a finished queue is a no-op', () => {
    const q = createQueue([]);
    expect(advance(q, true)).toBe(q);
    expect(current(q)).toBeUndefined();
  });
});
