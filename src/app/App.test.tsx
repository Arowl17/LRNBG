import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resetAll } from '../db/backup';
import { db } from '../db/db';
import { routes } from './routes';
import { useUserStore } from './user-store';

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, () => {}],
    offlineReady: [false, () => {}],
    updateServiceWorker: () => Promise.resolve(),
  }),
}));

async function renderAt(path: string) {
  await useUserStore.getState().load();
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
}

beforeEach(async () => {
  await resetAll(db);
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ contentVersion: 'test', units: [] }))),
    ),
  );
});

describe('app shell', () => {
  it('renders the empty course path', async () => {
    await renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Your course' })).toBeInTheDocument();
    expect(await screen.findByText(/Course units start in the next phase/)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    for (const label of ['Learn', 'Practice', 'Words', 'Grammar', 'Profile']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('shows the alphabet section with lesson progress', async () => {
    await db.lessonState.put({
      lessonId: 'lesson.alphabet-1',
      completed: true,
      bestAccuracy: 1,
      timesCompleted: 1,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              contentVersion: 'test',
              units: [],
              alphabetLessonIds: ['lesson.alphabet-1', 'lesson.alphabet-2'],
            }),
          ),
        ),
      ),
    );
    await renderAt('/');
    const card = await screen.findByRole('link', { name: /Section 0/ });
    expect(card).toHaveAttribute('href', '/alphabet');
    expect(await within(card).findByText('1 of 2 lessons done')).toBeInTheDocument();
  });

  it('lists units from the manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              contentVersion: 'test',
              units: [
                {
                  id: 'unit.b',
                  order: 2,
                  title: { en: 'Second', tr: 'İkinci' },
                  cefr: 'A1',
                  goals: [],
                  grammarIds: [],
                  lessonIds: [],
                },
                {
                  id: 'unit.a',
                  order: 1,
                  title: { en: 'First', tr: 'Birinci' },
                  cefr: 'A1',
                  goals: [],
                  grammarIds: [],
                  lessonIds: [],
                },
              ],
            }),
          ),
        ),
      ),
    );
    await renderAt('/');
    const list = await screen.findByRole('list', { name: '2 units' });
    expect(
      within(list)
        .getAllByRole('heading')
        .map((h) => h.textContent),
    ).toEqual(['First', 'Second']);
  });

  it('shows an error when the course cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    await renderAt('/');
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });

  it('switches the whole UI to Turkish and persists the choice', async () => {
    await renderAt('/settings');
    await userEvent.selectOptions((await screen.findAllByLabelText('Language'))[0]!, 'tr');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ayarlar' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('tr');
    expect((await db.userState.get('me'))?.sourceLanguage).toBe('tr');
  });

  it('applies the chosen theme to the document', async () => {
    await renderAt('/settings');
    await userEvent.selectOptions(await screen.findByLabelText('Appearance'), 'dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    await userEvent.selectOptions(screen.getByLabelText('Appearance'), 'system');
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('renders the other pages', async () => {
    await renderAt('/profile');
    expect(await screen.findByRole('heading', { level: 1, name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByText(/Learning since \d\d\.\d\d\.\d{4}/)).toBeInTheDocument();
  });

  it('shows a not-found page for unknown URLs', async () => {
    await renderAt('/nope');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
  });
});
