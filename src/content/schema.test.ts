import { describe, expect, it } from 'vitest';
import {
  courseManifestSchema,
  exerciseSchema,
  grammarPointSchema,
  lessonSchema,
  lexemeSchema,
  unitSchema,
} from './schema';

// NOTE: Bulgarian in these fixtures only exercises the schema; it is not course content.
const noun = {
  id: 'lex.kafe',
  lemma: 'кафе́',
  pos: 'noun',
  gender: 'n',
  forms: { pl: 'кафета́', def_sg: 'кафе́то' },
  translations: { en: ['coffee'], tr: ['kahve'] },
  turcism: { trSource: 'kahve' },
  cefr: 'A1',
  tags: ['food'],
  reviewStatus: 'ai_draft',
  sources: ['own'],
};

const meaning = { en: 'I love coffee.', tr: 'Kahveyi seviyorum.' };

describe('lexemeSchema', () => {
  it('accepts a valid noun', () => {
    expect(lexemeSchema.parse(noun)).toMatchObject({ id: 'lex.kafe' });
  });

  it.each([
    ['noun without gender', { ...noun, gender: undefined }],
    ['gender on a non-noun', { ...noun, pos: 'adv' }],
    ['aspect on a non-verb', { ...noun, aspect: 'pf' }],
    ['missing Turkish translation', { ...noun, translations: { en: ['coffee'], tr: [] } }],
    ['bad id prefix', { ...noun, id: 'kafe' }],
    ['stress mark after a consonant', { ...noun, lemma: 'ќафе' }],
    ['stress mark at the start', { ...noun, lemma: '́кафе' }],
    ['non-NFC text', { ...noun, lemma: 'ѝ' }], // decomposed ѝ
    ['no sources', { ...noun, sources: [] }],
    ['unknown review status', { ...noun, reviewStatus: 'verified' }],
  ])('rejects %s', (_label, value) => {
    expect(lexemeSchema.safeParse(value).success).toBe(false);
  });

  it('accepts a verb with aspect', () => {
    const verb = {
      ...noun,
      id: 'lex.obicham',
      lemma: 'оби́чам',
      pos: 'verb',
      gender: undefined,
      aspect: 'ipf',
    };
    expect(lexemeSchema.safeParse(verb).success).toBe(true);
  });

  it('accepts precomposed ѝ', () => {
    expect(
      lexemeSchema.safeParse({
        ...noun,
        id: 'lex.i-her',
        lemma: 'ѝ',
        pos: 'pron',
        gender: undefined,
      }).success,
    ).toBe(true);
  });
});

describe('exerciseSchema', () => {
  const base = { id: 'ex.a1-01.01', targets: ['lex.kafe'], reviewStatus: 'ai_draft' };

  it('accepts each exercise type', () => {
    const samples = [
      {
        ...base,
        type: 'select_meaning',
        bg: 'кафе',
        options: [
          { en: 'coffee', tr: 'kahve' },
          { en: 'tea', tr: 'çay' },
        ],
        answerIndex: 0,
      },
      {
        ...base,
        type: 'tiles_translate',
        bg: 'Обичам кафе.',
        meaning,
        direction: 'src_to_bg',
        accepted: { bg: ['{Аз |}обичам кафе.'] },
        distractors: { bg: ['кафето'] },
      },
      {
        ...base,
        type: 'type_translate',
        bg: 'Обичам кафе.',
        meaning,
        direction: 'bg_to_src',
        accepted: { en: ['I love coffee.'], tr: ['Kahveyi seviyorum.'] },
      },
      { ...base, type: 'listen_tiles', bg: 'Обичам кафе.', meaning, accepted: ['Обичам кафе.'] },
      { ...base, type: 'listen_type', bg: 'Обичам кафе.', meaning, accepted: ['Обичам кафе.'] },
      {
        ...base,
        type: 'match_pairs',
        pairs: [
          { bg: 'кафе', meaning: { en: 'coffee', tr: 'kahve' } },
          { bg: 'чай', meaning: { en: 'tea', tr: 'çay' } },
          { bg: 'вода', meaning: { en: 'water', tr: 'su' } },
        ],
      },
      {
        ...base,
        type: 'fill_blank',
        bg: 'Обичам ___.',
        meaning,
        options: ['кафе', 'кафето'],
        answerIndex: 0,
        explanation: { en: 'x', tr: 'y' },
      },
    ];
    for (const sample of samples) {
      const result = exerciseSchema.safeParse(sample);
      expect(result.success, `${sample.type}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
    }
  });

  it.each([
    ['unknown type', { ...base, type: 'nope' }],
    [
      'src_to_bg without accepted.bg',
      {
        ...base,
        type: 'type_translate',
        bg: 'Да.',
        meaning,
        direction: 'src_to_bg',
        accepted: { en: ['Yes.'] },
      },
    ],
    [
      'bg_to_src missing tr',
      {
        ...base,
        type: 'tiles_translate',
        bg: 'Да.',
        meaning,
        direction: 'bg_to_src',
        accepted: { en: ['Yes.'] },
      },
    ],
    [
      'select_meaning answerIndex out of range',
      {
        ...base,
        type: 'select_meaning',
        bg: 'кафе',
        options: [
          { en: 'a', tr: 'b' },
          { en: 'c', tr: 'd' },
        ],
        answerIndex: 2,
      },
    ],
    [
      'fill_blank without blank',
      {
        ...base,
        type: 'fill_blank',
        bg: 'Обичам кафе.',
        meaning,
        options: ['a', 'b'],
        answerIndex: 0,
      },
    ],
    [
      'fill_blank with two blanks',
      { ...base, type: 'fill_blank', bg: '___ ___.', meaning, options: ['a', 'b'], answerIndex: 0 },
    ],
    [
      'fill_blank answerIndex out of range',
      {
        ...base,
        type: 'fill_blank',
        bg: 'Обичам ___.',
        meaning,
        options: ['a', 'b'],
        answerIndex: 5,
      },
    ],
    [
      'no targets',
      { ...base, targets: [], type: 'listen_type', bg: 'Да.', meaning, accepted: ['Да.'] },
    ],
    ['empty accepted list', { ...base, type: 'listen_type', bg: 'Да.', meaning, accepted: [] }],
    ['too few match pairs', { ...base, type: 'match_pairs', pairs: [] }],
  ])('rejects %s', (_label, value) => {
    expect(exerciseSchema.safeParse(value).success).toBe(false);
  });
});

describe('grammar and course structure', () => {
  const unit = {
    id: 'unit.a1-01',
    order: 1,
    title: { en: 'Greetings', tr: 'Selamlaşma' },
    cefr: 'A1',
    goals: [{ en: 'Say hello', tr: 'Merhaba de' }],
    grammarIds: [],
    lessonIds: ['lesson.a1-01-01'],
  };

  it('accepts a grammar point', () => {
    const gp = {
      id: 'gram.sam',
      title: { en: 'to be', tr: 'olmak' },
      cefr: 'A1',
      explanation: { en: 'x', tr: 'y' },
      examples: [{ bg: 'Аз съм тук.', en: 'I am here.', tr: 'Buradayım.' }],
      prerequisites: [],
      reviewStatus: 'ai_draft',
    };
    expect(grammarPointSchema.safeParse(gp).success).toBe(true);
    expect(grammarPointSchema.safeParse({ ...gp, examples: [] }).success).toBe(false);
  });

  it('accepts a unit, lesson and manifest', () => {
    expect(unitSchema.safeParse(unit).success).toBe(true);
    expect(courseManifestSchema.safeParse({ contentVersion: 'abc', units: [unit] }).success).toBe(
      true,
    );
    expect(courseManifestSchema.safeParse({ contentVersion: 'abc', units: [] }).success).toBe(true);
    const lesson = {
      id: 'lesson.a1-01-01',
      unitId: 'unit.a1-01',
      order: 0,
      newLexemeIds: ['lex.kafe'],
      grammarIds: [],
      exercises: [
        {
          id: 'ex.a1-01-01.01',
          targets: ['lex.kafe'],
          reviewStatus: 'ai_draft',
          type: 'listen_type',
          bg: 'Кафе.',
          meaning: { en: 'Coffee.', tr: 'Kahve.' },
          accepted: ['Кафе.'],
        },
      ],
    };
    expect(lessonSchema.safeParse(lesson).success).toBe(true);
    expect(lessonSchema.safeParse({ ...lesson, exercises: [] }).success).toBe(false);
  });
});
