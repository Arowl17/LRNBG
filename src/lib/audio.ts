import { useCallback, useEffect, useState } from 'react';
import { audioKey, audioManifestSchema, type AudioManifest } from '../content/audio';
import { speakBulgarian, useBulgarianVoice } from './speech';

let manifestPromise: Promise<AudioManifest> | undefined;

/** Load /audio/manifest.json once. Missing or invalid → empty (falls back to the device voice). */
export function loadAudioManifest(fetchFn: typeof fetch = fetch): Promise<AudioManifest> {
  manifestPromise ??= fetchFn('/audio/manifest.json')
    .then(async (r) =>
      r.ok ? audioManifestSchema.parse(await r.json()) : { version: 1 as const, entries: {} },
    )
    .catch(() => ({ version: 1 as const, entries: {} }));
  return manifestPromise;
}

/** Test helper: forget the cached manifest. */
export function resetAudioManifestCache() {
  manifestPromise = undefined;
}

let current: HTMLAudioElement | undefined;

/**
 * Playback for Bulgarian text: the pre-generated file if there is one, else the device's
 * Bulgarian voice, else nothing (canPlay → false, so the UI hides play buttons).
 */
export function useAudio() {
  const [manifest, setManifest] = useState<AudioManifest | undefined>();
  const deviceVoice = useBulgarianVoice();

  useEffect(() => {
    let cancelled = false;
    void loadAudioManifest().then((m) => !cancelled && setManifest(m));
    return () => {
      cancelled = true;
    };
  }, []);

  const canPlay = useCallback(
    (text: string) => deviceVoice || !!manifest?.entries[audioKey(text)],
    [deviceVoice, manifest],
  );

  const play = useCallback(
    (text: string, slow = false) => {
      const entry = manifest?.entries[audioKey(text)];
      if (entry) {
        current?.pause();
        current = new Audio(`/audio/${slow ? entry.slow : entry.normal}`);
        void current.play().catch(() => speakBulgarian(text, slow ? 0.75 : 1));
        return;
      }
      speakBulgarian(text, slow ? 0.75 : 1);
    },
    [manifest],
  );

  return { canPlay, play, ready: manifest !== undefined };
}
