import { useT } from '../../i18n';
import { EmptyState, Page } from '../../ui/Page';

export function GrammarPage() {
  const t = useT();
  return (
    <Page title={t('grammar.title')}>
      <EmptyState>{t('grammar.empty')}</EmptyState>
    </Page>
  );
}
