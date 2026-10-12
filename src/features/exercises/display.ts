import { stripStress } from '../../content/stress';
import type { Settings } from '../../db/records';

/** Apply the "show stress marks" setting (SPEC §15) to Bulgarian text. */
export function showStress(text: string, mode: Settings['stressDisplay'], isNew: boolean): string {
  if (mode === 'always' || (mode === 'new' && isNew)) return text;
  return stripStress(text);
}
