import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { loadCourseManifest } from '../../content/loader';
import { db } from '../../db/db';
import type { CourseManifest } from '../../content/schema';
import { useT } from '../../i18n';
import { useUserStore } from '../../app/user-store';
import { EmptyState, Page } from '../../ui/Page';

type LoadState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; manifest: CourseManifest };

/** Section 0 card: the alphabet trainer, with lessons-done progress. */
function AlphabetCard({ lessonIds }: { lessonIds: string[] }) {
  const t = useT();
  const [done, setDone] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void db.lessonState.bulkGet(lessonIds).then((rows) => {
      if (!cancelled) setDone(rows.filter((r) => r?.completed).length);
    });
    return () => {
      cancelled = true;
    };
  }, [lessonIds]);
  return (
    <Link
      to="/alphabet"
      className="mb-6 flex items-center gap-4 rounded-card border-2 border-primary bg-surface p-4 hover:bg-surface-2"
    >
      <span lang="bg" aria-hidden="true" className="text-4xl font-bold text-primary">
        Аа
      </span>
      <span className="flex-1">
        <span className="block text-lg font-bold">{t('path.section0.title')}</span>
        <span className="block text-fg-muted">{t('path.section0.body')}</span>
        <span className="block text-sm font-semibold text-primary">
          {t('path.section0.progress', { done, total: lessonIds.length })}
        </span>
      </span>
    </Link>
  );
}

/** The course map: a vertical path of units (lessons appear in Phase 2). */
export function PathPage() {
  const t = useT();
  const lang = useUserStore((s) => s.user.sourceLanguage);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadCourseManifest()
      .then((manifest) => !cancelled && setState({ status: 'ready', manifest }))
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Page title={t('path.title')}>
      {state.status === 'loading' && <p className="text-fg-muted">{t('common.loading')}</p>}
      {state.status === 'error' && <EmptyState>{t('path.loadError')}</EmptyState>}
      {state.status === 'ready' && state.manifest.alphabetLessonIds.length > 0 && (
        <AlphabetCard lessonIds={state.manifest.alphabetLessonIds} />
      )}
      {state.status === 'ready' &&
        (state.manifest.units.length === 0 ? (
          <EmptyState>{t('path.empty')}</EmptyState>
        ) : (
          <ol
            className="flex flex-col items-center gap-6"
            aria-label={t('path.unitCount', { count: state.manifest.units.length })}
          >
            {[...state.manifest.units]
              .sort((a, b) => a.order - b.order)
              .map((unit) => (
                <li
                  key={unit.id}
                  className="w-full max-w-sm rounded-card border border-border bg-surface p-4 text-center"
                >
                  <span className="text-sm font-semibold text-fg-muted">{unit.cefr}</span>
                  <h2 className="text-lg font-bold">{unit.title[lang]}</h2>
                </li>
              ))}
          </ol>
        ))}
    </Page>
  );
}
