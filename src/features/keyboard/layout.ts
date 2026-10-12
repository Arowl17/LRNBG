/*
 * Bulgarian "Phonetic (traditional)" keyboard — the most widely used layout in Bulgaria.
 * Each Cyrillic letter sits on the Latin key that sounds like it; letters with no Latin twin go
 * on spare keys (я on Q, ъ on Y, ч on `, ш on [, щ on ], ю on \, ь on X).
 * Verified against xkeyboard-config `symbols/bg`, variant "phonetic".
 */
export const PHONETIC_MAP: Record<string, string> = {
  '`': 'ч',
  q: 'я',
  w: 'в',
  e: 'е',
  r: 'р',
  t: 'т',
  y: 'ъ',
  u: 'у',
  i: 'и',
  o: 'о',
  p: 'п',
  '[': 'ш',
  ']': 'щ',
  a: 'а',
  s: 'с',
  d: 'д',
  f: 'ф',
  g: 'г',
  h: 'х',
  j: 'й',
  k: 'к',
  l: 'л',
  '\\': 'ю',
  z: 'з',
  x: 'ь',
  c: 'ц',
  v: 'ж',
  b: 'б',
  n: 'н',
  m: 'м',
};

/** Physical key for each letter (reverse of PHONETIC_MAP), shown as a small hint on each key. */
export const KEY_FOR: Record<string, string> = Object.fromEntries(
  Object.entries(PHONETIC_MAP).map(([key, letter]) => [letter, key]),
);

/**
 * On-screen rows, in phonetic layout order but wrapped to 10 keys so they fit a 360 px phone.
 * The three extra keys of the physical layout (ш щ on [ ], ч on `, ю on \) end the rows.
 */
export const ONSCREEN_ROWS: string[][] = [
  ['я', 'в', 'е', 'р', 'т', 'ъ', 'у', 'и', 'о', 'п'],
  ['а', 'с', 'д', 'ф', 'г', 'х', 'й', 'к', 'л', 'ш'],
  ['з', 'ь', 'ц', 'ж', 'б', 'н', 'м', 'ч', 'щ', 'ю'],
];

/** Extra character offered on the bottom row: ѝ ("her") — a real letter form in Bulgarian. */
export const EXTRA_KEYS = ['ѝ', '-'];

/**
 * Convert one Latin key press to Cyrillic using the phonetic layout ("phonetic typing").
 * Upper case follows Shift. Returns undefined for keys that are not letters on the layout.
 */
export function phoneticChar(key: string): string | undefined {
  if (key.length !== 1) return undefined;
  const lower = key.toLowerCase();
  const letter = PHONETIC_MAP[lower];
  if (!letter) return undefined;
  if (key !== lower) return letter.toLocaleUpperCase('bg');
  // Shifted punctuation keys (~ { } |) give upper case on a real keyboard too.
  return letter;
}

/** Shift + punctuation keys produce these characters; map them to the upper-case letter. */
export const SHIFTED_KEYS: Record<string, string> = { '~': 'Ч', '{': 'Ш', '}': 'Щ', '|': 'Ю' };
