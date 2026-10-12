// @vitest-environment node
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import type { Exercise, Lesson, Lexeme } from '../../src/content/schema.ts';
import { loadCourse, runAllChecks, russianismsSchema, type Course } from './content.ts';
import { bgWords, checkCourseLanguage, formsOf } from './linguistic.ts';

// Fixture Bulgarian exercises the validators; it is not course content.

const lex = (id: string, lemma: string, extra: Partial<Lexeme> = {}): Lexeme => ({
  id,
  lemma,
  pos: 'interj',
  translations: { en: ['x'], tr: ['y'] },
  cefr: 'A1',
  tags: [],
  reviewStatus: 'ai_draft',
  sources: ['own'],
  ...extra,
});
const noun = (id: string, lemma: string, forms: Record<string, string>, tags: string[] = []) =>
  lex(id, lemma, { pos: 'noun', gender: 'm', forms, tags });

const LEX = [
  lex('lex.az', 'аз', { pos: 'pron' }),
  lex('lex.sam', 'съм', { pos: 'verb', forms: { pres_2sg: 'си', pres_3sg: 'е' } }),
  lex('lex.student', 'студе́нт', { pos: 'noun', gender: 'm' }),
  lex('lex.dobar-den', 'до́бър де́н', { pos: 'phrase' }),
  noun('lex.stol', 'стол', {
    def_sg_full: 'стола́т',
    def_sg_short: 'стола́',
    pl: 'столове́',
    count_form: 'сто́ла',
  }),
  lex('lex.dva', 'два', { pos: 'num' }),
  lex('lex.tuk', 'тук', { pos: 'adv' }),
];

const say = (id: string, bg: string, targets: string[], accepted = [bg]): Exercise => ({
  id,
  type: 'listen_type',
  targets,
  reviewStatus: 'ai_draft',
  bg,
  meaning: { en: 'x', tr: 'y' },
  accepted,
});
const choose = (id: string, bg: string, targets: string[]): Exercise => ({
  id,
  type: 'select_meaning',
  targets,
  reviewStatus: 'ai_draft',
  bg,
  options: [
    { en: 'a', tr: 'b' },
    { en: 'c', tr: 'd' },
  ],
  answerIndex: 0,
});

/** A lesson that practises each new word 3× in 2 types, plus any extra exercises. */
function lesson(id: string, newIds: string[], extra: Exercise[] = []): Lesson {
  const drills = newIds.flatMap((target, i) => {
    const word = LEX.find((l) => l.id === target)!.lemma.replaceAll('́', '');
    return [
      choose(`ex.${id}.c${i}`, word, [target]),
      say(`ex.${id}.s${i}`, word, [target]),
      choose(`ex.${id}.d${i}`, `${word}!`, [target]),
    ];
  });
  return {
    id: `lesson.${id}`,
    unitId: 'unit.u',
    order: 0,
    newLexemeIds: newIds,
    grammarIds: [],
    exercises: [...drills, ...extra],
  };
}

function course(lessons: Lesson[]): Course {
  return {
    lexemes: LEX,
    grammar: [],
    contentVersion: 't',
    fileOf: new Map(),
    units: [
      {
        id: 'unit.u',
        order: 0,
        title: { en: 'U', tr: 'U' },
        cefr: 'A1',
        goals: [],
        grammarIds: [],
        lessonIds: lessons.map((l) => l.id),
      },
    ],
    lessons,
  };
}
const messages = (c: Course) => checkCourseLanguage(c).map((i) => `${i.level}: ${i.message}`);

describe('helpers', () => {
  it('bgWords and formsOf', () => {
    expect(bgWords('До́бър ден, по-добре! 5 {Аз |}съм')).toEqual([
      'добър',
      'ден',
      'по-добре',
      'аз',
      'съм',
    ]);
    expect(formsOf(LEX[1]!)).toEqual(['съм', 'си', 'е']);
    expect(formsOf(LEX[3]!)).toEqual(['добър', 'ден']);
  });
});

describe('checkCourseLanguage', () => {
  it('passes a well-formed lesson', () => {
    expect(
      messages(
        course([
          lesson(
            'l1',
            ['lex.az', 'lex.sam', 'lex.student'],
            [say('ex.l1.x', 'Аз съм студент.', ['lex.sam'])],
          ),
        ]),
      ),
    ).toEqual([]);
  });

  it('vocabulary gating: words must be taught in this or an earlier lesson (through any form)', () => {
    const l1 = lesson('l1', ['lex.az', 'lex.sam', 'lex.student']);
    const l2 = lesson(
      'l2',
      ['lex.tuk', 'lex.dobar-den', 'lex.dva'],
      [
        say('ex.l2.ok', 'Студент си. Добър ден!', ['lex.tuk']), // form "си" and phrase words count
        say('ex.l2.bad', 'Аз съм лекар.', ['lex.tuk']),
      ],
    );
    expect(messages(course([l1, l2]))).toEqual([
      'error: not taught yet: лекар',
      'error: not taught yet: лекар',
    ]);
    // Order matters: the same sentence in lesson 1 uses words taught only in lesson 2.
    const early = lesson(
      'l1',
      ['lex.az', 'lex.sam', 'lex.student'],
      [say('ex.l1.early', 'Аз съм тук.', ['lex.az'])],
    );
    expect(
      messages(course([early, lesson('l2', ['lex.tuk', 'lex.dobar-den', 'lex.dva'])])),
    ).toContain('error: not taught yet: тук');
  });

  it('extra accepted alternatives may use untaught words; the main answer may not', () => {
    const l = lesson(
      'l1',
      ['lex.az', 'lex.sam', 'lex.student'],
      [
        say('ex.l1.alt', 'Аз съм студент.', ['lex.sam'], ['Аз съм студент.', 'Аз съм студентче.']),
        say('ex.l1.main', 'Аз съм студент.', ['lex.sam'], ['{Аз съм студент|Аз съм лекар}.']),
      ],
    );
    expect(messages(course([l]))).toEqual([]);
    const bad = lesson(
      'l1',
      ['lex.az', 'lex.sam', 'lex.student'],
      [say('ex.l1.x', 'Аз съм студент.', ['lex.sam'], ['Аз съм лекар.'])],
    );
    expect(messages(course([bad]))).toEqual(['error: not taught yet: лекар']);
  });

  it('clitics cannot start a sentence — including through optional parts of accepted answers', () => {
    const l = lesson(
      'l1',
      ['lex.az', 'lex.sam', 'lex.student'],
      [
        say('ex.l1.x', 'Аз съм студент.', ['lex.sam'], ['{Аз |}съм студент.']),
        say('ex.l1.y', 'Студент съм. Си студент.', ['lex.sam']),
      ],
    );
    const m = messages(course([l]));
    expect(m).toContain('error: "съм" can\'t start a sentence: "съм студент."');
    expect(m).toContainEqual(expect.stringContaining('"си" can\'t start a sentence'));
    // "съм студент." (from the optional "Аз ") + "Си студент." in both bg and accepted.
    expect(m.filter((x) => x.includes("can't start"))).toHaveLength(3);
  });

  it('"е" at the start is only a warning, and "Е, …" is fine', () => {
    const l = lesson(
      'l1',
      ['lex.az', 'lex.sam', 'lex.student'],
      [say('ex.l1.a', 'Е студент.', ['lex.sam']), say('ex.l1.b', 'Е, студент.', ['lex.sam'])],
    );
    expect(messages(course([l])).filter((m) => m.includes('"е"'))).toEqual([
      'warning: "е" starts a sentence — fine only as "Е, …" (well): "Е студент."',
      'warning: "е" starts a sentence — fine only as "Е, …" (well): "Е студент."',
    ]);
  });

  it('new-word budget and usage', () => {
    const tooFew: Lesson = { ...lesson('l1', ['lex.az']), newLexemeIds: ['lex.az', 'lex.sam'] };
    const m = messages(course([tooFew]));
    expect(m).toContain('warning: 2 new words (aim for 3–7)');
    expect(m).toContain(
      'error: new word lex.sam is practised 0× in 0 exercise type(s) (need ≥3× in ≥2 types)',
    );
  });

  it('bad alternation syntax is an error; duplicates are warnings', () => {
    const l = lesson(
      'l1',
      ['lex.az', 'lex.sam', 'lex.student'],
      [
        say('ex.l1.x', 'Аз съм студент.', ['lex.sam'], ['{Аз съм студент.']),
        say('ex.l1.y', 'Аз съм студент.', ['lex.sam']),
        say('ex.l1.z', 'Аз съм студент.', ['lex.sam']),
      ],
    );
    const m = messages(course([l]));
    expect(m).toContainEqual(expect.stringMatching(/^error: Unclosed "\{"/));
    expect(m).toContain('warning: duplicate of ex.l1.y'); // x differs: its accepted answers differ
  });

  it('heuristics: short article at sentence start, numeral without counting form, Russian endings', () => {
    const russian = noun('lex.ru', 'дом', { pl: 'домами' });
    const c = course([
      lesson(
        'l1',
        ['lex.stol', 'lex.dva', 'lex.sam'],
        [
          say('ex.l1.a', 'Стола е тук.', ['lex.stol']),
          say('ex.l1.b', 'Два столове.', ['lex.stol']),
          say('ex.l1.c', 'Два стола.', ['lex.stol']),
        ],
      ),
    ]);
    c.lexemes = [...c.lexemes, russian];
    const m = messages(c).filter((x) => x.startsWith('warning'));
    expect(m).toContainEqual(
      expect.stringContaining('"стола" (short article) starts the sentence'),
    );
    expect(m).toContainEqual(
      expect.stringContaining('"два столове" — after a numeral, use the counting form "стола"'),
    );
    expect(m).toContainEqual(
      expect.stringContaining('"домами" ends in Russian-style case ending "-ами"'),
    );
    expect(m.filter((x) => x.includes('counting form'))).toHaveLength(2); // bg + accepted of ex.l1.b only
  });
});

describe('seeded Russianisms fail the build (SPEC §18 Phase 2 gate)', () => {
  it('the seeded fixture produces Russianism and letter errors', () => {
    const { course: c } = loadCourse(join(import.meta.dirname, '__fixtures__/seeded'));
    const list = russianismsSchema.parse(
      parse(
        readFileSync(
          join(import.meta.dirname, '../../content/validators/russianisms.yaml'),
          'utf8',
        ),
      ),
    );
    const errors = runAllChecks(c, list)
      .filter((i) => i.level === 'error')
      .map((i) => i.message);
    expect(errors).toContainEqual(expect.stringMatching(/Russianism "спасибо"/));
    expect(errors).toContainEqual(expect.stringMatching(/Russianism "хорошо"/));
    expect(errors).toContainEqual(expect.stringMatching(/Russianism "что"/));
    expect(errors).toContainEqual(expect.stringMatching(/letter "ы" does not exist/));
  });
});
