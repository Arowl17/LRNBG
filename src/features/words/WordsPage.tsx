import { useT } from '../../i18n';
import { EmptyState, Page } from '../../ui/Page';

export function WordsPage() {
  const t = useT();
  return (
    <Page title={t('words.title')}>
      <EmptyState>{t('words.empty')}</EmptyState>
    </Page>
  );
}
