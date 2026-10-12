import type { Exercise } from '../../content/schema';
import type { SourceLanguage } from '../../db/records';

export type Translation = Extract<Exercise, { type: 'tiles_translate' | 'type_translate' }>;

/** Accepted answers and answer language for a translation exercise, given the learner's language. */
export function target(e: Translation, lang: SourceLanguage) {
  if (e.direction === 'src_to_bg') return { language: 'bg' as const, accepted: e.accepted.bg! };
  return { language: lang, accepted: e.accepted[lang]! };
}
