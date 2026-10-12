import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n';
import { Button } from '../ui/Button';

/** How long the "ready to work offline" notice stays up. */
const OFFLINE_NOTICE_MS = 5000;

/**
 * Shows "ready offline" briefly, and "new version available" when the service worker updates.
 * Sits at the top on phones so it never covers the lesson's Check/Continue button.
 */
export function UpdatePrompt() {
  const t = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), OFFLINE_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-20 mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-lg md:top-auto md:bottom-6"
    >
      <p className="flex-1">{needRefresh ? t('update.available') : t('offline.ready')}</p>
      {needRefresh && (
        <Button onClick={() => void updateServiceWorker(true)}>{t('update.reload')}</Button>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setNeedRefresh(false);
          setOfflineReady(false);
        }}
      >
        {needRefresh ? t('update.dismiss') : t('common.close')}
      </Button>
    </div>
  );
}
