import type { Verdict } from '../answer-check/types';

/**
 * Map an answer verdict to an FSRS rating (ts-fsrs Rating: 1 Again, 2 Hard, 3 Good, 4 Easy).
 * SPEC §10: incorrect → Again; typo (or hint) → Hard; correct → Good. "Easy" (fast production
 * answers) and configurable thresholds arrive with the SRS in Phase 3.
 */
export function ratingFor(verdict: Verdict): 1 | 2 | 3 | 4 {
  switch (verdict) {
    case 'incorrect':
      return 1;
    case 'correct_with_typo':
      return 2;
    case 'correct':
    case 'correct_with_note':
      return 3;
  }
}
