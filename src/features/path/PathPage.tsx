import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useUserStore } from '../../app/user-store';
import { courseManifest } from '../../content/loader';
import type { CourseManifest } from '../../content/schema';
import { db } from '../../db/db';
import { useT } from '../../i18n';
import { EmptyState, Page } from '../../ui/Page';

type LoadState =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; manifest: CourseManifest };

/** Ids of completed lessons among `ids`. */
function useCompleted(ids: readonly string[]): Set<string> {
  const [done, setDone] = useState<Set<string>>(new Set());
  const key = ids.join(',');
  useEffect(() => {
    let cancelled = false;
    void db.lessonState.bulkGet(key ? key.split(',') : []).then((rows) => {
      if (!cancelled) setDone(new Set(rows.filter((r) => r?.completed).map((r) => r!.lessonId)));
    });
    return () => {
      cancelled = true;
    };
  }, [key]);
  return done;
}

/** Section 0 card: the alphabet trainer, with lessons-done progress. */
function AlphabetCard({ lessonIds }: { lessonIds: string[] }) {
  const t = useT();
  const done = useCompleted(lessonIds).size;
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

/** The course map: units in order, each with its lessons; the next lesson to do is highlighted. */
export function PathPage() {
  const t = useT();
  const lang = useUserStore((s) => s.user.sourceLanguage);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    courseManifest()
      .then(
        (manifest) =>
          !cancelled &&
          setState({
            status: 'ready',
            manifest: { ...manifest, units: [...manifest.units].sort((a, b) => a.order - b.order) },
          }),
      )
      .catch(() => !cancelled && setState({ status: 'error' }));
    return () => {
      cancelled = true;
    };
  }, []);

  const lessonIds =
    state.status === 'ready' ? state.manifest.units.flatMap((u) => u.lessonIds) : [];
  const completed = useCompleted(lessonIds);
  const nextLesson = lessonIds.find((id) => !completed.has(id));

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
            className="flex flex-col gap-6"
            aria-label={t('path.unitCount', { count: state.manifest.units.length })}
          >
            {state.manifest.units.map((unit, unitIndex) => (
              <li key={unit.id} className="rounded-card border border-border bg-surface p-4">
                <p className="text-sm font-semibold text-fg-muted">
                  {t('path.unit', { n: unitIndex + 1 })} · {unit.cefr}
                </p>
                <h2 className="mb-1 text-xl font-bold">{unit.title[lang]}</h2>
                {unit.goals.length > 0 && (
                  <p className="mb-3 text-sm text-fg-muted">
                    {unit.goals.map((g) => g[lang]).join(' · ')}
                  </p>
                )}
                <ol className="flex flex-col gap-2">
                  {unit.lessonIds.map((id, i) => {
                    const title = state.manifest.lessons.find((l) => l.id === id)?.title?.[lang];
                    const done = completed.has(id);
                    const next = id === nextLesson;
                    return (
                      <li key={id}>
                        <Link
                          to={`/lesson/${id}`}
                          className={`flex min-h-12 items-center gap-3 rounded-card border-2 px-3 py-2 font-semibold ${
                            next
                              ? 'border-primary bg-primary text-on-primary hover:bg-primary-hover'
                              : 'border-border hover:bg-surface-2'
                          }`}
                        >
                          <span aria-hidden="true" className="w-6 text-center">
                            {done ? '✓' : i + 1}
                          </span>
                          <span className="flex-1">{title ?? t('path.lesson', { n: i + 1 })}</span>
                          {done && <span className="sr-only">{t('alphabet.lesson.done')}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </li>
            ))}
          </ol>
        ))}
    </Page>
  );
}
