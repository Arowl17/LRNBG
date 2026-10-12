// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
  checkLetters,
  checkReferences,
  checkRussianisms,
  collectBgStrings,
  formatIssue,
  loadCourse,
  runAllChecks,
  russianismsSchema,
  words,
  type BgString,
} from './content.ts';

// Fixture Bulgarian here only exercises the validator; it is not course content.

const russianisms = russianismsSchema.parse(
  parse(
    readFileSync(join(import.meta.dirname, '../../content/validators/russianisms.yaml'), 'utf8'),
  ),
);

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'content-'));
  for (const d of ['lexicon', 'grammar', 'units']) mkdirSync(join(root, d));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

const write = (path: string, text: string) => writeFileSync(join(root, path), text);

const LEXICON = `
- id: lex.kafe
  lemma: кафе́
  pos: noun
  gender: n
  translations: { en: [coffee], tr: [kahve] }
  cefr: A1
  tags: [food]
  reviewStatus: ai_draft
  sources: [own]
`;

const GRAMMAR = `
- id: gram.sam
  title: { en: to be, tr: olmak }
  cefr: A1
  explanation: { en: x, tr: y }
  examples: [{ bg: Аз съм тук., en: I am here., tr: Buradayım. }]
  prerequisites: []
  reviewStatus: ai_draft
`;

const unitFile = (bg: string, extra = '') => `
unit:
  id: unit.a1-01
  order: 1
  title: { en: Café, tr: Kafe }
  cefr: A1
  goals: []
  grammarIds: [gram.sam]
  lessonIds: [lesson.a1-01-01]
lessons:
  - id: lesson.a1-01-01
    unitId: unit.a1-01
    order: 0
    newLexemeIds: [lex.kafe]
    grammarIds: []
    exercises:
      - id: ex.a1-01-01.01
        type: listen_type
        targets: [lex.kafe${extra}]
        reviewStatus: ai_draft
        bg: "${bg}"
        meaning: { en: Coffee, tr: Kahve }
        accepted: ["${bg}"]
`;

describe('loadCourse', () => {
  it('loads a valid course with a stable content version', () => {
    write('lexicon/food.yaml', LEXICON);
    write('grammar/basics.yaml', GRAMMAR);
    write('units/a1-01.yaml', unitFile('Кафе, моля.'));
    const { course, issues } = loadCourse(root);
    expect(issues).toEqual([]);
    expect(course.units).toHaveLength(1);
    expect(course.lessons[0]?.exercises).toHaveLength(1);
    expect(runAllChecks(course, russianisms)).toEqual([]);
    expect(loadCourse(root).course.contentVersion).toBe(course.contentVersion);
    write('lexicon/food.yaml', LEXICON.replace('coffee', 'a coffee'));
    expect(loadCourse(root).course.contentVersion).not.toBe(course.contentVersion);
  });

  it('handles a missing content directory', () => {
    const { course, issues } = loadCourse(join(root, 'nope'));
    expect(issues).toEqual([]);
    expect(course.units).toEqual([]);
  });

  it('reports YAML syntax errors', () => {
    write('lexicon/bad.yaml', '- id: [unclosed');
    const { issues } = loadCourse(root);
    expect(issues[0]?.message).toMatch(/YAML syntax/);
  });

  it('reports schema errors with a path', () => {
    write('lexicon/bad.yaml', LEXICON.replace('  gender: n\n', ''));
    const { issues } = loadCourse(root);
    expect(issues).toContainEqual(
      expect.objectContaining({ file: 'lexicon/bad.yaml', where: '0.gender' }),
    );
  });

  it('reports duplicate ids across files', () => {
    write('lexicon/a.yaml', LEXICON);
    write('lexicon/b.yaml', LEXICON);
    const { issues } = loadCourse(root);
    expect(issues.map((i) => i.message)).toContainEqual(expect.stringMatching(/duplicate id/));
  });

  it('walks nested folders and ignores non-YAML files', () => {
    mkdirSync(join(root, 'lexicon', 'food'));
    write('lexicon/food/drinks.yml', LEXICON);
    write('lexicon/README.md', '# notes');
    expect(loadCourse(root).course.lexemes).toHaveLength(1);
  });
});

describe('checks', () => {
  const s = (text: string): BgString => ({ text, file: 'f.yaml', where: 'x' });

  it.each(['Ты', 'это', 'ёлка', 'ѣ', 'ѫ'])('rejects forbidden letters: %s', (text) => {
    expect(checkLetters([s(text)])).toHaveLength(1);
  });

  it('rejects Latin look-alikes inside Cyrillic', () => {
    // "кафe" with a Latin e
    expect(checkLetters([s('кафe')])[0]?.message).toMatch(/Latin letter "e"/);
  });

  it('accepts ѝ and stress marks', () => {
    expect(checkLetters([s('Дадох ѝ кафе́то.')])).toEqual([]);
  });

  it.each([
    ['Спасибо!', 'спасибо'],
    ['Здравствуйте, как сте?', 'здравствуйте'],
    ['ХОРОШО', 'хорошо'],
    ['Това е хоро́шо.', 'хорошо'], // stress marks don't hide it
    ['{Да|Нет}', 'нет'], // inside alternation syntax
    ['До свидания!', 'до свидания'], // multi-word entry
  ])('flags seeded Russianism in "%s"', (text, ru) => {
    const issues = checkRussianisms([s(text)], russianisms);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain(`"${ru}"`);
  });

  it.each(['Благодаря!', 'Добре.', 'Какво е това?', 'Нето тегло', 'Свидание'])(
    'does not flag Bulgarian "%s"',
    (text) => {
      expect(checkRussianisms([s(text)], russianisms)).toEqual([]);
    },
  );

  it('splits text into lower-case words without stress marks', () => {
    expect(words('Добъ́р ден, {Аз |}съм!')).toEqual(['добър', 'ден', 'аз', 'съм']);
  });

  it('finds unknown references', () => {
    write(
      'lexicon/food.yaml',
      LEXICON.replace('sources: [own]', 'sources: [own]\n  aspectPartnerId: lex.nope'),
    );
    write('units/a1-01.yaml', unitFile('Кафе.', ', gram.nope'));
    const { course } = loadCourse(root);
    const messages = checkReferences(course).map((i) => i.message);
    expect(messages).toContain('unknown id "gram.sam"'); // unit.grammarIds — grammar file missing
    expect(messages).toContain('unknown id "gram.nope"');
  });

  it('collects Bulgarian strings from every exercise type and lexeme forms', () => {
    write(
      'lexicon/food.yaml',
      LEXICON.replace('sources: [own]', 'sources: [own]\n  forms: { pl: кафета́ }'),
    );
    write('grammar/basics.yaml', GRAMMAR);
    const meaning = '{ en: x, tr: y }';
    const base = (id: string, type: string) =>
      `      - id: ex.t.${id}\n        type: ${type}\n        targets: [lex.kafe]\n        reviewStatus: ai_draft\n`;
    write(
      'units/u.yaml',
      `
unit: { id: unit.u, order: 0, title: ${meaning}, cefr: A1, goals: [], grammarIds: [], lessonIds: [lesson.u] }
lessons:
  - id: lesson.u
    unitId: unit.u
    order: 0
    newLexemeIds: []
    grammarIds: []
    exercises:
${base('1', 'select_meaning')}        bg: б1
        options: [${meaning}, ${meaning}]
        answerIndex: 0
${base('2', 'tiles_translate')}        bg: б2
        meaning: ${meaning}
        direction: src_to_bg
        accepted: { bg: [б3] }
        distractors: { bg: [б4] }
${base('3', 'type_translate')}        bg: б5
        meaning: ${meaning}
        direction: src_to_bg
        accepted: { bg: [б6] }
${base('4', 'listen_tiles')}        bg: б7
        meaning: ${meaning}
        accepted: [б8]
        distractors: [б9]
${base('5', 'listen_type')}        bg: б10
        meaning: ${meaning}
        accepted: [б11]
${base('6', 'match_pairs')}        pairs: [{ bg: б12, meaning: ${meaning} }, { bg: б13, meaning: ${meaning} }, { bg: б14, meaning: ${meaning} }]
${base('7', 'fill_blank')}        bg: б15 ___
        meaning: ${meaning}
        options: [б16, б17]
        answerIndex: 0
${base('8', 'tiles_translate')}        bg: б18
        meaning: ${meaning}
        direction: bg_to_src
        accepted: { en: [x], tr: [y] }
${base('9', 'type_translate')}        bg: б19
        meaning: ${meaning}
        direction: bg_to_src
        accepted: { en: [x], tr: [y] }
`,
    );
    const { course, issues } = loadCourse(root);
    expect(issues).toEqual([]);
    const texts = collectBgStrings(course).map((b) => b.text);
    expect(texts).toEqual(
      expect.arrayContaining([
        'кафе́',
        'кафета́',
        'Аз съм тук.',
        'б15 ___',
        ...Array.from({ length: 19 }, (_, i) => (i === 14 ? 'б15 ___' : `б${i + 1}`)),
      ]),
    );
  });

  it('formats issues for the terminal', () => {
    expect(formatIssue({ level: 'error', file: 'a.yaml', where: 'x.y', message: 'bad' })).toBe(
      'ERROR  a.yaml › x.y: bad',
    );
    expect(formatIssue({ level: 'warning', file: 'a.yaml', where: '', message: 'hm' })).toBe(
      'warn   a.yaml: hm',
    );
  });
});
