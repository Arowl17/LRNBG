/*
 * pnpm content:build — compile content/ YAML into JSON for the app (public/content/).
 * Refuses to build if the content has schema errors. Run content:validate for the full checks.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AlphabetBundle, CourseManifest } from '../src/content/schema.ts';
import { formatIssue, loadCourse } from './lib/content.ts';

const repo = join(import.meta.dirname, '..');
const { course, issues } = loadCourse(join(repo, 'content'));

const errors = issues.filter((i) => i.level === 'error');
if (errors.length > 0) {
  for (const issue of errors) console.error(formatIssue(issue));
  console.error(`\ncontent:build failed: ${errors.length} errors.`);
  process.exit(1);
}

const manifest: CourseManifest = {
  contentVersion: course.contentVersion,
  units: [...course.units].sort((a, b) => a.order - b.order),
  alphabetLessonIds: [...(course.alphabet?.lessons ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((l) => l.id),
};

const outDir = join(repo, 'public', 'content');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'course.json'), JSON.stringify(manifest));
// Per-unit bundles (lessons, lexemes, grammar) are written here from Phase 2 on.

if (course.alphabet) {
  const wordIds = new Set([
    ...course.alphabet.lessons.flatMap((l) => l.readingWordIds),
    ...course.alphabet.letters.map((l) => l.exampleLexemeId),
  ]);
  const bundle: AlphabetBundle = {
    contentVersion: course.contentVersion,
    letters: course.alphabet.letters,
    lessons: [...course.alphabet.lessons].sort((a, b) => a.order - b.order),
    words: course.lexemes.filter((l) => wordIds.has(l.id)),
  };
  writeFileSync(join(outDir, 'alphabet.json'), JSON.stringify(bundle));
  console.log(
    `content:build — alphabet: ${bundle.letters.length} letters, ${bundle.lessons.length} lessons, ${bundle.words.length} words`,
  );
}

console.log(
  `content:build — ${manifest.units.length} units → public/content/course.json (version ${manifest.contentVersion})`,
);
