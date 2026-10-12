import { z } from 'zod';

/*
 * Pre-generated audio (SPEC §11). scripts/audio-build.ts writes MP3s to public/audio/ and this
 * manifest to public/audio/manifest.json, keyed by audioKey(text). Both are committed to git.
 */

export const audioEntrySchema = z.object({
  voice: z.string(),
  /** File names inside /audio/. */
  normal: z.string(),
  slow: z.string(),
});

export const audioManifestSchema = z.object({
  version: z.literal(1),
  entries: z.record(z.string(), audioEntrySchema),
});
export type AudioManifest = z.infer<typeof audioManifestSchema>;

/** Manifest key for a Bulgarian string: NFC, stress marks removed, whitespace collapsed. */
export function audioKey(text: string): string {
  return text.normalize('NFC').replaceAll('́', '').replace(/\s+/g, ' ').trim();
}
