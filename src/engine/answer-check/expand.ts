/**
 * Accepted answers are authored with alternation groups:
 *   "{Аз |}обичам {кафе|кафето}."  →  "Аз обичам кафе.", "Аз обичам кафето.",
 *                                       "обичам кафе.",    "обичам кафето."
 * The first expansion is the canonical answer. Groups cannot be nested.
 */

export const DEFAULT_EXPANSION_CAP = 500;

export class AlternationSyntaxError extends Error {
  override name = 'AlternationSyntaxError';
}

export interface Expansion {
  answers: string[];
  /** True if the pattern had more combinations than the cap; extra ones were dropped. */
  truncated: boolean;
}

/** Split a pattern into fixed text and alternative lists: ["", ["Аз ", ""], "обичам ", …]. */
function parse(pattern: string): (string | string[])[] {
  const parts: (string | string[])[] = [];
  let literal = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i]!;
    if (ch === '{') {
      const end = pattern.indexOf('}', i + 1);
      const nextOpen = pattern.indexOf('{', i + 1);
      if (end === -1) throw new AlternationSyntaxError(`Unclosed "{" in: ${pattern}`);
      if (nextOpen !== -1 && nextOpen < end) {
        throw new AlternationSyntaxError(`Nested "{" is not supported in: ${pattern}`);
      }
      parts.push(literal, pattern.slice(i + 1, end).split('|'));
      literal = '';
      i = end + 1;
    } else if (ch === '}') {
      throw new AlternationSyntaxError(`Unmatched "}" in: ${pattern}`);
    } else {
      literal += ch;
      i += 1;
    }
  }
  parts.push(literal);
  return parts;
}

const tidy = (s: string) =>
  s
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:…])/g, '$1')
    .trim();

export function expandAlternatives(pattern: string, cap = DEFAULT_EXPANSION_CAP): Expansion {
  let results = [''];
  let truncated = false;
  for (const part of parse(pattern)) {
    if (typeof part === 'string') {
      results = results.map((r) => r + part);
      continue;
    }
    const next: string[] = [];
    for (const r of results) {
      for (const option of part) {
        if (next.length >= cap) {
          truncated = true;
          break;
        }
        next.push(r + option);
      }
    }
    results = next;
  }
  return { answers: [...new Set(results.map(tidy))].filter(Boolean), truncated };
}

/** Expand every accepted pattern, keeping order (so the canonical answer stays first). */
export function expandAll(patterns: readonly string[], cap = DEFAULT_EXPANSION_CAP): Expansion {
  const answers: string[] = [];
  let truncated = false;
  for (const pattern of patterns) {
    const e = expandAlternatives(pattern, cap);
    truncated ||= e.truncated;
    answers.push(...e.answers);
  }
  return { answers: [...new Set(answers)], truncated };
}
