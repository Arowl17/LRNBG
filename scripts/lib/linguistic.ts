/*
 * Course-level linguistic checks (SPEC §12): vocabulary gating (i+1), clitics at the start of a
 * sentence, new-word budget and usage, valid accepted answers, and heuristic warnings for
 * article form, counting form, Russian-style case endings and duplicate exercises.
 *
 * Honesty rule: these catch *classes* of error. Passing them doesn't make Bulgarian correct —
 * native review is still required before anything is `native_verified`.
 */
import type { Lesson, Lexeme } from '../../src/content/schema.ts';
import { AlternationSyntaxError, expandAll } from '../../src/engine/answer-check/expand.ts';
import type { Course, Issue } from './content.ts';
import { exerciseTexts } from './exercise-text.ts';

/** Lower-case words without stress marks; digits and punctuation dropped. */
export function bgWords(text: string): string[] {
  return text
    .normalize('NFC')
    .replaceAll('́', '')
    .toLocaleLowerCase('bg')
    .split(/[^\p{L}-]+/u)
    .map((w) => w.replace(/^-+|-+$/g, ''))
    .filter(Boolean);
}

/** Every written form of a lexeme (lemma, all forms, and each word of a multi-word phrase). */
export function formsOf(lex: Lexeme): string[] {
  return [lex.lemma, ...Object.values(lex.forms ?? {})].flatMap(bgWords);
}

/** Lessons in course order: units by `order`, then each unit's `lessonIds` order. */
export function orderedLessons(course: Course): Lesson[] {
  const byId = new Map(course.lessons.map((l) => [l.id, l]));
  return [...course.units]
    .sort((a, b) => a.order - b.order)
    .flatMap((u) => u.lessonIds.flatMap((id) => byId.get(id) ?? []));
}

/** Short (clitic) forms that can never start a sentence. "ти"/"те" are skipped: also "you"/"they". */
export const CLITICS = new Set([
  'ме',
  'го',
  'ни',
  'ви',
  'ги',
  'ми',
  'му',
  'ѝ',
  'им',
  'се',
  'съм',
  'сме',
  'сте',
  'са',
  'си',
]);
/** "е" (is) can't start a sentence either, but "Е, добре." (well, OK) is fine — so only a warning. */
const MAYBE_CLITIC = new Set(['е']);

const sentencesOf = (text: string) =>
  text
    .split(/[.!?…]+/)
    .map((s) => s.trim())
    .filter(Boolean);

function expanded(text: string): { answers: string[]; error?: string; truncated: boolean } {
  try {
    const { answers, truncated } = expandAll([text]);
    return { answers, truncated };
  } catch (e) {
    if (e instanceof AlternationSyntaxError)
      return { answers: [], error: e.message, truncated: false };
    throw e;
  }
}

/** Numerals after which a masculine non-person noun takes its counting form (два стола). */
const COUNTING_NUMERALS = new Set([
  'два',
  'три',
  'четири',
  'пет',
  'шест',
  'седем',
  'осем',
  'девет',
  'десет',
  'няколко',
  'колко',
]);

/** Russian case endings that should not appear in Bulgarian noun/adjective forms. */
const RUSSIAN_ENDINGS = ['ого', 'ему', 'ыми', 'ами', 'ями', 'ях', 'ах', 'ую', 'юю', 'ою'];

export function checkCourseLanguage(course: Course): Issue[] {
  const issues: Issue[] = [];
  const fileOf = (id: string) => course.fileOf.get(id) ?? '?';
  const push = (level: Issue['level'], id: string, where: string, message: string) =>
    issues.push({ level, file: fileOf(id), where, message });
  const lexemes = new Map(course.lexemes.map((l) => [l.id, l]));

  // Forms used by the article and counting-form heuristics.
  const mascShortArticle = new Set<string>();
  const plainPluralNeedingCount = new Map<string, string>(); // plural → counting form
  for (const lex of course.lexemes) {
    if (lex.pos !== 'noun' || lex.gender !== 'm') continue;
    const f = lex.forms ?? {};
    if (f.def_sg_short) mascShortArticle.add(bgWords(f.def_sg_short)[0]!);
    if (f.pl && f.count_form && f.pl !== f.count_form && !lex.tags.includes('person')) {
      plainPluralNeedingCount.set(bgWords(f.pl)[0]!, f.count_form.replaceAll('́', ''));
    }
    for (const [key, form] of Object.entries(f)) {
      const word = bgWords(form)[0] ?? '';
      const ending = RUSSIAN_ENDINGS.find((e) => word.endsWith(e));
      if (ending)
        push(
          'warning',
          lex.id,
          `${lex.id}.forms.${key}`,
          `"${form}" ends in Russian-style case ending "-${ending}" — please check`,
        );
    }
  }

  const known = new Set<string>();
  const seenExercises = new Map<string, string>();
  for (const lesson of orderedLessons(course)) {
    for (const id of lesson.newLexemeIds) {
      const lex = lexemes.get(id);
      if (lex) formsOf(lex).forEach((w) => known.add(w));
    }

    // New-word budget (SPEC §7.1): 3–7 new words, each used ≥3 times in ≥2 exercise types.
    const n = lesson.newLexemeIds.length;
    if (n < 3 || n > 7)
      push('warning', lesson.id, `${lesson.id}.newLexemeIds`, `${n} new words (aim for 3–7)`);
    for (const id of lesson.newLexemeIds) {
      const uses = lesson.exercises.filter((e) => e.targets.includes(id));
      const types = new Set(uses.map((e) => e.type));
      if (uses.length < 3 || types.size < 2) {
        push(
          'error',
          lesson.id,
          `${lesson.id}.exercises`,
          `new word ${id} is practised ${uses.length}× in ${types.size} exercise type(s) (need ≥3× in ≥2 types)`,
        );
      }
    }

    for (const ex of lesson.exercises) {
      for (const { path, text, kind } of exerciseTexts(ex)) {
        const where = `${ex.id}.${path}`;
        const { answers, error, truncated } = expanded(text);
        if (error) {
          push('error', ex.id, where, error);
          continue;
        }
        if (truncated) push('warning', ex.id, where, 'too many alternatives — some were dropped');

        // Vocabulary gating (i+1): every word shown, and the main answer, must be taught by now.
        // Extra accepted alternatives are exempt: they exist to accept what a learner might type.
        const isAlternative = /^accepted(\.bg)?\.\d+$/.test(path);
        const gated = !isAlternative ? answers : path.endsWith('.0') ? answers.slice(0, 1) : [];
        const unknown = [...new Set(gated.flatMap(bgWords))].filter((w) => !known.has(w));
        if (unknown.length) push('error', ex.id, where, `not taught yet: ${unknown.join(', ')}`);

        if (kind !== 'sentence') continue;
        for (const answer of answers) {
          for (const sentence of sentencesOf(answer.replaceAll('___', 'X'))) {
            const words = bgWords(sentence);
            const first = words[0] ?? '';
            // A clitic shown alone ("съм" as a vocabulary item) is not a sentence.
            if (words.length > 1 && CLITICS.has(first))
              push('error', ex.id, where, `"${first}" can't start a sentence: "${answer}"`);
            else if (MAYBE_CLITIC.has(first) && words.length > 1 && !sentence.startsWith('Е,')) {
              push(
                'warning',
                ex.id,
                where,
                `"е" starts a sentence — fine only as "Е, …" (well): "${answer}"`,
              );
            }
            if (mascShortArticle.has(first)) {
              push(
                'warning',
                ex.id,
                where,
                `"${first}" (short article) starts the sentence — a masculine subject usually takes the full article (-ът/-ят): "${answer}"`,
              );
            }
            words.forEach((w, i) => {
              const next = words[i + 1];
              const count = next && plainPluralNeedingCount.get(next);
              if (COUNTING_NUMERALS.has(w) && count) {
                push(
                  'warning',
                  ex.id,
                  where,
                  `"${w} ${next}" — after a numeral, use the counting form "${count}": "${answer}"`,
                );
              }
            });
          }
        }
      }

      // Duplicate exercises (same type, direction and Bulgarian text).
      const allText = exerciseTexts(ex)
        .map((t) => t.text)
        .join('|');
      const key = `${ex.type}|${'direction' in ex ? ex.direction : ''}|${allText}`;
      const other = seenExercises.get(key);
      if (other) push('warning', ex.id, ex.id, `duplicate of ${other}`);
      else seenExercises.set(key, ex.id);
    }
  }
  return issues;
}
