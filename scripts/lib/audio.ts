/*
 * Audio build logic (SPEC §11), kept separate from the CLI so it can be tested without network.
 * Every Bulgarian string the app can play gets a normal and a slow MP3; file names are a hash of
 * (text + voice + rate + provider), so re-runs only synthesize new or changed strings.
 */
import { createHash } from 'node:crypto';
import { audioKey, type AudioManifest } from '../../src/content/audio.ts';
import { BLANK } from '../../src/content/schema.ts';
import type { Course } from './content.ts';

export const NORMAL_RATE = 1;
export const SLOW_RATE = 0.75;

export interface TtsProvider {
  id: string;
  /** Voices to alternate between (SPEC §11: one female, one male). */
  voices: readonly string[];
  /** Estimated price in euro per million characters (0 within a free tier). */
  euroPerMillionChars: number;
  synthesize(request: SpeechRequest): Promise<Uint8Array>;
}

export interface SpeechRequest {
  text: string;
  voice: string;
  rate: number;
  /** SSML fragment or respelled text to speak instead of `text` (fixes wrong stress). */
  override?: string;
}

export interface SpeechText {
  /** Text as shown in the app (stress marks allowed). */
  text: string;
  /** Lexeme ttsOverride, if any. */
  override?: string;
}

/** Every Bulgarian string the app may play, de-duplicated by audioKey. */
export function textsNeedingAudio(course: Course): SpeechText[] {
  const out = new Map<string, SpeechText>();
  const add = (text: string, override?: string) => {
    const key = audioKey(text);
    if (key && !out.has(key)) out.set(key, override ? { text, override } : { text });
  };
  const lessonLexemes = new Set(
    course.lessons.flatMap((l) => [...l.newLexemeIds, ...l.exercises.flatMap((e) => e.targets)]),
  );
  const alphabetWords = new Set([
    ...(course.alphabet?.lessons.flatMap((l) => l.readingWordIds) ?? []),
    ...(course.alphabet?.letters.map((l) => l.exampleLexemeId) ?? []),
  ]);
  for (const lex of course.lexemes) {
    if (lessonLexemes.has(lex.id) || alphabetWords.has(lex.id)) add(lex.lemma, lex.ttsOverride);
  }
  for (const g of course.grammar) g.examples.forEach((e) => add(e.bg));
  for (const lesson of course.lessons) {
    for (const ex of lesson.exercises) {
      switch (ex.type) {
        case 'match_pairs':
          ex.pairs.forEach((p) => add(p.bg));
          break;
        case 'fill_blank':
          add(ex.bg.replace(BLANK, ex.options[ex.answerIndex]!));
          break;
        default:
          add(ex.bg);
      }
    }
  }
  return [...out.values()];
}

/** Deterministic voice for a string: alternates between the provider's voices. */
export function voiceFor(text: string, voices: readonly string[]): string {
  const digest = createHash('sha256').update(audioKey(text)).digest();
  return voices[digest[0]! % voices.length]!;
}

export function audioFileName(request: SpeechRequest, providerId: string): string {
  const spoken = request.override ?? audioKey(request.text);
  const hash = createHash('sha256')
    .update(`${spoken}\0${request.voice}\0${request.rate}\0${providerId}`)
    .digest('hex');
  return `${hash.slice(0, 24)}.mp3`;
}

export interface PlannedFile {
  request: SpeechRequest;
  file: string;
}

export interface AudioPlan {
  manifest: AudioManifest;
  /** Files that don't exist yet and must be synthesized. */
  missing: PlannedFile[];
  characters: number;
  euro: number;
}

/** Work out which files are needed, which already exist, and what the run will cost. */
export function planAudio(
  texts: SpeechText[],
  provider: TtsProvider,
  existing: ReadonlySet<string>,
): AudioPlan {
  const manifest: AudioManifest = { version: 1, entries: {} };
  const missing: PlannedFile[] = [];
  for (const { text, override } of texts) {
    const voice = voiceFor(text, provider.voices);
    const files = [NORMAL_RATE, SLOW_RATE].map((rate) => {
      const request: SpeechRequest = {
        text: audioKey(text),
        voice,
        rate,
        ...(override ? { override } : {}),
      };
      const file = audioFileName(request, provider.id);
      if (!existing.has(file)) missing.push({ request, file });
      return file;
    });
    manifest.entries[audioKey(text)] = { voice, normal: files[0]!, slow: files[1]! };
  }
  const characters = missing.reduce((n, m) => n + (m.request.override ?? m.request.text).length, 0);
  return {
    manifest,
    missing,
    characters,
    euro: (characters / 1_000_000) * provider.euroPerMillionChars,
  };
}

const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** SSML for Azure: a respelling is escaped; an override starting with "<" is used as SSML as-is. */
export function buildSsml(request: SpeechRequest, lang = 'bg-BG'): string {
  const body = request.override?.trim().startsWith('<')
    ? request.override
    : xml(request.override ?? request.text);
  const rate = request.rate === 1 ? body : `<prosody rate="${request.rate}">${body}</prosody>`;
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${xml(request.voice)}">${rate}</voice></speak>`;
}

/** Azure AI Speech via its REST API (no SDK). Voices verified to exist as of 10.2026. */
export function azureProvider(
  key: string,
  region: string,
  fetchFn: typeof fetch = fetch,
): TtsProvider {
  return {
    id: 'azure',
    voices: ['bg-BG-KalinaNeural', 'bg-BG-BorislavNeural'],
    // Free tier F0 includes 0.5M characters/month; above that, pay-as-you-go (~€15/M, check pricing).
    euroPerMillionChars: 15,
    async synthesize(request) {
      for (let attempt = 0; ; attempt++) {
        const response = await fetchFn(
          `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
          {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': key,
              'Content-Type': 'application/ssml+xml',
              'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
              'User-Agent': 'shtarkel-audio-build',
            },
            body: buildSsml(request),
          },
        );
        if (response.ok) return new Uint8Array(await response.arrayBuffer());
        if (response.status === 429 && attempt < 5) {
          await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
          continue;
        }
        throw new Error(`Azure TTS failed (${response.status}): ${await response.text()}`);
      }
    },
  };
}

/** Synthesize the missing files with limited concurrency; `save` writes each file. */
export async function synthesizeAll(
  plan: AudioPlan,
  provider: TtsProvider,
  save: (file: string, data: Uint8Array) => Promise<void>,
  {
    concurrency = 4,
    onProgress,
  }: { concurrency?: number; onProgress?: (done: number, total: number) => void } = {},
): Promise<void> {
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < plan.missing.length) {
      const item = plan.missing[next++]!;
      await save(item.file, await provider.synthesize(item.request));
      onProgress?.(++done, plan.missing.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, plan.missing.length) }, worker));
}

/** Strings that have no audio entry (for `content:validate --require-audio`). */
export function missingAudio(texts: SpeechText[], manifest: AudioManifest | undefined): string[] {
  return texts.map((t) => audioKey(t.text)).filter((k) => !manifest?.entries[k]);
}
