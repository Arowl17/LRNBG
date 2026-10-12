import { Link } from 'react-router';
import { useT } from '../i18n';
import { Page } from '../ui/Page';

export function NotFoundPage() {
  const t = useT();
  return (
    <Page title={t('notFound.title')}>
      <Link to="/" className="font-semibold text-primary underline">
        {t('notFound.back')}
      </Link>
    </Page>
  );
}
