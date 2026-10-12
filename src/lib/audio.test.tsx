import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserStore } from '../app/user-store';
import { defaultUserState } from '../db/records';
import { AudioButton } from '../features/exercises/AudioButton';
import { loadAudioManifest, resetAudioManifestCache } from './audio';

const manifest = { version: 1, entries: { кафе: { voice: 'f', normal: 'n.mp3', slow: 's.mp3' } } };
const played: string[] = [];

beforeEach(() => {
  resetAudioManifestCache();
  played.length = 0;
  useUserStore.setState({ user: defaultUserState(), ready: true });
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(manifest)))),
  );
  vi.stubGlobal(
    'Audio',
    class {
      src: string;
      constructor(src: string) {
        this.src = src;
      }
      play() {
        played.push(this.src);
        return Promise.resolve();
      }
      pause() {}
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

describe('audio playback', () => {
  it('loads the manifest; a missing manifest means no files', async () => {
    expect((await loadAudioManifest()).entries['кафе']?.normal).toBe('n.mp3');
    resetAudioManifestCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 404 }))),
    );
    expect((await loadAudioManifest()).entries).toEqual({});
    resetAudioManifestCache();
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    expect((await loadAudioManifest()).entries).toEqual({});
  });

  it('plays the generated file (normal and slow), with Space shortcuts', async () => {
    const user = userEvent.setup();
    render(<AudioButton text="кафе́" autoPlay shortcut />);
    await waitFor(() => expect(played).toEqual(['/audio/n.mp3'])); // autoplay, stress ignored
    await user.click(screen.getByRole('button', { name: 'Play slowly' }));
    expect(played.at(-1)).toBe('/audio/s.mp3');
    (document.activeElement as HTMLElement).blur(); // Space on a focused button just clicks it
    await user.keyboard(' ');
    expect(played.at(-1)).toBe('/audio/n.mp3');
    await user.keyboard('{Control>} {/Control}');
    expect(played.at(-1)).toBe('/audio/s.mp3');
  });

  it('renders nothing without a file or a device voice', async () => {
    const { container } = render(<AudioButton text="чай" />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
