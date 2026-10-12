import type { RouteObject } from 'react-router';
import { PathPage } from '../features/path/PathPage';
import { Layout } from './Layout';

/*
 * The course path is the landing page, so it ships in the initial bundle.
 * Every other page is loaded on first visit (keeps initial JS under the SPEC §17 budget);
 * the service worker precaches all chunks, so this still works offline.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: PathPage },
      {
        path: 'practice',
        lazy: async () => ({
          Component: (await import('../features/practice/PracticePage')).PracticePage,
        }),
      },
      {
        path: 'words',
        lazy: async () => ({ Component: (await import('../features/words/WordsPage')).WordsPage }),
      },
      {
        path: 'grammar',
        lazy: async () => ({
          Component: (await import('../features/grammar/GrammarPage')).GrammarPage,
        }),
      },
      {
        path: 'profile',
        lazy: async () => ({
          Component: (await import('../features/profile/ProfilePage')).ProfilePage,
        }),
      },
      {
        path: 'settings',
        lazy: async () => ({
          Component: (await import('../features/profile/SettingsPage')).SettingsPage,
        }),
      },
      {
        path: 'alphabet',
        lazy: async () => ({
          Component: (await import('../features/alphabet/AlphabetPage')).AlphabetPage,
        }),
      },
      {
        path: 'alphabet/:lessonId',
        lazy: async () => ({
          Component: (await import('../features/alphabet/AlphabetSessionPage')).AlphabetSessionPage,
        }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('./NotFoundPage')).NotFoundPage }),
      },
    ],
  },
];
