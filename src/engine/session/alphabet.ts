import type { AlphabetBundle, AlphabetLetter, Lexeme, Localized } from '../../content/schema';
import { stripStress } from '../../content/stress';
import { sample, shuffle, type Rng } from '../../lib/random';
import { toLatin } from '../answer-check/transliterate';

/*
 * Section 0 exercises are generated from the alphabet data rather than authored one by one.
 * Distractors are chosen to test real confusions (SPEC §8): Latin look-alikes (в read as "b"),
 * and similar sounds (ш / щ / ч, ъ / а).
 */

/** SRS target id for a letter, e.g. "letter.щ". */
export const letterTarget = (lower: string) => `letter.${lower}`;

export interface AlphabetIntro {
  type: 'alphabet_intro';
  id: string;
  targets: string[];
  letter: AlphabetLetter;
  example: Lexeme;
}

export interface AlphabetLetterSound {
  type: 'alphabet_letter_sound';
  id: string;
  targets: string[];
  /** letter_to_sound: see "щ", pick "sht". sound_to_letter: see "sht", pick "щ". */
  direction: 'letter_to_sound' | 'sound_to_letter';
  letter: AlphabetLetter;
  options: string[];
  answerIndex: number;
}

export interface AlphabetReadWord {
  type: 'alphabet_read_word';
  id: string;
  targets: string[];
  word: Lexeme;
  /** Possible Latin readings; one is the Streamlined transliteration. */
  options: string[];
  answerIndex: number;
}

export interface AlphabetTypeWord {
  type: 'alphabet_type_word';
  id: string;
  targets: string[];
  word: Lexeme;
  /** Shown to the learner: the Latin reading and the meaning. */
  latin: string;
  meaning: Localized;
  /** What to type (lemma without stress marks). */
  answer: string;
}

export type AlphabetExercise =
  AlphabetIntro | AlphabetLetterSound | AlphabetReadWord | AlphabetTypeWord;

/** Letters that sound alike or are easily mixed up, used for distractors. */
const SIMILAR: Record<string, string[]> = {
  а: ['ъ', 'я', 'о'],
  б: ['в', 'п'],
  в: ['б', 'ф'],
  г: ['х', 'к'],
  д: ['т', 'б'],
  е: ['и', 'я'],
  ж: ['ш', 'з', 'ч'],
  з: ['с', 'ж'],
  и: ['й', 'е'],
  й: ['и', 'я'],
  к: ['г', 'х'],
  л: ['р', 'н'],
  м: ['н', 'т'],
  н: ['м', 'л'],
  о: ['у', 'а'],
  п: ['б', 'ф'],
  р: ['л', 'н'],
  с: ['з', 'ц'],
  т: ['д', 'м'],
  у: ['ю', 'о'],
  ф: ['в', 'п'],
  х: ['к', 'г'],
  ц: ['ч', 'с', 'з'],
  ч: ['ш', 'ц', 'щ'],
  ш: ['щ', 'ч', 'ж'],
  щ: ['ш', 'ч', 'ц'],
  ъ: ['а', 'у', 'о'],
  ь: ['й', 'ю', 'я'],
  ю: ['у', 'я', 'й'],
  я: ['а', 'ю', 'й'],
};

/** How a beginner might misread a letter as Latin (look-alikes). */
const MISREAD: Record<string, string> = {
  в: 'b',
  н: 'h',
  р: 'p',
  с: 'c',
  у: 'y',
  х: 'x',
  п: 'n',
  и: 'u',
  г: 'r',
  я: 'r',
  ъ: 'b',
  ь: 'b',
  ш: 'w',
  щ: 'w',
  з: '3',
  д: 'g',
  л: 'n',
  т: 'm',
  ж: 'x',
};

function pickOptions(
  correct: string,
  preferred: string[],
  pool: string[],
  rng: Rng,
): { options: string[]; answerIndex: number } {
  const distractors: string[] = [];
  for (const d of [...preferred, ...shuffle(pool, rng)]) {
    if (distractors.length === 3) break;
    if (d !== correct && !distractors.includes(d)) distractors.push(d);
  }
  const options = shuffle([correct, ...distractors], rng);
  return { options, answerIndex: options.indexOf(correct) };
}

/** Latin reading of a word, per the official Streamlined System. */
export const readingOf = (word: Lexeme) => toLatin(stripStress(word.lemma).toLocaleLowerCase('bg'));

/** Plausible wrong readings: a look-alike misread, or one letter swapped for a similar one. */
export function misreadings(word: string): string[] {
  const plain = stripStress(word).toLocaleLowerCase('bg');
  const letters = [...plain];
  const out = new Set<string>();
  // Read every look-alike letter as its Latin twin ("нос" → "hoc").
  const lookalike = letters.map((c) => MISREAD[c] ?? toLatin(c)).join('');
  out.add(lookalike);
  // One letter at a time: look-alike, or a similar-sounding letter.
  letters.forEach((c, i) => {
    const swap = (replacement: string) =>
      out.add(
        [
          ...letters.slice(0, i).map((x) => toLatin(x)),
          replacement,
          ...letters.slice(i + 1).map((x) => toLatin(x)),
        ].join(''),
      );
    if (MISREAD[c]) swap(MISREAD[c]);
    for (const s of SIMILAR[c] ?? []) swap(toLatin(s));
  });
  out.delete(toLatin(plain));
  return [...out];
}

function letterSound(
  letter: AlphabetLetter,
  known: AlphabetLetter[],
  all: AlphabetLetter[],
  rng: Rng,
): AlphabetLetterSound {
  const bySound = new Map(all.map((l) => [l.lower, l.sound]));
  const preferred = [
    ...(letter.lookalike ? [letter.lookalike.toLowerCase()] : []),
    ...(SIMILAR[letter.lower] ?? []).map((s) => bySound.get(s)!).filter(Boolean),
  ];
  const { options, answerIndex } = pickOptions(
    letter.sound,
    preferred,
    known.map((l) => l.sound),
    rng,
  );
  return {
    type: 'alphabet_letter_sound',
    id: `alphabet.${letter.lower}.sound`,
    targets: [letterTarget(letter.lower)],
    direction: 'letter_to_sound',
    letter,
    options,
    answerIndex,
  };
}

function soundLetter(
  letter: AlphabetLetter,
  known: AlphabetLetter[],
  rng: Rng,
): AlphabetLetterSound {
  const { options, answerIndex } = pickOptions(
    letter.lower,
    SIMILAR[letter.lower] ?? [],
    known.map((l) => l.lower),
    rng,
  );
  return {
    type: 'alphabet_letter_sound',
    id: `alphabet.${letter.lower}.letter`,
    targets: [letterTarget(letter.lower)],
    direction: 'sound_to_letter',
    letter,
    options,
    answerIndex,
  };
}

function lettersIn(word: Lexeme, alphabet: Map<string, AlphabetLetter>): string[] {
  return [...new Set(stripStress(word.lemma).toLocaleLowerCase('bg'))]
    .filter((c) => alphabet.has(c))
    .map(letterTarget);
}

function readWord(
  word: Lexeme,
  others: Lexeme[],
  alphabet: Map<string, AlphabetLetter>,
  rng: Rng,
): AlphabetReadWord {
  const correct = readingOf(word);
  const { options, answerIndex } = pickOptions(
    correct,
    shuffle(misreadings(word.lemma), rng),
    others.map(readingOf),
    rng,
  );
  return {
    type: 'alphabet_read_word',
    id: `alphabet.read.${word.id}`,
    targets: [word.id, ...lettersIn(word, alphabet)],
    word,
    options,
    answerIndex,
  };
}

function typeWord(word: Lexeme, alphabet: Map<string, AlphabetLetter>): AlphabetTypeWord {
  return {
    type: 'alphabet_type_word',
    id: `alphabet.type.${word.id}`,
    targets: [word.id, ...lettersIn(word, alphabet)],
    word,
    latin: readingOf(word),
    meaning: { en: word.translations.en[0]!, tr: word.translations.tr[0]! },
    answer: stripStress(word.lemma),
  };
}

export interface AlphabetSessionOptions {
  rng: Rng;
  /** How many reading drills (default 6) and typing drills (default 3). */
  reading?: number;
  typing?: number;
}

/** Build the exercises for one alphabet lesson: intro cards, then drills on new + known letters. */
export function buildAlphabetLesson(
  bundle: AlphabetBundle,
  lessonId: string,
  opts: AlphabetSessionOptions,
): AlphabetExercise[] {
  const { rng, reading = 6, typing = 3 } = opts;
  const lessonIndex = bundle.lessons.findIndex((l) => l.id === lessonId);
  const lesson = bundle.lessons[lessonIndex];
  if (!lesson) throw new Error(`Unknown alphabet lesson: ${lessonId}`);

  const alphabet = new Map(bundle.letters.map((l) => [l.lower, l]));
  const words = new Map(bundle.words.map((w) => [w.id, w]));
  const knownLetters = bundle.lessons
    .slice(0, lessonIndex + 1)
    .flatMap((l) => l.newLetters)
    .map((c) => alphabet.get(c)!);
  const newLetters = lesson.newLetters.map((c) => alphabet.get(c)!);
  const readingWords = lesson.readingWordIds.map((id) => words.get(id)!);
  const knownWords = bundle.lessons
    .slice(0, lessonIndex + 1)
    .flatMap((l) => l.readingWordIds)
    .map((id) => words.get(id)!);

  const intros: AlphabetIntro[] = newLetters.map((letter) => ({
    type: 'alphabet_intro',
    id: `alphabet.${letter.lower}.intro`,
    targets: [letterTarget(letter.lower)],
    letter,
    example: words.get(letter.exampleLexemeId)!,
  }));
  const toSound = shuffle(newLetters, rng).map((l) =>
    letterSound(l, knownLetters, bundle.letters, rng),
  );
  const toLetter = shuffle(newLetters, rng).map((l) => soundLetter(l, knownLetters, rng));
  const reads = sample(readingWords, reading, rng).map((w) =>
    readWord(
      w,
      knownWords.filter((o) => o.id !== w.id),
      alphabet,
      rng,
    ),
  );
  // Type the shortest words: typing drills should stay short for beginners.
  const typed = [...readingWords]
    .sort((a, b) => stripStress(a.lemma).length - stripStress(b.lemma).length)
    .slice(0, Math.max(typing * 2, typing));
  const types = sample(typed, typing, rng).map((w) => typeWord(w, alphabet));

  return [...intros, ...toSound, ...toLetter, ...reads, ...types];
}

/** Mixed review over every letter from the given lessons (no intro cards). */
export function buildAlphabetPractice(
  bundle: AlphabetBundle,
  lessonIds: readonly string[],
  opts: AlphabetSessionOptions & { count?: number },
): AlphabetExercise[] {
  const { rng, count = 12 } = opts;
  const alphabet = new Map(bundle.letters.map((l) => [l.lower, l]));
  const words = new Map(bundle.words.map((w) => [w.id, w]));
  const lessons = bundle.lessons.filter((l) => lessonIds.includes(l.id));
  const letters = lessons.flatMap((l) => l.newLetters).map((c) => alphabet.get(c)!);
  const lessonWords = lessons.flatMap((l) => l.readingWordIds).map((id) => words.get(id)!);
  if (letters.length === 0) return [];

  const pool: AlphabetExercise[] = [
    ...letters.map((l) => letterSound(l, letters, bundle.letters, rng)),
    ...letters.map((l) => soundLetter(l, letters, rng)),
    ...lessonWords.map((w) =>
      readWord(
        w,
        lessonWords.filter((o) => o.id !== w.id),
        alphabet,
        rng,
      ),
    ),
    ...lessonWords.map((w) => typeWord(w, alphabet)),
  ];
  return sample(pool, count, rng);
}
