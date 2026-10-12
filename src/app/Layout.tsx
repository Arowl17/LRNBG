import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { useT, type MessageKey } from '../i18n';
import { Icon, type IconName } from '../ui/Icon';
import { StorkMark } from '../ui/StorkMark';
import { UpdatePrompt } from './UpdatePrompt';
import { useUserStore } from './user-store';

const NAV: { to: string; label: MessageKey; icon: IconName }[] = [
  { to: '/', label: 'nav.path', icon: 'path' },
  { to: '/practice', label: 'nav.practice', icon: 'practice' },
  { to: '/words', label: 'nav.words', icon: 'words' },
  { to: '/grammar', label: 'nav.grammar', icon: 'grammar' },
  { to: '/profile', label: 'nav.profile', icon: 'profile' },
];

/** Keep <html lang> and the colour theme in sync with the learner's settings. */
function useDocumentSettings() {
  const lang = useUserStore((s) => s.user.sourceLanguage);
  const theme = useUserStore((s) => s.user.settings.theme);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
  }, [theme]);
}

export function Layout() {
  const t = useT();
  useDocumentSettings();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-card px-2 py-1 text-xs font-semibold md:flex-none md:flex-row md:justify-start md:gap-3 md:px-3 md:text-base ${
      isActive ? 'text-primary md:bg-surface-2' : 'text-fg-muted hover:text-fg'
    }`;

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <nav
        aria-label={t('nav.main')}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:sticky md:top-0 md:h-dvh md:w-60 md:border-t-0 md:border-r md:p-4"
      >
        <Link to="/" className="mb-6 hidden items-center gap-2 px-3 text-xl font-bold md:flex">
          <StorkMark />
          <span lang="bg">Щъркел</span>
        </Link>
        <ul className="flex md:flex-col md:gap-1">
          {NAV.map((item) => (
            <li key={item.to} className="flex flex-1 md:flex-none">
              <NavLink to={item.to} end={item.to === '/'} className={linkClass}>
                <Icon name={item.icon} />
                <span>{t(item.label)}</span>
              </NavLink>
            </li>
          ))}
          <li className="hidden md:block">
            <NavLink to="/settings" className={linkClass}>
              <Icon name="settings" />
              <span>{t('nav.settings')}</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="flex flex-1 flex-col pb-20 md:pb-0">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-2 md:hidden">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <StorkMark className="size-7" />
            <span lang="bg">Щъркел</span>
          </Link>
          <Link
            to="/settings"
            aria-label={t('nav.settings')}
            className="flex size-11 items-center justify-center rounded-card text-fg-muted hover:text-fg"
          >
            <Icon name="settings" />
          </Link>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <UpdatePrompt />
    </div>
  );
}
