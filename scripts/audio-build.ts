/*
 * pnpm audio:build — generate MP3s for every Bulgarian string (SPEC §11).
 *   --dry-run   only print what would be generated and what it costs
 *   --yes       don't ask for confirmation
 *   --prune     delete MP3s no longer referenced (asks first unless --yes)
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION (in .env or the environment).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { azureProvider, planAudio, synthesizeAll, textsNeedingAudio } from './lib/audio.ts';
import { formatIssue, loadCourse } from './lib/content.ts';

/** Ask for confirmation when a run would send more characters than this. */
const CONFIRM_ABOVE_CHARS = 20_000;

const repo = join(import.meta.dirname, '..');
const args = new Set(process.argv.slice(2));
const audioDir = join(repo, 'public', 'audio');

// Minimal .env reader (KEY=VALUE lines) — avoids a dependency. Real environment variables win.
const envFile = join(repo, '.env');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]!] === undefined)
      process.env[m[1]!] = m[2]!.replace(/^["']|["']$/g, '');
  }
}

async function confirm(question: string): Promise<boolean> {
  if (args.has('--yes')) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(`${question} [y/N] `);
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

const { course, issues } = loadCourse(join(repo, 'content'));
const errors = issues.filter((i) => i.level === 'error');
if (errors.length) {
  errors.forEach((i) => console.error(formatIssue(i)));
  console.error('Fix content errors first (pnpm content:validate).');
  process.exit(1);
}

const key = process.env.AZURE_SPEECH_KEY ?? '';
const region = process.env.AZURE_SPEECH_REGION ?? '';
const provider = azureProvider(key, region);
mkdirSync(audioDir, { recursive: true });
const existing = new Set(readdirSync(audioDir).filter((f) => f.endsWith('.mp3')));
const texts = textsNeedingAudio(course);
const plan = planAudio(texts, provider, existing);

console.log(
  `audio:build — ${texts.length} strings, ${Object.keys(plan.manifest.entries).length * 2} files needed, ${existing.size} already exist.`,
);
console.log(
  `To generate: ${plan.missing.length} files, ${plan.characters.toLocaleString('de-DE')} characters.`,
);
console.log(
  `Estimated cost: €${plan.euro.toFixed(2)} (€0 within Azure's free 500,000 characters/month).`,
);

if (args.has('--dry-run')) process.exit(0);
if (plan.missing.length > 0) {
  if (!key || !region) {
    console.error(
      '\nMissing AZURE_SPEECH_KEY / AZURE_SPEECH_REGION. Copy .env.example to .env and fill them in.',
    );
    process.exit(1);
  }
  if (plan.characters > CONFIRM_ABOVE_CHARS && !(await confirm('Continue?'))) process.exit(1);
  await synthesizeAll(plan, provider, (file, data) => writeFile(join(audioDir, file), data), {
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total}`),
  });
  process.stdout.write('\n');
}

writeFileSync(join(audioDir, 'manifest.json'), `${JSON.stringify(plan.manifest, null, 1)}\n`);
console.log('Wrote public/audio/manifest.json');

const used = new Set(Object.values(plan.manifest.entries).flatMap((e) => [e.normal, e.slow]));
const stale = [...existing].filter((f) => !used.has(f));
if (stale.length) {
  console.log(`${stale.length} MP3s are no longer used.`);
  if (args.has('--prune') && (await confirm(`Delete ${stale.length} unused files?`))) {
    stale.forEach((f) => rmSync(join(audioDir, f)));
    console.log('Deleted.');
  }
}
