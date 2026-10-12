// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Enforces the WCAG 2.2 AA contrast promises written at the top of tokens.css. */

const css = readFileSync(join(import.meta.dirname, 'tokens.css'), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1]!, m[2]!]),
  );
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS: [fg: string, bg: string, min: number][] = [
  ['fg', 'bg', 7],
  ['fg', 'surface', 7],
  ['fg-muted', 'bg', 4.5],
  ['fg-muted', 'surface', 4.5],
  ['primary', 'surface', 4.5],
  ['primary', 'surface-2', 4.5],
  ['on-primary', 'primary', 4.5],
  ['on-accent', 'accent', 4.5],
  ['success', 'success-bg', 4.5],
  ['success', 'surface', 4.5],
  ['danger', 'danger-bg', 4.5],
  ['danger', 'surface', 4.5],
  ['border', 'surface', 1.2],
];

describe.each([
  ['light', ':root'],
  ['dark', ":root[data-theme='dark']"],
])('%s theme', (_name, selector) => {
  const tokens = block(selector);

  it.each(PAIRS)('%s on %s ≥ %d:1', (fg, bg, min) => {
    expect(tokens[fg], `--${fg} missing`).toBeDefined();
    expect(tokens[bg], `--${bg} missing`).toBeDefined();
    expect(contrast(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(min);
  });
});

it('the prefers-color-scheme dark block matches the explicit dark theme', () => {
  const explicit = block(":root[data-theme='dark']");
  const media = block(":root:not([data-theme='light'])");
  expect(media).toEqual(explicit);
});
