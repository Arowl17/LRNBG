import { describe, expect, it } from 'vitest';
import {
  AlternationSyntaxError,
  checkAnswer,
  compareWord,
  damerauLevenshtein,
  expandAll,
  expandAlternatives,
  fixHomoglyphs,
  normalizeWord,
  scriptOf,
  toLatin,
  tokenize,
  type CheckOptions,
  type NoteCode,
  type Verdict,
} from './index';

// Bulgarian in these tables exercises the engine; it is not course content.

describe('expandAlternatives', () => {
  it.each([
    [
      '{Аз |}обичам {кафе|кафето}.',
      ['Аз обичам кафе.', 'Аз обичам кафето.', 'обичам кафе.', 'обичам кафето.'],
    ],
    ['Добър ден!', ['Добър ден!']],
    ['{Да|Не}', ['Да', 'Не']],
    ['Аз {|съм} тук .', ['Аз тук.', 'Аз съм тук.']], // spaces tidied, incl. before punctuation
    ['{a|a}', ['a']], // duplicates removed
    ['{|}', []], // nothing left
  ])('%s', (pattern, expected) => {
    expect(expandAlternatives(pattern).answers).toEqual(expected);
  });

  it('caps runaway expansions and reports truncation', () => {
    const pattern = '{a|b}{a|b}{a|b}{a|b}';
    expect(expandAlternatives(pattern).answers).toHaveLength(16);
    const capped = expandAlternatives(pattern, 5);
    expect(capped.truncated).toBe(true);
    expect(capped.answers.length).toBeLessThanOrEqual(5);
    expect(expandAlternatives(pattern).truncated).toBe(false);
  });

  it.each(['{Аз', 'Аз}', '{а|{б}}'])('rejects bad syntax: %s', (pattern) => {
    expect(() => expandAlternatives(pattern)).toThrow(AlternationSyntaxError);
  });

  it('expandAll keeps pattern order and removes duplicates', () => {
    const all = expandAll(['{Здравей|Здрасти}', 'Здравей', '{x|y}{1|2|3}'], 4);
    expect(all.answers.slice(0, 2)).toEqual(['Здравей', 'Здрасти']);
    expect(all.truncated).toBe(true);
    expect(expandAll(['а']).truncated).toBe(false);
  });
});

describe('damerauLevenshtein', () => {
  it.each([
    ['', '', 0],
    ['кафе', 'кафе', 0],
    ['кафе', 'кфае', 1], // swap
    ['кафе', 'кафета', 2],
    ['кафе', '', 4],
    ['', 'чай', 3],
    ['чанта', 'чамта', 1],
    ['ca', 'abc', 3], // OSA: no edit on a transposed pair
  ])('%s → %s = %d', (a, b, d) => {
    expect(damerauLevenshtein(a, b)).toBe(d);
  });
});

describe('normalization helpers', () => {
  it.each([
    ['Кафе́!', 'bg', 'кафе'],
    ['„Здравей“', 'bg', 'здравей'],
    ['по-добре,', 'bg', 'по-добре'],
    ['-по-', 'bg', 'по'],
    ['a--b', 'en', 'a-b'],
    ["I'm", 'en', 'im'],
    ["İstanbul'a", 'tr', 'istanbula'],
    ['ILIK', 'tr', 'ılık'], // Turkish dotless ı
    ['ILIK', 'en', 'ilik'],
    ['—', 'bg', ''],
  ] as const)('normalizeWord(%s, %s) = %s', (word, lang, expected) => {
    expect(normalizeWord(word.normalize('NFC').replaceAll('́', ''), lang)).toBe(expected);
  });

  it('tokenize keeps display text, drops punctuation-only words and stress marks', () => {
    expect(tokenize('Добъ́р ден — как си?', 'bg')).toEqual([
      { display: 'Добър', norm: 'добър' },
      { display: 'ден', norm: 'ден' },
      { display: 'как', norm: 'как' },
      { display: 'си?', norm: 'си' },
    ]);
  });

  it('keeps ѝ through NFC (decomposed и + grave composes to ѝ)', () => {
    expect(tokenize('ѝ', 'bg')).toEqual([{ display: 'ѝ', norm: 'ѝ' }]);
  });

  it.each([
    ['кафе', 'cyrillic'],
    ['kafe', 'latin'],
    ['кафe', 'mixed'],
    ['123 !', 'none'],
  ] as const)('scriptOf(%s) = %s', (text, script) => {
    expect(scriptOf(text)).toBe(script);
  });

  it('fixHomoglyphs converts Latin look-alikes only', () => {
    expect(fixHomoglyphs('кафe')).toEqual({ text: 'кафе', changed: true });
    expect(fixHomoglyphs('BOДA')).toEqual({ text: 'ВОДА', changed: true });
    expect(fixHomoglyphs('кафе')).toEqual({ text: 'кафе', changed: false });
    expect(fixHomoglyphs('zq')).toEqual({ text: 'zq', changed: false });
  });
});

describe('toLatin (Streamlined System)', () => {
  it.each([
    ['абвгдежзийклмнопрстуфхцчшщъьюя', 'abvgdezhziyklmnoprstufhtschshshtayyuya'],
    ['България', 'Balgaria'], // ъ → a; word-final -ия → -ia ("Bulgaria" is the English name, not a transliteration)
    ['БЪЛГАРИЯ', 'BALGARIA'],
    ['Ия', 'Ia'],
    ['история на България', 'istoria na Balgaria'],
    ['ияк', 'iyak'], // not word-final
    ['Щъркел', 'Shtarkel'],
    ['Чорба, моля!', 'Chorba, molya!'],
    ['ѝ', 'i'],
    ['2 €', '2 €'],
  ])('%s → %s', (bg, latin) => {
    expect(toLatin(bg)).toBe(latin);
  });
});

describe('compareWord', () => {
  it.each([
    ['кафе', 'кафе', false, 'equal'],
    ['ѝ', 'и', false, 'accent'],
    ['и', 'ѝ', false, 'wrong'], // only и-for-ѝ is forgiven
    ['ѝ', 'и', true, 'accent'],
    ['чанта', 'чамта', false, 'typo'],
    ['чанта', 'чамта', true, 'wrong'], // strict tokens never get typo tolerance
    ['кафе', 'кафи', false, 'wrong'], // under 5 letters: no tolerance
    ['столът', 'стола', false, 'wrong'], // 2 edits
    ['столът', 'столат', false, 'typo'],
  ] as const)('%s vs %s (strict=%s) → %s', (expected, actual, strict, result) => {
    expect(compareWord(expected, actual, strict)).toBe(result);
  });
});

interface Case {
  name: string;
  input: string;
  options: CheckOptions;
  verdict: Verdict;
  graded?: boolean;
  notes?: NoteCode[];
  closest?: string;
}

const bg = (accepted: string[], extra: Partial<CheckOptions> = {}): CheckOptions => ({
  accepted,
  language: 'bg',
  ...extra,
});

const CASES: Case[] = [
  // exact and normalization
  {
    name: 'exact',
    input: 'Обичам кафе.',
    options: bg(['Обичам кафе.']),
    verdict: 'correct',
    notes: [],
  },
  {
    name: 'case and punctuation ignored',
    input: 'обичам КАФЕ',
    options: bg(['Обичам кафе.']),
    verdict: 'correct',
  },
  {
    name: 'extra spaces',
    input: '  Обичам    кафе  ',
    options: bg(['Обичам кафе.']),
    verdict: 'correct',
  },
  {
    name: 'stress marks in input ignored',
    input: 'Оби́чам кафе́',
    options: bg(['Обичам кафе.']),
    verdict: 'correct',
  },
  {
    name: 'stress marks in answer ignored',
    input: 'обичам кафе',
    options: bg(['Оби́чам кафе́.']),
    verdict: 'correct',
  },
  { name: 'quotes ignored', input: '„Здравей“', options: bg(['Здравей!']), verdict: 'correct' },

  // alternation
  {
    name: 'optional pronoun omitted',
    input: 'Обичам кафето',
    options: bg(['{Аз |}обичам {кафе|кафето}.']),
    verdict: 'correct',
    closest: 'обичам кафето.',
  },
  {
    name: 'optional pronoun present',
    input: 'Аз обичам кафе',
    options: bg(['{Аз |}обичам {кафе|кафето}.']),
    verdict: 'correct',
    closest: 'Аз обичам кафе.',
  },
  {
    name: 'second accepted pattern',
    input: 'Здрасти',
    options: bg(['Здравей!', 'Здрасти!']),
    verdict: 'correct',
    closest: 'Здрасти!',
  },

  // ѝ vs и
  {
    name: 'и for ѝ accepted with note',
    input: 'Дадох и кафе',
    options: bg(['Дадох ѝ кафе.']),
    verdict: 'correct_with_note',
    notes: ['accent_grave_i'],
  },
  {
    name: 'ѝ typed correctly',
    input: 'Дадох ѝ кафе',
    options: bg(['Дадох ѝ кафе.']),
    verdict: 'correct',
    notes: [],
  },
  {
    name: 'ѝ for и (and) is wrong',
    input: 'Мама ѝ татко',
    options: bg(['Мама и татко.']),
    verdict: 'incorrect',
  },

  // typos
  {
    name: 'typo in long word',
    input: 'Обичам чамта',
    options: bg(['Обичам чанта.']),
    verdict: 'correct_with_typo',
    notes: ['typo'],
  },
  {
    name: 'swap typo',
    input: 'Обичма чанта',
    options: bg(['Обичам чанта.']),
    verdict: 'correct_with_typo',
    notes: ['typo'],
  },
  {
    name: 'typo + accent',
    input: 'Дадох и чамта',
    options: bg(['Дадох ѝ чанта.']),
    verdict: 'correct_with_typo',
    notes: ['accent_grave_i', 'typo'],
  },
  {
    name: 'no typo tolerance for short words',
    input: 'Обичам кафи',
    options: bg(['Обичам кафе.']),
    verdict: 'incorrect',
  },
  {
    name: 'two typos in one word',
    input: 'Обичам чмата',
    options: bg(['Обичам чанта.']),
    verdict: 'incorrect',
  },
  {
    name: 'strict token: article error is not a typo',
    input: 'Стола е тук',
    options: bg(['Столът е тук.'], { strictTokens: ['столът'] }),
    verdict: 'incorrect',
    notes: ['grammar_token'],
  },
  {
    name: 'strict token with stress mark and capital',
    input: 'Столат е тук',
    options: bg(['Столът е тук.'], { strictTokens: ['Сто́лът'] }),
    verdict: 'incorrect',
    notes: ['grammar_token'],
  },
  {
    name: 'non-strict long word still forgiving',
    input: 'Столат е тук',
    options: bg(['Столът е тук.']),
    verdict: 'correct_with_typo',
  },
  {
    name: 'exact match preferred over typo match',
    input: 'кафето',
    options: bg(['{кафене|кафето}']),
    verdict: 'correct',
    closest: 'кафето',
  },

  // wrong answers
  { name: 'missing word', input: 'Обичам', options: bg(['Обичам кафе.']), verdict: 'incorrect' },
  {
    name: 'extra word',
    input: 'Аз много обичам кафе',
    options: bg(['Аз обичам кафе.']),
    verdict: 'incorrect',
  },
  { name: 'empty input', input: '', options: bg(['Да.']), verdict: 'incorrect', graded: true },
  {
    name: 'wrong word order',
    input: 'кафе обичам',
    options: bg(['Обичам кафе.']),
    verdict: 'incorrect',
  },

  // script handling
  {
    name: 'Latin look-alikes fixed',
    input: 'Обичaм кaфе',
    options: bg(['Обичам кафе.']),
    verdict: 'correct',
    notes: ['homoglyphs_fixed'],
  },
  {
    name: 'uppercase look-alikes fixed',
    input: 'BОДА',
    options: bg(['Вода.']),
    verdict: 'correct',
    notes: ['homoglyphs_fixed'],
  },
  {
    name: 'mixed script with no look-alikes',
    input: 'кафеz',
    options: bg(['кафе']),
    verdict: 'incorrect',
    notes: [],
  },
  {
    name: 'fully Latin input not graded',
    input: 'obicham kafe',
    options: bg(['Обичам кафе.']),
    verdict: 'incorrect',
    graded: false,
    notes: ['latin_input'],
  },
  {
    name: 'transliteration accepted when enabled',
    input: 'obicham kafe',
    options: bg(['Обичам кафе.'], { acceptTransliteration: true }),
    verdict: 'correct_with_note',
    notes: ['transliteration_accepted'],
  },
  {
    name: 'transliteration with щ/ъ/я',
    input: 'Shtarkel, molya',
    options: bg(['Щъркел, моля!'], { acceptTransliteration: true }),
    verdict: 'correct_with_note',
    notes: ['transliteration_accepted'],
  },
  {
    name: 'transliteration typo forgiven',
    input: 'shtrakel',
    options: bg(['щъркел'], { acceptTransliteration: true }),
    verdict: 'correct_with_note',
    notes: ['transliteration_accepted'],
  },
  {
    name: 'wrong transliteration still not graded',
    input: 'kafeto',
    options: bg(['кафе'], { acceptTransliteration: true }),
    verdict: 'incorrect',
    graded: false,
    notes: ['latin_input'],
  },
  { name: 'digits only in Bulgarian answer', input: '5', options: bg(['5']), verdict: 'correct' },

  // source-language answers
  {
    name: 'English answer',
    input: "i'm a student",
    options: { accepted: ["{I'm|I am} a student."], language: 'en' },
    verdict: 'correct',
  },
  {
    name: 'English typo',
    input: 'I am a studnet',
    options: { accepted: ['I am a student.'], language: 'en' },
    verdict: 'correct_with_typo',
  },
  {
    name: 'Latin answers are fine for English',
    input: 'coffee',
    options: { accepted: ['coffee'], language: 'en' },
    verdict: 'correct',
    graded: true,
  },
  {
    name: 'Turkish answer with dotted/dotless i',
    input: 'KAHVEYİ SEVİYORUM',
    options: { accepted: ['Kahveyi seviyorum.'], language: 'tr' },
    verdict: 'correct',
  },
  {
    name: 'Turkish ı is not i',
    input: 'kahveyi sevıyorum',
    options: { accepted: ['Kahveyi seviyorum.'], language: 'tr', strictTokens: ['seviyorum'] },
    verdict: 'incorrect',
  },
];

describe('checkAnswer', () => {
  it.each(CASES)('$name', ({ input, options, verdict, graded = true, notes, closest }) => {
    const result = checkAnswer(input, options);
    expect(result.verdict).toBe(verdict);
    expect(result.graded).toBe(graded);
    if (notes) expect(result.notes.map((n) => n.code)).toEqual(notes);
    if (closest) expect(result.closest).toBe(closest);
  });

  it('breaks ties in favour of the earlier accepted answer', () => {
    const result = checkAnswer('обичам чай', bg(['Обичам кафе.', 'Обичам чай много.']));
    expect(result.closest).toBe('Обичам кафе.');
  });

  it('reports the canonical answer as the first expansion', () => {
    const result = checkAnswer('нещо', bg(['{Аз |}обичам кафе.', 'Обожавам кафе.']));
    expect(result.canonical).toBe('Аз обичам кафе.');
  });

  it('picks the closest accepted answer for feedback', () => {
    const result = checkAnswer('обичам чай', bg(['Пия кафе.', 'Обичам чай много.']));
    expect(result.closest).toBe('Обичам чай много.');
  });

  it('builds a word-level diff', () => {
    const result = checkAnswer('Аз обичам чамта много', bg(['Аз обичам чанта.']));
    expect(result.verdict).toBe('incorrect');
    expect(result.diff).toEqual([
      { kind: 'equal', expected: 'Аз', actual: 'Аз' },
      { kind: 'equal', expected: 'обичам', actual: 'обичам' },
      { kind: 'typo', expected: 'чанта.', actual: 'чамта' },
      { kind: 'extra', actual: 'много' },
    ]);
  });

  it('marks missing and substituted words', () => {
    const result = checkAnswer('Обичам чай', bg(['Аз обичам кафе.']));
    expect(result.diff).toEqual([
      { kind: 'missing', expected: 'Аз' },
      { kind: 'equal', expected: 'обичам', actual: 'Обичам' },
      { kind: 'wrong', expected: 'кафе.', actual: 'чай' },
    ]);
  });

  it('includes expected/actual on notes', () => {
    const result = checkAnswer('Дадох и кафе', bg(['Дадох ѝ кафе.']));
    expect(result.notes).toEqual([{ code: 'accent_grave_i', expected: 'ѝ', actual: 'и' }]);
  });

  it('throws when there is nothing to compare against', () => {
    expect(() => checkAnswer('x', bg([]))).toThrow(/no accepted answers/);
    expect(() => checkAnswer('x', bg(['{|}']))).toThrow(/no accepted answers/);
  });

  it('is deterministic', () => {
    const opts = bg(['{Аз |}обичам {кафе|кафето}.']);
    expect(checkAnswer('обичам кафенце', opts)).toEqual(checkAnswer('обичам кафенце', opts));
  });
});
