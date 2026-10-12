import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET } from '../../content/schema';
import { KEY_FOR, ONSCREEN_ROWS, PHONETIC_MAP, phoneticChar, SHIFTED_KEYS } from './layout';

describe('phonetic keyboard layout', () => {
  it('has every Bulgarian letter exactly once, on screen and on the physical map', () => {
    const onscreen = ONSCREEN_ROWS.flat();
    expect([...onscreen].sort()).toEqual([...BULGARIAN_ALPHABET].sort());
    expect(Object.values(PHONETIC_MAP).sort()).toEqual([...BULGARIAN_ALPHABET].sort());
  });

  it('keeps rows short enough for a phone', () => {
    for (const row of ONSCREEN_ROWS) expect(row.length).toBeLessThanOrEqual(10);
  });

  it.each([
    ['q', 'я'],
    ['y', 'ъ'],
    ['`', 'ч'],
    ['[', 'ш'],
    [']', 'щ'],
    ['\\', 'ю'],
    ['x', 'ь'],
    ['v', 'ж'],
    ['c', 'ц'],
    ['W', 'В'],
    ['Q', 'Я'],
  ])('%s → %s', (key, letter) => {
    expect(phoneticChar(key)).toBe(letter);
  });

  it('ignores non-letter keys', () => {
    expect(phoneticChar('1')).toBeUndefined();
    expect(phoneticChar('Enter')).toBeUndefined();
    expect(phoneticChar(' ')).toBeUndefined();
  });

  it('maps letters back to their keys and shifted punctuation to capitals', () => {
    expect(KEY_FOR['щ']).toBe(']');
    expect(SHIFTED_KEYS['~']).toBe('Ч');
  });
});
