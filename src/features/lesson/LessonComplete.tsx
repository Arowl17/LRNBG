import { Link } from 'react-router';
import { useT } from '../../i18n';
import { Page } from '../../ui/Page';
import type { SessionSummary } from './ExerciseSession';

const linkButton =
  'inline-flex min-h-11 w-full items-center justify-center rounded-card px-4 font-semibold';

interface Props {
  summary: SessionSummary;
  /** Bulgarian items learned (letters or words), shown as a list. */
  learned: string[];
  learnedLabel: string;
  backTo: string;
  backLabel: string;
  onAgain: () => void;
}

/** "Lesson complete" screen: accuracy, what was learned, and where to go next. */
export function LessonComplete({
  summary,
  learned,
  learnedLabel,
  backTo,
  backLabel,
  onAgain,
}: Props) {
  const t = useT();
  return (
    <Page title={t('complete.title')}>
      <dl className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-card border border-border bg-surface p-4">
          <dt className="text-sm text-fg-muted">{t('complete.accuracy')}</dt>
          <dd className="text-3xl font-bold">{Math.round(summary.accuracy * 100)}%</dd>
        </div>
        {learned.length > 0 && (
          <div className="rounded-card border border-border bg-surface p-4">
            <dt className="text-sm text-fg-muted">{learnedLabel}</dt>
            <dd lang="bg" className="text-xl font-bold">
              {learned.join(', ')}
            </dd>
          </div>
        )}
      </dl>
      <div className="flex flex-col gap-3">
        <Link
          to={backTo}
          className={`${linkButton} bg-primary text-on-primary hover:bg-primary-hover`}
        >
          {backLabel}
        </Link>
        <button
          type="button"
          onClick={onAgain}
          className={`${linkButton} border border-border bg-surface hover:bg-surface-2`}
        >
          {t('complete.again')}
        </button>
      </div>
    </Page>
  );
}
