import { useEffect, useState } from 'react';
import { useUserStore } from '../../app/user-store';
import { courseManifest, loadUnit } from '../../content/loader';
import type { UnitBundle } from '../../content/schema';
import { useT } from '../../i18n';
import { EmptyState, Page } from '../../ui/Page';
import { Markdown } from '../../ui/Markdown';
import { AudioButton } from '../exercises/AudioButton';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ready'; units: UnitBundle[] };

/** Grammar tips library: every tip, grouped by unit, with examples and audio. */
export function GrammarPage() {
  const t = useT();
  const lang = useUserStore((s) => s.user.sourceLanguage);
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    courseManifest()
      .then((m) =>
        Promise.all([...m.units].sort((a, b) => a.order - b.order).map((u) => loadUnit(u.id))),
      )
      .then((units) => !cancelled && setState({ status: 'ready', units }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, []);

  const withTips = state.status === 'ready' ? state.units.filter((u) => u.grammar.length > 0) : [];
  return (
    <Page title={t('grammar.title')}>
      {state.status === 'loading' && <p className="text-fg-muted">{t('common.loading')}</p>}
      {state.status === 'error' && <EmptyState>{t('path.loadError')}</EmptyState>}
      {state.status === 'ready' && withTips.length === 0 && (
        <EmptyState>{t('grammar.empty')}</EmptyState>
      )}
      {withTips.map(({ unit, grammar }) => (
        <section key={unit.id} className="mb-8">
          <h2 className="mb-3 text-xl font-bold">{unit.title[lang]}</h2>
          <div className="flex flex-col gap-3">
            {grammar.map((g) => (
              <details key={g.id} className="rounded-card border border-border bg-surface p-4">
                <summary className="cursor-pointer text-lg font-semibold">{g.title[lang]}</summary>
                <div className="mt-3 flex flex-col gap-3">
                  <Markdown text={g.explanation[lang]} />
                  <ul className="flex flex-col gap-2">
                    {g.examples.map((ex) => (
                      <li key={ex.bg} className="flex items-center gap-3">
                        <AudioButton text={ex.bg} />
                        <span>
                          <span lang="bg" className="block font-semibold">
                            {ex.bg}
                          </span>
                          <span className="text-fg-muted">{ex[lang]}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}
    </Page>
  );
}
