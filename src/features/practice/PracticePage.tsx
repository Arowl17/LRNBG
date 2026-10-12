import { useT } from '../../i18n';
import { EmptyState, Page } from '../../ui/Page';

export function PracticePage() {
  const t = useT();
  return (
    <Page title={t('practice.title')}>
      <EmptyState>{t('practice.empty')}</EmptyState>
    </Page>
  );
}
