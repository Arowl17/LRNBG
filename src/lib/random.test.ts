import { describe, expect, it } from 'vitest';
import { sample, seededRng, shuffle } from './random';

describe('random helpers', () => {
  it('seededRng is deterministic and in [0, 1)', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const values = Array.from({ length: 100 }, () => a());
    expect(values).toEqual(Array.from({ length: 100 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(seededRng(1)()).not.toBe(seededRng(2)());
  });

  it('shuffle keeps all items and does not mutate', () => {
    const items = [1, 2, 3, 4, 5, 6];
    const shuffled = shuffle(items, seededRng(7));
    expect([...shuffled].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('sample returns distinct items, at most n', () => {
    expect(sample([1, 2, 3], 2, seededRng(1))).toHaveLength(2);
    expect(sample([1, 2], 5, seededRng(1))).toHaveLength(2);
    expect(new Set(sample([1, 2, 3, 4], 4, seededRng(3))).size).toBe(4);
  });
});

describe('hashString', () => {
  it('is stable and spreads values', async () => {
    const { hashString } = await import('./random');
    expect(hashString('ex.a')).toBe(hashString('ex.a'));
    expect(hashString('ex.a')).not.toBe(hashString('ex.b'));
    expect(hashString('')).toBe(0x811c9dc5);
  });
});
