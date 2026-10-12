import { damerauLevenshtein } from './distance';
import { expandAll } from './expand';
import { cleanUnicode, normalizeWord, tokenize, type Token } from './normalize';
import { fixHomoglyphs, scriptOf } from './script';
import { toLatin } from './transliterate';
import type { AnswerLanguage, CheckOptions, CheckResult, DiffToken, Note, Verdict } from './types';

const TURKISH_FOLD: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };

/** Map Turkish-specific letters to their plain Latin look-alikes ("öğrenciyim" → "ogrenciyim"). */
export function foldTurkish(word: string): string {
  return word.replace(/[çğıöşü]/g, (ch) => TURKISH_FOLD[ch]!);
}

/** Words of at least this many letters may contain one forgiven typo (SPEC §9.6). */
export const TYPO_MIN_LENGTH = 5;

type WordMatch = 'equal' | 'accent' | 'typo' | 'wrong';

/** Compare one expected word with one typed word (both already normalized). */
export function compareWord(expected: string, actual: string, strict: boolean): WordMatch {
  if (expected === actual) return 'equal';
  // и typed for ѝ ("her/to her"): accept with a reminder. Not the other way round.
  const loosened = expected.replaceAll('ѝ', 'и');
  if (loosened !== expected && loosened === actual) return 'accent';
  if (strict) return 'wrong';
  if ([...expected].length >= TYPO_MIN_LENGTH && damerauLevenshtein(loosened, actual) <= 1) {
    return 'typo';
  }
  return 'wrong';
}

const RANK: Record<Exclude<Verdict, 'incorrect'>, number> = {
  correct: 3,
  correct_with_note: 2,
  correct_with_typo: 1,
};

interface Candidate {
  display: string;
  tokens: Token[];
}

interface Alignment {
  cost: number;
  diff: DiffToken[];
  /** Verdict if this candidate counts as a match (same words, only forgiven differences). */
  verdict: Verdict;
}

/** Word-level edit alignment (Levenshtein over words) producing the highlight diff. */
function align(expected: Token[], actual: Token[], strict: Set<string>): Alignment {
  const n = expected.length;
  const m = actual.length;
  const matchOf = (i: number, j: number) =>
    compareWord(expected[i]!.norm, actual[j]!.norm, strict.has(expected[i]!.norm));
  const subCost = (w: WordMatch) => (w === 'equal' ? 0 : w === 'wrong' ? 1 : 0.25);

  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) =>
    Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      cost[i]![j] = Math.min(
        cost[i - 1]![j]! + 1,
        cost[i]![j - 1]! + 1,
        cost[i - 1]![j - 1]! + subCost(matchOf(i - 1, j - 1)),
      );
    }
  }

  // Walk back from the end to recover which words were matched, missing or extra.
  const diff: DiffToken[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0) {
      const w = matchOf(i - 1, j - 1);
      if (cost[i]![j] === cost[i - 1]![j - 1]! + subCost(w)) {
        diff.push({ kind: w, expected: expected[i - 1]!.display, actual: actual[j - 1]!.display });
        i--;
        j--;
        continue;
      }
    }
    if (i > 0 && cost[i]![j] === cost[i - 1]![j]! + 1) {
      diff.push({ kind: 'missing', expected: expected[i - 1]!.display });
      i--;
    } else {
      diff.push({ kind: 'extra', actual: actual[j - 1]!.display });
      j--;
    }
  }
  diff.reverse();

  let verdict: Verdict = 'correct';
  for (const d of diff) {
    if (d.kind === 'wrong' || d.kind === 'missing' || d.kind === 'extra') verdict = 'incorrect';
    else if (d.kind === 'typo' && verdict !== 'incorrect') verdict = 'correct_with_typo';
    else if (d.kind === 'accent' && verdict === 'correct') verdict = 'correct_with_note';
  }
  return { cost: cost[n]![m]!, diff, verdict };
}

function best(candidates: Candidate[], actual: Token[], strict: Set<string>) {
  let bestMatch: { candidate: Candidate; alignment: Alignment } | undefined;
  let closest: { candidate: Candidate; alignment: Alignment } | undefined;
  for (const candidate of candidates) {
    const alignment = align(candidate.tokens, actual, strict);
    if (!closest || alignment.cost < closest.alignment.cost) closest = { candidate, alignment };
    if (
      alignment.verdict !== 'incorrect' &&
      (!bestMatch ||
        RANK[alignment.verdict] > RANK[bestMatch.alignment.verdict as keyof typeof RANK])
    ) {
      bestMatch = { candidate, alignment };
    }
  }
  return bestMatch ?? closest!;
}

function notesFromDiff(diff: DiffToken[], strict: Set<string>, language: AnswerLanguage): Note[] {
  const notes: Note[] = [];
  for (const d of diff) {
    if (d.kind === 'accent')
      notes.push({ code: 'accent_grave_i', expected: d.expected!, actual: d.actual! });
    if (d.kind === 'typo') notes.push({ code: 'typo', expected: d.expected!, actual: d.actual! });
    if (d.kind === 'wrong' && strict.has(normalizeWord(cleanUnicode(d.expected!), language))) {
      notes.push({ code: 'grammar_token', expected: d.expected!, actual: d.actual! });
    }
  }
  return notes;
}

/**
 * Judge a learner's answer against the accepted answers (SPEC §9). Pure and deterministic.
 * Pipeline: NFC → strip stress → fix Latin look-alikes / detect Latin input → case-fold and
 * strip punctuation → match against expanded answers with typo tolerance → closest + diff.
 */
export function checkAnswer(input: string, options: CheckOptions): CheckResult {
  const { language, acceptTransliteration = false } = options;
  const { answers } = expandAll(options.accepted);
  if (answers.length === 0) throw new Error('checkAnswer: no accepted answers');
  const canonical = answers[0]!;
  const strict = new Set(
    (options.strictTokens ?? []).map((t) => normalizeWord(cleanUnicode(t), language)),
  );
  const candidates: Candidate[] = answers.map((display) => ({
    display,
    tokens: tokenize(display, language),
  }));
  const notes: Note[] = [];

  let text = cleanUnicode(input);
  let actual: Token[];
  let latinMode = false;

  if (language === 'bg') {
    const script = scriptOf(text);
    if (script === 'mixed') {
      const fixed = fixHomoglyphs(text);
      if (fixed.changed) notes.push({ code: 'homoglyphs_fixed' });
      text = fixed.text;
    } else if (script === 'latin') {
      latinMode = true;
    }
  }

  if (latinMode) {
    actual = tokenize(text, 'en');
    if (acceptTransliteration) {
      const latinCandidates = candidates.map((c) => ({
        display: c.display,
        tokens: tokenize(toLatin(c.display), 'en'),
      }));
      const result = best(latinCandidates, actual, new Set());
      if (result.alignment.verdict !== 'incorrect') {
        return {
          verdict: 'correct_with_note',
          graded: true,
          canonical,
          closest: result.candidate.display,
          diff: result.alignment.diff,
          notes: [{ code: 'transliteration_accepted', expected: result.candidate.display }],
        };
      }
    }
    const closest = best(candidates, actual, strict);
    return {
      verdict: 'incorrect',
      graded: false,
      canonical,
      closest: closest.candidate.display,
      diff: closest.alignment.diff,
      notes: [{ code: 'latin_input' }],
    };
  }

  actual = tokenize(text, language);
  const result = best(candidates, actual, strict);

  // Turkish typed on a keyboard without ç ğ ı ö ş ü: accept, and show the proper spelling.
  // Only when the answer has none of those letters — otherwise a mix-up (ı for i) is a real error.
  if (language === 'tr' && result.alignment.verdict === 'incorrect' && !/[çğıöşüİ]/.test(text)) {
    const fold = (tokens: Token[]) => tokens.map((t) => ({ ...t, norm: foldTurkish(t.norm) }));
    const folded = best(
      candidates.map((c) => ({ ...c, tokens: fold(c.tokens) })),
      fold(actual),
      new Set(),
    );
    if (folded.alignment.verdict !== 'incorrect') {
      return {
        verdict: 'correct_with_note',
        graded: true,
        canonical,
        closest: folded.candidate.display,
        diff: folded.alignment.diff,
        notes: [{ code: 'turkish_letters', expected: folded.candidate.display }],
      };
    }
  }

  return {
    verdict: result.alignment.verdict,
    graded: true,
    canonical,
    closest: result.candidate.display,
    diff: result.alignment.diff,
    notes: [...notes, ...notesFromDiff(result.alignment.diff, strict, language)],
  };
}
