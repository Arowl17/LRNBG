import type { Exercise, GrammarPoint, Lexeme, UnitBundle } from '../../content/schema';

/*
 * Turn an authored lesson into the list the session player runs:
 * grammar tip cards first, then the authored exercises in order, with a "new word" card
 * inserted just before the first exercise that trains each newly introduced word.
 */

export interface GrammarTipCard {
  type: 'grammar_tip';
  id: string;
  targets: string[];
  grammar: GrammarPoint;
}

export interface WordIntroCard {
  type: 'word_intro';
  id: string;
  targets: string[];
  lexeme: Lexeme;
}

export type LessonItem = GrammarTipCard | WordIntroCard | Exercise;

export interface ComposeOptions {
  /** Drop exercises the learner can't do right now (e.g. listening without any audio). */
  include?: (exercise: Exercise) => boolean;
}

export function composeLesson(
  bundle: UnitBundle,
  lessonId: string,
  opts: ComposeOptions = {},
): LessonItem[] {
  const lesson = bundle.lessons.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`Unknown lesson: ${lessonId}`);
  const lexemes = new Map(bundle.lexemes.map((l) => [l.id, l]));
  const grammar = new Map(bundle.grammar.map((g) => [g.id, g]));

  const items: LessonItem[] = lesson.grammarIds.flatMap((id) => {
    const g = grammar.get(id);
    return g ? [{ type: 'grammar_tip' as const, id: `tip.${id}`, targets: [id], grammar: g }] : [];
  });

  const pendingIntro = new Set(lesson.newLexemeIds);
  const include = opts.include ?? (() => true);
  for (const exercise of lesson.exercises.filter(include)) {
    for (const target of exercise.targets) {
      const lexeme = lexemes.get(target);
      if (lexeme && pendingIntro.has(target)) {
        items.push({ type: 'word_intro', id: `intro.${target}`, targets: [target], lexeme });
        pendingIntro.delete(target);
      }
    }
    items.push(exercise);
  }
  return items;
}

/** Bulgarian text a listening exercise plays, or undefined for other types. */
export function listeningText(exercise: Exercise): string | undefined {
  return exercise.type === 'listen_tiles' || exercise.type === 'listen_type'
    ? exercise.bg
    : undefined;
}
