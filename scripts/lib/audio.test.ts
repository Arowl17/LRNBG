// @vitest-environment node
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { audioKey } from '../../src/content/audio.ts';
import {
  audioFileName,
  azureProvider,
  buildSsml,
  missingAudio,
  planAudio,
  synthesizeAll,
  textsNeedingAudio,
  voiceFor,
  type SpeechRequest,
  type TtsProvider,
} from './audio.ts';
import { loadCourse } from './content.ts';

const synthesize = vi.fn((r: SpeechRequest) =>
  Promise.resolve(new TextEncoder().encode(`${r.voice}:${r.rate}:${r.text}`)),
);
const fake: TtsProvider = {
  id: 'fake',
  voices: ['female', 'male'],
  euroPerMillionChars: 10,
  synthesize,
};

describe('audio planning', () => {
  const { course } = loadCourse(join(import.meta.dirname, '../../content'));
  const texts = textsNeedingAudio(course);

  it('collects every Bulgarian string once, keyed without stress marks', () => {
    const keys = texts.map((t) => audioKey(t.text));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain('щъркел');
  });

  it('uses both voices, deterministically', () => {
    const voices = new Set(texts.map((t) => voiceFor(t.text, fake.voices)));
    expect(voices).toEqual(new Set(['female', 'male']));
    expect(voiceFor('кафе́', fake.voices)).toBe(voiceFor('кафе', fake.voices));
  });

  it('names files by text + voice + rate + provider', () => {
    const r = { text: 'кафе', voice: 'female', rate: 1 };
    expect(audioFileName(r, 'fake')).toMatch(/^[0-9a-f]{24}\.mp3$/);
    expect(audioFileName(r, 'fake')).toBe(audioFileName({ ...r }, 'fake'));
    expect(audioFileName({ ...r, rate: 0.75 }, 'fake')).not.toBe(audioFileName(r, 'fake'));
    expect(audioFileName({ ...r, voice: 'male' }, 'fake')).not.toBe(audioFileName(r, 'fake'));
    expect(audioFileName(r, 'other')).not.toBe(audioFileName(r, 'fake'));
    expect(audioFileName({ ...r, override: 'ка-ФЕ' }, 'fake')).not.toBe(audioFileName(r, 'fake'));
  });

  it('plans normal + slow files, skips existing ones, and estimates cost', () => {
    const sample = [{ text: 'кафе́' }, { text: 'чай' }];
    const all = planAudio(sample, fake, new Set());
    expect(all.missing).toHaveLength(4);
    expect(all.characters).toBe(2 * 4 + 2 * 3);
    expect(all.euro).toBeCloseTo((14 / 1e6) * 10);
    const entry = all.manifest.entries['кафе']!;
    const again = planAudio(sample, fake, new Set([entry.normal, entry.slow]));
    expect(again.missing.map((m) => m.request.text)).toEqual(['чай', 'чай']);
    expect(missingAudio(sample, all.manifest)).toEqual([]);
    expect(missingAudio([...sample, { text: 'вода' }], all.manifest)).toEqual(['вода']);
    expect(missingAudio(sample, undefined)).toEqual(['кафе', 'чай']);
  });

  it('synthesizes missing files with limited concurrency', async () => {
    const plan = planAudio(
      [{ text: 'кафе' }, { text: 'чай' }, { text: 'вода', override: 'во-ДА' }],
      fake,
      new Set(),
    );
    const saved = new Map<string, string>();
    const progress: number[] = [];
    await synthesizeAll(
      plan,
      fake,
      (file, data) => {
        saved.set(file, new TextDecoder().decode(data));
        return Promise.resolve();
      },
      {
        concurrency: 2,
        onProgress: (done) => progress.push(done),
      },
    );
    expect(saved.size).toBe(6);
    expect(progress).toEqual([1, 2, 3, 4, 5, 6]);
    expect(synthesize).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'вода', override: 'во-ДА', rate: 0.75 }),
    );
  });
});

describe('Azure SSML and provider', () => {
  it('builds SSML, escaping text and applying the slow rate', () => {
    expect(buildSsml({ text: 'А & Б <x>', voice: 'bg-BG-KalinaNeural', rate: 1 })).toBe(
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="bg-BG"><voice name="bg-BG-KalinaNeural">А &amp; Б &lt;x&gt;</voice></speak>',
    );
    expect(buildSsml({ text: 'кафе', voice: 'v', rate: 0.75 })).toContain(
      '<prosody rate="0.75">кафе</prosody>',
    );
    expect(
      buildSsml({
        text: 'кафе',
        voice: 'v',
        rate: 1,
        override: '<phoneme alphabet="ipa" ph="kaˈfɛ">кафе</phoneme>',
      }),
    ).toContain('<phoneme');
    expect(buildSsml({ text: 'кафе', voice: 'v', rate: 1, override: 'ка-фе' })).toContain(
      '>ка-фе<',
    );
  });

  it('calls the Azure REST endpoint and retries when rate-limited', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(new Response('slow down', { status: 429 }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3])));
    vi.useFakeTimers();
    const provider = azureProvider('KEY', 'westeurope', fetchFn);
    const pending = provider.synthesize({ text: 'кафе', voice: 'bg-BG-KalinaNeural', rate: 1 });
    await vi.runAllTimersAsync();
    expect(await pending).toEqual(new Uint8Array([1, 2, 3]));
    vi.useRealTimers();
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://westeurope.tts.speech.microsoft.com/cognitiveservices/v1');
    expect((init.headers as Record<string, string>)['Ocp-Apim-Subscription-Key']).toBe('KEY');
  });

  it('sends no key header when the key is injected by the environment', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(new Uint8Array([9])));
    const provider = azureProvider('', 'swedencentral', fetchFn);
    await provider.synthesize({ text: 'кафе', voice: 'bg-BG-KalinaNeural', rate: 1 });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://swedencentral.tts.speech.microsoft.com/cognitiveservices/v1');
    expect(init.headers).not.toHaveProperty('Ocp-Apim-Subscription-Key');
  });

  it('reports other errors', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('bad key', { status: 401 }));
    const provider = azureProvider('KEY', 'westeurope', fetchFn);
    await expect(provider.synthesize({ text: 'x', voice: 'v', rate: 1 })).rejects.toThrow(
      'Azure TTS failed (401): bad key',
    );
  });
});
