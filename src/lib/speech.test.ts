import { afterEach, describe, expect, it, vi } from 'vitest';
import { findBulgarianVoice, speakBulgarian } from './speech';

const voice = (lang: string) => ({ lang, name: lang }) as SpeechSynthesisVoice;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('speech fallback', () => {
  it('finds a Bulgarian voice by language tag', () => {
    expect(findBulgarianVoice([voice('en-US'), voice('bg-BG')])?.lang).toBe('bg-BG');
    expect(findBulgarianVoice([voice('bg_BG')])?.lang).toBe('bg_BG');
    expect(findBulgarianVoice([voice('en-US')])).toBeUndefined();
  });

  it('returns false when the browser has no speech synthesis', () => {
    expect(speakBulgarian('кафе')).toBe(false);
  });

  it('speaks with the Bulgarian voice when there is one', () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { getVoices: () => [voice('bg-BG')], speak, cancel: vi.fn() });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        voice: unknown;
        lang = '';
        rate = 1;
        text: string;
        constructor(text: string) {
          this.text = text;
        }
      },
    );
    expect(speakBulgarian('кафе', 0.75)).toBe(true);
    expect(speak).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'кафе', rate: 0.75, lang: 'bg-BG' }),
    );
  });

  it('returns false when there is no Bulgarian voice', () => {
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [voice('en-US')],
      speak: vi.fn(),
      cancel: vi.fn(),
    });
    expect(speakBulgarian('кафе')).toBe(false);
  });
});
