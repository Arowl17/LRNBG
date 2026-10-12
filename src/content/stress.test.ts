import { describe, expect, it } from 'vitest';
import { stressIndices, stripStress } from './stress';

describe('stress helpers', () => {
  it.each([
    ['кафе́', 'кафе', [3]],
    ['градове́', 'градове', [6]],
    ['гра́д', 'град', [2]],
    ['Добъ́р де́н', 'Добър ден', [3, 7]],
    ['град', 'град', []],
    ['́а', 'а', []], // a leading mark has no vowel to attach to
  ])('%s → %s, %j', (input, plain, indices) => {
    expect(stripStress(input)).toBe(plain);
    expect(stressIndices(input)).toEqual(indices);
  });

  it('never strips ѝ (only U+0301 is removed)', () => {
    expect(stripStress('ѝ')).toBe('ѝ');
  });
});
