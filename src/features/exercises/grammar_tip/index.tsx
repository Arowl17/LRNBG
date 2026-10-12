import type { GrammarTipCard } from '../../../engine/session/lesson';
import { useT } from '../../../i18n';
import { Markdown } from '../../../ui/Markdown';
import { AudioButton } from '../AudioButton';
import type { ExerciseDefinition } from '../types';

/** Grammar "Tips" card shown before the lesson's exercises. Not graded. */
export const grammarTip: ExerciseDefinition<GrammarTipCard, null> = {
  type: 'grammar_tip',
  graded: false,
  initialAnswer: () => null,
  isReady: () => true,
  check: (e) => ({
    verdict: 'correct',
    graded: false,
    canonical: e.grammar.id,
    closest: e.grammar.id,
    diff: [],
    notes: [],
  }),
  inputMode: () => 'choice',
  View: function GrammarTipView({ exercise, ctx }) {
    const t = useT();
    const g = exercise.grammar;
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-accent">{t('ex.tip')}</p>
        <h2 className="text-2xl font-bold">{g.title[ctx.lang]}</h2>
        <Markdown text={g.explanation[ctx.lang]} />
        <ul className="flex flex-col gap-2">
          {g.examples.map((ex) => (
            <li
              key={ex.bg}
              className="flex items-center gap-3 rounded-card border border-border bg-surface p-3"
            >
              <AudioButton text={ex.bg} />
              <span>
                <span lang="bg" className="block font-semibold">
                  {ex.bg}
                </span>
                <span className="text-fg-muted">{ex[ctx.lang]}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  },
};
