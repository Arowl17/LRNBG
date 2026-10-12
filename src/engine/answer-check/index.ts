export { checkAnswer, compareWord, foldTurkish, TYPO_MIN_LENGTH } from './check';
export { damerauLevenshtein } from './distance';
export {
  AlternationSyntaxError,
  expandAll,
  expandAlternatives,
  DEFAULT_EXPANSION_CAP,
} from './expand';
export { cleanUnicode, normalizeWord, tokenize } from './normalize';
export { fixHomoglyphs, scriptOf } from './script';
export { toLatin } from './transliterate';
export type * from './types';
