import { STRESS_MARK } from './schema';

/** Remove stress marks (U+0301 only — never other combining marks; see SPEC §9.2). */
export function stripStress(text: string): string {
  return text.replaceAll(STRESS_MARK, '');
}

/**
 * Indexes (into the stress-free text) of each stressed vowel.
 * "градове́" → [6]; "кафе́" → [3]; unstressed text → [].
 */
export function stressIndices(text: string): number[] {
  const result: number[] = [];
  let plainIndex = 0;
  for (const ch of text) {
    if (ch === STRESS_MARK) {
      if (plainIndex > 0) result.push(plainIndex - 1);
    } else {
      plainIndex += ch.length;
    }
  }
  return result;
}
