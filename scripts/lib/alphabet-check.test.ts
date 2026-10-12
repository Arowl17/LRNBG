// @vitest-environment node
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkAlphabet, loadCourse, type Course } from './content.ts';

const real = loadCourse(join(import.meta.dirname, '../../content'));

/** A deep copy of the real course we can break on purpose. */
function course(): Course {
  return { ...structuredClone({ ...real.course, fileOf: undefined }), fileOf: real.course.fileOf };
}
const messages = (c: Course) => checkAlphabet(c).map((i) => i.message);

describe('real alphabet content', () => {
  it('loads without schema errors and passes all alphabet checks', () => {
    expect(real.issues).toEqual([]);
    expect(real.course.alphabet?.letters).toHaveLength(30);
    expect(checkAlphabet(real.course)).toEqual([]);
  });
});

describe('checkAlphabet catches', () => {
  it('no alphabet → nothing to check', () => {
    expect(checkAlphabet({ ...course(), alphabet: undefined } as unknown as Course)).toEqual([]);
  });

  it('a missing letter (and that it is never taught)', () => {
    const c = course();
    c.alphabet!.letters = c.alphabet!.letters.filter((l) => l.lower !== 'щ');
    expect(messages(c)).toContain('missing letters: щ');
    expect(messages(c)).toContainEqual(expect.stringContaining('"щ" is not in the letter list'));
  });

  it('a non-Bulgarian letter and a duplicate', () => {
    const c = course();
    c.alphabet!.letters.push({
      ...c.alphabet!.letters[0]!,
      lower: 'ы',
      upper: 'Ы',
      latin: 'y',
      sound: 'ы',
    });
    c.alphabet!.letters.push({ ...c.alphabet!.letters[1]!, sound: 'other' });
    expect(messages(c)).toContain('not Bulgarian letters: ы');
    expect(messages(c)).toContain('a letter is listed twice');
  });

  it('wrong upper case or transliteration, and duplicate sound labels', () => {
    const c = course();
    const shta = c.alphabet!.letters.find((l) => l.lower === 'щ')!;
    shta.upper = 'Ш';
    shta.latin = 'shch'; // the Russian-style romanization
    c.alphabet!.letters.find((l) => l.lower === 'ъ')!.sound = 'a';
    const m = messages(c);
    expect(m).toContain('upper case of щ is Щ');
    expect(m).toContain('Streamlined transliteration of щ is "sht"');
    expect(m).toContain('sound label "a" is used twice');
  });

  it('a reading word that uses letters not taught yet (i+1)', () => {
    const c = course();
    c.alphabet!.lessons[0]!.readingWordIds.push('lex.chorba');
    expect(messages(c)).toContainEqual(
      expect.stringMatching(/"чо́рба" uses letters not taught yet: ч р б/),
    );
  });

  it('unknown reading word and example ids', () => {
    const c = course();
    c.alphabet!.lessons[0]!.readingWordIds.push('lex.nope');
    c.alphabet!.letters[0]!.exampleLexemeId = 'lex.nope2';
    expect(messages(c)).toEqual(
      expect.arrayContaining(['unknown id "lex.nope"', 'unknown id "lex.nope2"']),
    );
  });

  it('a letter taught twice', () => {
    const c = course();
    c.alphabet!.lessons[1]!.newLetters.push('а');
    expect(messages(c)).toContain('"а" is already taught in an earlier lesson');
  });

  it('an example word without the letter, or with letters taught later', () => {
    const c = course();
    c.alphabet!.letters.find((l) => l.lower === 'а')!.exampleLexemeId = 'lex.tok';
    c.alphabet!.letters.find((l) => l.lower === 'к')!.exampleLexemeId = 'lex.kafe';
    const m = messages(c);
    expect(m).toContain('"ток" does not contain а');
    expect(m).toContainEqual(expect.stringMatching(/"кафе́" uses letters taught later: ф/));
  });
});
