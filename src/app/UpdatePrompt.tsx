import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n';
import { Button } from '../ui/Button';

/** Shows "ready offline" once, and "new version available" when the service worker updates. */
export function UpdatePrompt() {
  const t = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-24 z-20 mx-auto flex max-w-md items-center gap-3 rounded-card border border-border bg-surface p-3 shadow-lg md:bottom-6"
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
