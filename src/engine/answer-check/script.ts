/** Latin letters that look like Cyrillic ones, and the Cyrillic letter the learner meant. */
const HOMOGLYPHS: Record<string, string> = {
  a: 'а',
  e: 'е',
  o: 'о',
  p: 'р',
  c: 'с',
  x: 'х',
  y: 'у',
  k: 'к',
  m: 'м',
  t: 'т',
  A: 'А',
  B: 'В',
  E: 'Е',
  K: 'К',
  M: 'М',
  H: 'Н',
  O: 'О',
  P: 'Р',
  C: 'С',
  T: 'Т',
  X: 'Х',
  Y: 'У',
};

const CYRILLIC = /\p{Script=Cyrillic}/u;
const LATIN = /\p{Script=Latin}/u;

export type Script = 'cyrillic' | 'latin' | 'mixed' | 'none';

export function scriptOf(text: string): Script {
  const cyr = CYRILLIC.test(text);
  const lat = LATIN.test(text);
  return cyr && lat ? 'mixed' : cyr ? 'cyrillic' : lat ? 'latin' : 'none';
}

/**
 * Replace Latin look-alikes with the Cyrillic letters they imitate. Only call this on input that
 * already contains Cyrillic — the learner is clearly typing Cyrillic and slipped on the layout.
 */
export function fixHomoglyphs(text: string): { text: string; changed: boolean } {
  let changed = false;
  const fixed = [...text]
    .map((ch) => {
      const cyr = HOMOGLYPHS[ch];
      if (cyr) changed = true;
      return cyr ?? ch;
    })
    .join('');
  return { text: fixed, changed };
}
