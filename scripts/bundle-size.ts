/*
 * pnpm size — fail if the JavaScript a first visit downloads exceeds the SPEC §17 budget
 * (200 KB gzip). "Initial" = the entry script in dist/index.html plus the chunks it
 * statically imports (modulepreload links). Run after `pnpm build`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_KB = 200;
const dist = join(import.meta.dirname, '..', 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const files = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]!);

let total = 0;
for (const file of new Set(files)) {
  const size = gzipSync(readFileSync(join(dist, file))).length;
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(7)} KB  ${file}`);
}
const kb = total / 1024;
console.log(`${kb.toFixed(1).padStart(7)} KB  initial JS (gzip), budget ${BUDGET_KB} KB`);
if (files.length === 0) {
  console.error('No scripts found in dist/index.html — run `pnpm build` first.');
  process.exitCode = 1;
} else if (kb > BUDGET_KB) {
  console.error(`Over budget by ${(kb - BUDGET_KB).toFixed(1)} KB.`);
  process.exitCode = 1;
}
