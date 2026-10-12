// Runs before every unit test file.
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto'; // in-memory IndexedDB so Dexie works in tests
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
