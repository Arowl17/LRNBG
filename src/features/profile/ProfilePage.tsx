import { useUserStore } from '../../app/user-store';
import { useT } from '../../i18n';
import { formatDate } from '../../lib/format';
import { EmptyState, Page } from '../../ui/Page';

export function ProfilePage() {
  const t = useT();
  const user = useUserStore((s) => s.user);
  return (
    <Page title={t('profile.title')}>
      <dl className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-card border border-border bg-surface p-4">
          <dt className="text-sm text-fg-muted">{t('profile.xp')}</dt>
          <dd className="text-2xl font-bold">{user.xp}</dd>
        </div>
        <div className="rounded-card border border-border bg-surface p-4">
          <dt className="text-sm text-fg-muted">{t('profile.streak')}</dt>
          <dd className="text-2xl font-bold">{user.streak.current}</dd>
        </div>
      </dl>
      <p className="mb-4 text-sm text-fg-muted">
        {t('profile.since', { date: formatDate(user.createdAt) })}
      </p>
      <EmptyState>{t('profile.empty')}</EmptyState>
    </Page>
  );
}
