/*
 * pnpm content:validate — check all course content (SPEC §12). Exits with code 1 on any error.
 * Phase 0 checks: YAML/schema structure, duplicate ids, references, forbidden letters,
 * Latin look-alikes, known Russianisms. More linguistic checks arrive in Phase 2.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { formatIssue, loadCourse, runAllChecks, russianismsSchema } from './lib/content.ts';

const root = join(import.meta.dirname, '..', 'content');
const russianisms = russianismsSchema.parse(
  parse(readFileSync(join(root, 'validators', 'russianisms.yaml'), 'utf8')),
);

const { course, issues: loadIssues } = loadCourse(root);
const issues = [...loadIssues, ...runAllChecks(course, russianisms)];

for (const issue of issues) console.log(formatIssue(issue));
const errors = issues.filter((i) => i.level === 'error').length;
const warnings = issues.length - errors;
console.log(
  `\ncontent:validate — ${course.lexemes.length} lexemes, ${course.grammar.length} grammar points, ` +
    `${course.units.length} units, ${course.lessons.length} lessons: ${errors} errors, ${warnings} warnings.`,
);
process.exitCode = errors > 0 ? 1 : 0;
