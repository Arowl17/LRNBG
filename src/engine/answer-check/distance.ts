/**
 * Damerau–Levenshtein distance (optimal string alignment): the number of single-character
 * insertions, deletions, substitutions or swaps of neighbours needed to turn `a` into `b`.
 * "кафе" → "кфае" is 1 (one swap). Works on code points, so Cyrillic is handled correctly.
 */
export function damerauLevenshtein(a: string, b: string): number {
  const s = [...a];
  const t = [...b];
  const rows = s.length + 1;
  const cols = t.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      let best = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        best = Math.min(best, d[i - 2]![j - 2]! + 1);
      }
      d[i]![j] = best;
    }
  }
  return d[s.length]![t.length]!;
}
