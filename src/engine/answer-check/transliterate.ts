/**
 * Bulgarian → Latin with the official Streamlined System (Transliteration Act, 2009):
 * ж zh, ц ts, ч ch, ш sh, щ sht, ъ a, ь y, ю yu, я ya, й y, х h — and word-final "ия" → "ia"
 * (България → Balgaria; "Bulgaria" is the English name, not a transliteration). Works on lower- or upper-case input; output keeps the case shape.
 */
const MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sht',
  ъ: 'a',
  ь: 'y',
  ю: 'yu',
  я: 'ya',
  ѝ: 'i',
};

function letter(ch: string): string {
  const lower = ch.toLocaleLowerCase('bg');
  const latin = MAP[lower];
  if (latin === undefined) return ch;
  if (lower === ch) return latin;
  return latin.charAt(0).toUpperCase() + latin.slice(1); // Щ → Sht
}

export function toLatin(text: string): string {
  return text
    .replace(/ия(?![\p{L}])/gu, 'ia')
    .replace(/ИЯ(?![\p{L}])/gu, 'IA')
    .replace(/Ия(?![\p{L}])/gu, 'Ia')
    .split('')
    .map(letter)
    .join('');
}
