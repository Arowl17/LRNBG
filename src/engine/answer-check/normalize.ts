import type { AnswerLanguage } from './types';

export const STRESS_MARK = '́';
const LOCALE: Record<AnswerLanguage, string> = { bg: 'bg', en: 'en', tr: 'tr' };

/** NFC + remove stress marks. Only U+0301 — never other marks: "ѝ" must survive (SPEC §9.2). */
export function cleanUnicode(text: string): string {
  return text.normalize('NFC').replaceAll(STRESS_MARK, '');
}

/**
 * Normalize one word for comparison: lower-case (language-aware: Turkish I/ı), drop punctuation
 * and apostrophes, keep hyphens between letters ("по-добре"). May return "" (e.g. for "—").
 */
export function normalizeWord(word: string, language: AnswerLanguage): string {
  return word
    .toLocaleLowerCase(LOCALE[language])
    .replace(/[^\p{L}\p{N}\p{M}-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface Token {
  /** As written, for display. */
  display: string;
  /** Normalized, for comparison. */
  norm: string;
}

/** Split into words, keeping both display and normalized forms; drops punctuation-only words. */
export function tokenize(text: string, language: AnswerLanguage): Token[] {
  return cleanUnicode(text)
    .split(/[\s–—]+/u)
    .map((display) => ({ display, norm: normalizeWord(display, language) }))
    .filter((t) => t.norm !== '');
}
