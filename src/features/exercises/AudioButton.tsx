import { useEffect, useRef } from 'react';
import { useT } from '../../i18n';
import { useAudio } from '../../lib/audio';

interface Props {
  text: string;
  /** Play once when shown (listening exercises). */
  autoPlay?: boolean;
  /** Space = replay, Ctrl/⌘+Space = slow (SPEC §15). Only one button per screen should set this. */
  shortcut?: boolean;
  size?: 'normal' | 'large';
}

/** Play Bulgarian audio; renders nothing when no audio source exists. */
export function AudioButton({ text, autoPlay, shortcut, size = 'normal' }: Props) {
  const t = useT();
  const { canPlay, play, ready } = useAudio();
  const played = useRef(false);
  const available = canPlay(text);

  useEffect(() => {
    if (autoPlay && ready && available && !played.current) {
      played.current = true;
      play(text);
    }
  }, [autoPlay, available, play, ready, text]);

  useEffect(() => {
    if (!shortcut || !available) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault();
      play(text, e.ctrlKey || e.metaKey);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [available, play, shortcut, text]);

  if (!available) return null;
  const big = size === 'large';
  return (
    <span className="inline-flex gap-2">
      <button
        type="button"
        onClick={() => play(text)}
        aria-label={t('audio.play')}
        className={`inline-flex items-center justify-center rounded-card bg-primary text-on-primary hover:bg-primary-hover ${big ? 'size-20 text-4xl' : 'size-11 text-xl'}`}
      >
        <span aria-hidden="true">🔊</span>
      </button>
      <button
        type="button"
        onClick={() => play(text, true)}
        aria-label={t('audio.slow')}
        className={`inline-flex items-center justify-center rounded-card border border-border bg-surface hover:bg-surface-2 ${big ? 'h-14 px-3' : 'h-11 px-2'}`}
      >
        <span aria-hidden="true" className="text-sm font-bold">
          0.75×
        </span>
      </button>
    </span>
  );
}
