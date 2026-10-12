import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { routes } from './app/routes';
import { useUserStore } from './app/user-store';
import './index.css';

const router = createBrowserRouter(routes);

async function start() {
  // Ask the browser not to evict our IndexedDB data under storage pressure (local-first).
  void navigator.storage?.persist?.();
  await useUserStore.getState().load();

  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('#root element missing from index.html');
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

void start();
