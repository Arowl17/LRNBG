/*
 * pnpm content:validate — check all course content (SPEC §12). Exits with code 1 on any error.
 * Phase 0 checks: YAML/schema structure, duplicate ids, references, forbidden letters,
 * Latin look-alikes, known Russianisms. More linguistic checks arrive in Phase 2.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { audioManifestSchema } from '../src/content/audio.ts';
import { missingAudio, textsNeedingAudio } from './lib/audio.ts';
import { formatIssue, loadCourse, runAllChecks, russianismsSchema } from './lib/content.ts';

const root = join(import.meta.dirname, '..', 'content');
const russianisms = russianismsSchema.parse(
  parse(readFileSync(join(root, 'validators', 'russianisms.yaml'), 'utf8')),
);

const { course, issues: loadIssues } = loadCourse(root);
const issues = [...loadIssues, ...runAllChecks(course, russianisms)];

// --require-audio: every Bulgarian string must have audio (run after `pnpm audio:build`).
if (process.argv.includes('--require-audio')) {
  const manifestPath = join(import.meta.dirname, '..', 'public', 'audio', 'manifest.json');
  const manifest = existsSync(manifestPath)
    ? audioManifestSchema.parse(JSON.parse(readFileSync(manifestPath, 'utf8')))
    : undefined;
  for (const text of missingAudio(textsNeedingAudio(course), manifest)) {
    issues.push({
      level: 'error',
      file: 'public/audio/manifest.json',
      where: '',
      message: `no audio for "${text}"`,
    });
  }
}

for (const issue of issues) console.log(formatIssue(issue));
const errors = issues.filter((i) => i.level === 'error').length;
const warnings = issues.length - errors;
console.log(
  `\ncontent:validate — ${course.lexemes.length} lexemes, ${course.grammar.length} grammar points, ` +
    `${course.units.length} units, ${course.lessons.length} lessons: ${errors} errors, ${warnings} warnings.`,
);
process.exitCode = errors > 0 ? 1 : 0;
