import { describe, expect, it } from 'vitest';
import { ratingFor } from './rating';

describe('ratingFor', () => {
  it.each([
    ['incorrect', 1],
    ['correct_with_typo', 2],
    ['correct_with_note', 3],
    ['correct', 3],
  ] as const)('%s → %d', (verdict, rating) => {
    expect(ratingFor(verdict)).toBe(rating);
  });
});
