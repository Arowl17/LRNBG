/*
 * Shared by content-build.ts and content-validate.ts: load content/ YAML, validate it
 * against the Zod schemas, and run the linguistic checks from SPEC §12.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';
import {
  grammarPointSchema,
  lessonSchema,
  lexemeSchema,
  unitSchema,
  type Exercise,
  type GrammarPoint,
  type Lesson,
  type Lexeme,
  type Unit,
} from '../../src/content/schema.ts';

export interface Issue {
  level: 'error' | 'warning';
  file: string;
  where: string;
  message: string;
}

export interface Course {
  lexemes: Lexeme[];
  grammar: GrammarPoint[];
  units: Unit[];
  lessons: Lesson[];
  /** Hash of every input file — changes whenever content changes. */
  contentVersion: string;
  /** Which file each id came from, for error messages. */
  fileOf: Map<string, string>;
}

/** A unit file holds one unit and its lessons. */
const unitFileSchema = z.object({ unit: unitSchema, lessons: z.array(lessonSchema) });

function yamlFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return yamlFiles(path);
      return /\.ya?ml$/.test(name) ? [path] : [];
    })
    .sort();
}

/** Load and schema-validate everything under `root` (the content/ folder). */
export function loadCourse(root: string): { course: Course; issues: Issue[] } {
  const issues: Issue[] = [];
  const hash = createHash('sha256');
  const course: Course = {
    lexemes: [],
    grammar: [],
    units: [],
    lessons: [],
    contentVersion: '',
    fileOf: new Map(),
  };

  function read<T>(path: string, schema: z.ZodType<T>): T | undefined {
    const file = relative(root, path);
    const text = readFileSync(path, 'utf8');
    hash.update(file).update('\0').update(text).update('\0');
    let data: unknown;
    try {
      data = parse(text);
    } catch (e) {
      issues.push({
        level: 'error',
        file,
        where: '',
        message: `YAML syntax: ${(e as Error).message}`,
      });
      return undefined;
    }
    const result = schema.safeParse(data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        issues.push({ level: 'error', file, where: issue.path.join('.'), message: issue.message });
      }
      return undefined;
    }
    return result.data;
  }

  const remember = (id: string, file: string) => {
    if (course.fileOf.has(id)) {
      issues.push({
        level: 'error',
        file,
        where: id,
        message: `duplicate id (also in ${course.fileOf.get(id)})`,
      });
    } else {
      course.fileOf.set(id, file);
    }
  };

  for (const path of yamlFiles(join(root, 'lexicon'))) {
    const items = read(path, z.array(lexemeSchema)) ?? [];
    for (const lex of items) remember(lex.id, relative(root, path));
    course.lexemes.push(...items);
  }
  for (const path of yamlFiles(join(root, 'grammar'))) {
    const items = read(path, z.array(grammarPointSchema)) ?? [];
    for (const gp of items) remember(gp.id, relative(root, path));
    course.grammar.push(...items);
  }
  for (const path of yamlFiles(join(root, 'units'))) {
    const data = read(path, unitFileSchema);
    if (!data) continue;
    const file = relative(root, path);
    remember(data.unit.id, file);
    course.units.push(data.unit);
    for (const lesson of data.lessons) {
      remember(lesson.id, file);
      for (const ex of lesson.exercises) remember(ex.id, file);
      course.lessons.push(lesson);
    }
  }

  course.contentVersion = hash.digest('hex').slice(0, 12);
  return { course, issues };
}

// ---------------------------------------------------------------------------
// Bulgarian text collection

export interface BgString {
  text: string;
  file: string;
  where: string;
}

function exerciseBgStrings(ex: Exercise): [string, string][] {
  switch (ex.type) {
    case 'select_meaning':
      return [['bg', ex.bg]];
    case 'tiles_translate':
      return [
        ['bg', ex.bg],
        ...(ex.accepted.bg ?? []).map((s, i): [string, string] => [`accepted.bg.${i}`, s]),
        ...(ex.distractors?.bg ?? []).map((s, i): [string, string] => [`distractors.bg.${i}`, s]),
      ];
    case 'type_translate':
      return [
        ['bg', ex.bg],
        ...(ex.accepted.bg ?? []).map((s, i): [string, string] => [`accepted.bg.${i}`, s]),
      ];
    case 'listen_tiles':
      return [
        ['bg', ex.bg],
        ...ex.accepted.map((s, i): [string, string] => [`accepted.${i}`, s]),
        ...(ex.distractors ?? []).map((s, i): [string, string] => [`distractors.${i}`, s]),
      ];
    case 'listen_type':
      return [['bg', ex.bg], ...ex.accepted.map((s, i): [string, string] => [`accepted.${i}`, s])];
    case 'match_pairs':
      return ex.pairs.map((p, i): [string, string] => [`pairs.${i}.bg`, p.bg]);
    case 'fill_blank':
      return [['bg', ex.bg], ...ex.options.map((s, i): [string, string] => [`options.${i}`, s])];
  }
}

/** Every Bulgarian string in the course, with where it lives. */
export function collectBgStrings(course: Course): BgString[] {
  const out: BgString[] = [];
  const file = (id: string) => course.fileOf.get(id) ?? '?';
  for (const lex of course.lexemes) {
    out.push({ text: lex.lemma, file: file(lex.id), where: `${lex.id}.lemma` });
    for (const [key, form] of Object.entries(lex.forms ?? {})) {
      out.push({ text: form, file: file(lex.id), where: `${lex.id}.forms.${key}` });
    }
  }
  for (const gp of course.grammar) {
    gp.examples.forEach((ex, i) =>
      out.push({ text: ex.bg, file: file(gp.id), where: `${gp.id}.examples.${i}` }),
    );
  }
  for (const lesson of course.lessons) {
    for (const ex of lesson.exercises) {
      for (const [path, text] of exerciseBgStrings(ex)) {
        out.push({ text, file: file(ex.id), where: `${ex.id}.${path}` });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Checks (SPEC §12). Each returns issues; none of them mutate content.

/** Letters that do not exist in modern Bulgarian (Russian ы э ё, pre-1945 ѣ ѫ, and others). */
const FORBIDDEN_LETTERS = /[ыЫэЭёЁѣѢѫѪіІїЇєЄўЎґҐ]/u;
const LATIN = /[A-Za-z]/;

export function checkLetters(strings: BgString[]): Issue[] {
  const issues: Issue[] = [];
  for (const s of strings) {
    const forbidden = s.text.match(FORBIDDEN_LETTERS);
    if (forbidden) {
      issues.push({
        level: 'error',
        file: s.file,
        where: s.where,
        message: `letter "${forbidden[0]}" does not exist in Bulgarian: "${s.text}"`,
      });
    }
    const latin = s.text.match(LATIN);
    if (latin) {
      issues.push({
        level: 'error',
        file: s.file,
        where: s.where,
        message: `Latin letter "${latin[0]}" in Bulgarian text (look-alike?): "${s.text}"`,
      });
    }
  }
  return issues;
}

export interface Russianism {
  ru: string;
  bg: string[];
  origin: 'spec' | 'ai_draft' | 'native';
}

export const russianismsSchema = z.array(
  z.object({
    ru: z.string().min(1),
    bg: z.array(z.string().min(1)).min(1),
    origin: z.enum(['spec', 'ai_draft', 'native']),
  }),
);

/** Lower-case words with stress marks removed; alternation braces and punctuation split words. */
export function words(text: string): string[] {
  return text
    .normalize('NFC')
    .replaceAll('́', '')
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean);
}

export function checkRussianisms(strings: BgString[], list: Russianism[]): Issue[] {
  const issues: Issue[] = [];
  const patterns = list.map((r) => ({ ...r, seq: words(r.ru) }));
  for (const s of strings) {
    const w = words(s.text);
    for (const p of patterns) {
      const found = w.some((_, i) => p.seq.every((pw, j) => w[i + j] === pw));
      if (found) {
        issues.push({
          level: 'error',
          file: s.file,
          where: s.where,
          message: `Russianism "${p.ru}" — Bulgarian: ${p.bg.join(' / ')}. Text: "${s.text}"`,
        });
      }
    }
  }
  return issues;
}

/** Every id referenced anywhere must exist, and point at the right kind of thing. */
export function checkReferences(course: Course): Issue[] {
  const issues: Issue[] = [];
  const lexemes = new Set(course.lexemes.map((l) => l.id));
  const grammar = new Set(course.grammar.map((g) => g.id));
  const units = new Set(course.units.map((u) => u.id));
  const lessons = new Set(course.lessons.map((l) => l.id));
  const file = (id: string) => course.fileOf.get(id) ?? '?';
  const need = (ok: boolean, owner: string, where: string, ref: string) => {
    if (!ok)
      issues.push({ level: 'error', file: file(owner), where, message: `unknown id "${ref}"` });
  };

  for (const lex of course.lexemes) {
    if (lex.aspectPartnerId)
      need(
        lexemes.has(lex.aspectPartnerId),
        lex.id,
        `${lex.id}.aspectPartnerId`,
        lex.aspectPartnerId,
      );
  }
  for (const gp of course.grammar) {
    for (const p of gp.prerequisites) need(grammar.has(p), gp.id, `${gp.id}.prerequisites`, p);
  }
  for (const unit of course.units) {
    for (const g of unit.grammarIds) need(grammar.has(g), unit.id, `${unit.id}.grammarIds`, g);
    for (const l of unit.lessonIds) need(lessons.has(l), unit.id, `${unit.id}.lessonIds`, l);
  }
  for (const lesson of course.lessons) {
    need(units.has(lesson.unitId), lesson.id, `${lesson.id}.unitId`, lesson.unitId);
    for (const l of lesson.newLexemeIds)
      need(lexemes.has(l), lesson.id, `${lesson.id}.newLexemeIds`, l);
    for (const g of lesson.grammarIds)
      need(grammar.has(g), lesson.id, `${lesson.id}.grammarIds`, g);
    for (const ex of lesson.exercises) {
      for (const t of ex.targets)
        need(lexemes.has(t) || grammar.has(t), ex.id, `${ex.id}.targets`, t);
    }
  }
  return issues;
}

export function runAllChecks(course: Course, russianisms: Russianism[]): Issue[] {
  const strings = collectBgStrings(course);
  return [
    ...checkLetters(strings),
    ...checkRussianisms(strings, russianisms),
    ...checkReferences(course),
  ];
}

export function formatIssue(i: Issue): string {
  return `${i.level === 'error' ? 'ERROR' : 'warn '}  ${i.file}${i.where ? ` › ${i.where}` : ''}: ${i.message}`;
}
