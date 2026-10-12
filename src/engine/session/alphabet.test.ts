import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCourse } from '../../../scripts/lib/content.ts';
import type { AlphabetBundle } from '../../content/schema';
import { seededRng } from '../../lib/random';
import {
  buildAlphabetLesson,
  buildAlphabetPractice,
  misreadings,
  readingOf,
  type AlphabetExercise,
} from './alphabet';

const { course } = loadCourse(join(import.meta.dirname, '../../../content'));
const bundle: AlphabetBundle = {
  contentVersion: 'test',
  letters: course.alphabet!.letters,
  lessons: course.alphabet!.lessons,
  words: course.lexemes,
};

function checkChoices(ex: AlphabetExercise) {
  if (ex.type !== 'alphabet_letter_sound' && ex.type !== 'alphabet_read_word') return;
  expect(ex.options.length).toBeGreaterThanOrEqual(2);
  expect(ex.options.length).toBeLessThanOrEqual(4);
  expect(new Set(ex.options).size).toBe(ex.options.length);
  const correct = ex.options[ex.answerIndex];
  if (ex.type === 'alphabet_read_word') expect(correct).toBe(readingOf(ex.word));
  else expect(correct).toBe(ex.direction === 'letter_to_sound' ? ex.letter.sound : ex.letter.lower);
}

describe('buildAlphabetLesson', () => {
  it.each(bundle.lessons.map((l) => l.id))('%s: well-formed exercises', (lessonId) => {
    const lesson = bundle.lessons.find((l) => l.id === lessonId)!;
    const exercises = buildAlphabetLesson(bundle, lessonId, { rng: seededRng(1) });
    const intros = exercises.filter((e) => e.type === 'alphabet_intro');
    expect(intros.map((e) => e.letter.lower)).toEqual(lesson.newLetters);
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
    expect(exercises.filter((e) => e.type === 'alphabet_type_word')).toHaveLength(3);
    for (const ex of exercises) {
      expect(ex.targets.length).toBeGreaterThan(0);
      checkChoices(ex);
      if (ex.type === 'alphabet_type_word') {
        expect(ex.answer).not.toMatch(/́/);
        expect(lesson.readingWordIds).toContain(ex.word.id);
      }
    }
  });

  it('puts intro cards first', () => {
    const exercises = buildAlphabetLesson(bundle, 'lesson.alphabet-6', { rng: seededRng(5) });
    expect(exercises.slice(0, 5).every((e) => e.type === 'alphabet_intro')).toBe(true);
  });

  it('is deterministic for a seed', () => {
    const a = buildAlphabetLesson(bundle, 'lesson.alphabet-2', { rng: seededRng(9) });
    const b = buildAlphabetLesson(bundle, 'lesson.alphabet-2', { rng: seededRng(9) });
    expect(a).toEqual(b);
  });

  it('offers the look-alike reading as a distractor for false friends', () => {
    const exercises = buildAlphabetLesson(bundle, 'lesson.alphabet-2', { rng: seededRng(3) });
    const v = exercises.find(
      (e) =>
        e.type === 'alphabet_letter_sound' &&
        e.direction === 'letter_to_sound' &&
        e.letter.lower === 'в',
    );
    expect(v?.type === 'alphabet_letter_sound' && v.options).toContain('b');
  });

  it('throws for an unknown lesson', () => {
    expect(() => buildAlphabetLesson(bundle, 'lesson.nope', { rng: seededRng(1) })).toThrow(
      /Unknown/,
    );
  });
});

describe('buildAlphabetPractice', () => {
  it('mixes drills from the chosen lessons', () => {
    const exercises = buildAlphabetPractice(bundle, ['lesson.alphabet-1', 'lesson.alphabet-2'], {
      rng: seededRng(2),
      count: 10,
    });
    expect(exercises).toHaveLength(10);
    expect(exercises.some((e) => e.type === 'alphabet_intro')).toBe(false);
    exercises.forEach(checkChoices);
  });

  it('returns nothing for no lessons', () => {
    expect(buildAlphabetPractice(bundle, [], { rng: seededRng(2) })).toEqual([]);
  });
});

describe('readings', () => {
  it('uses the Streamlined System', () => {
    const shtarkel = bundle.words.find((w) => w.id === 'lex.shtarkel')!;
    expect(readingOf(shtarkel)).toBe('shtarkel');
  });

  it('misreadings include look-alike and similar-sound errors, never the right answer', () => {
    const m = misreadings('нос');
    expect(m).toContain('hoc'); // all look-alikes read as Latin
    expect(m).toContain('noz'); // с → з
    expect(m).not.toContain('nos');
    expect(misreadings('щъ́ркел')).toContain('shtarkel'.replace('sht', 'sh'));
  });
});
