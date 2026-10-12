import { describe, expect, it } from 'vitest';
import type { Exercise, UnitBundle } from '../../content/schema';
import { composeLesson, listeningText } from './lesson';

// Fixture Bulgarian only exercises the composer; it is not course content.
const lex = (id: string, lemma: string) => ({
  id,
  lemma,
  pos: 'interj' as const,
  translations: { en: ['x'], tr: ['y'] },
  cefr: 'A1' as const,
  tags: [],
  reviewStatus: 'ai_draft' as const,
  sources: ['own'],
});
const ex = (
  id: string,
  targets: string[],
  type: 'listen_type' | 'select_meaning' = 'select_meaning',
): Exercise =>
  type === 'listen_type'
    ? {
        id,
        type,
        targets,
        reviewStatus: 'ai_draft',
        bg: 'Да.',
        meaning: { en: 'Yes.', tr: 'Evet.' },
        accepted: ['Да.'],
      }
    : {
        id,
        type,
        targets,
        reviewStatus: 'ai_draft',
        bg: 'да',
        options: [
          { en: 'yes', tr: 'evet' },
          { en: 'no', tr: 'hayır' },
        ],
        answerIndex: 0,
      };

const bundle: UnitBundle = {
  contentVersion: 't',
  unit: {
    id: 'unit.u',
    order: 0,
    title: { en: 'U', tr: 'U' },
    cefr: 'A1',
    goals: [],
    grammarIds: [],
    lessonIds: ['lesson.l'],
  },
  lexemes: [lex('lex.da', 'да'), lex('lex.ne', 'не')],
  grammar: [
    {
      id: 'gram.g',
      title: { en: 'G', tr: 'G' },
      cefr: 'A1',
      explanation: { en: 'e', tr: 't' },
      examples: [{ bg: 'Да.', en: 'Yes.', tr: 'Evet.' }],
      prerequisites: [],
      reviewStatus: 'ai_draft',
    },
  ],
  lessons: [
    {
      id: 'lesson.l',
      unitId: 'unit.u',
      order: 0,
      newLexemeIds: ['lex.da', 'lex.ne'],
      grammarIds: ['gram.g', 'gram.missing'],
      exercises: [
        ex('ex.l.1', ['lex.da']),
        ex('ex.l.2', ['lex.da', 'lex.ne'], 'listen_type'),
        ex('ex.l.3', ['lex.ne']),
      ],
    },
  ],
};

describe('composeLesson', () => {
  it('puts tips first and introduces each new word once, before its first exercise', () => {
    expect(composeLesson(bundle, 'lesson.l').map((i) => i.id)).toEqual([
      'tip.gram.g',
      'intro.lex.da',
      'ex.l.1',
      'intro.lex.ne',
      'ex.l.2',
      'ex.l.3',
    ]);
  });

  it('can leave out exercises (e.g. listening without audio)', () => {
    const items = composeLesson(bundle, 'lesson.l', { include: (e) => !listeningText(e) });
    expect(items.map((i) => i.id)).toEqual([
      'tip.gram.g',
      'intro.lex.da',
      'ex.l.1',
      'intro.lex.ne',
      'ex.l.3',
    ]);
  });

  it('throws for an unknown lesson', () => {
    expect(() => composeLesson(bundle, 'lesson.nope')).toThrow(/Unknown lesson/);
  });

  it('listeningText only for listening exercises', () => {
    expect(listeningText(ex('ex.a', ['lex.da'], 'listen_type'))).toBe('Да.');
    expect(listeningText(ex('ex.b', ['lex.da']))).toBeUndefined();
  });
});
