import type { Exercise } from '../../src/content/schema.ts';

/**
 * Every piece of Bulgarian text inside an exercise.
 * kind: "sentence" = a full sentence or phrase (prompt or accepted answer; may use {a|b} syntax),
 * "fragment" = a single tile, option or pair item (not a sentence on its own).
 */
export interface ExerciseText {
  path: string;
  text: string;
  kind: 'sentence' | 'fragment';
}

const list = (
  prefix: string,
  items: readonly string[] | undefined,
  kind: ExerciseText['kind'],
): ExerciseText[] => (items ?? []).map((text, i) => ({ path: `${prefix}.${i}`, text, kind }));

export function exerciseTexts(ex: Exercise): ExerciseText[] {
  switch (ex.type) {
    case 'select_meaning':
      return [{ path: 'bg', text: ex.bg, kind: 'sentence' }];
    case 'tiles_translate':
      return [
        { path: 'bg', text: ex.bg, kind: 'sentence' },
        ...list('accepted.bg', ex.accepted.bg, 'sentence'),
        ...list('distractors.bg', ex.distractors?.bg, 'fragment'),
      ];
    case 'type_translate':
      return [
        { path: 'bg', text: ex.bg, kind: 'sentence' },
        ...list('accepted.bg', ex.accepted.bg, 'sentence'),
      ];
    case 'listen_tiles':
      return [
        { path: 'bg', text: ex.bg, kind: 'sentence' },
        ...list('accepted', ex.accepted, 'sentence'),
        ...list('distractors', ex.distractors, 'fragment'),
      ];
    case 'listen_type':
      return [
        { path: 'bg', text: ex.bg, kind: 'sentence' },
        ...list('accepted', ex.accepted, 'sentence'),
      ];
    case 'match_pairs':
      return ex.pairs.map((p, i) => ({ path: `pairs.${i}.bg`, text: p.bg, kind: 'fragment' }));
    case 'fill_blank':
      return [
        { path: 'bg', text: ex.bg, kind: 'sentence' },
        ...list('options', ex.options, 'fragment'),
      ];
  }
}
