import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import type { AlphabetBundle } from '../../src/content/schema.ts';
import { toLatin } from '../../src/engine/answer-check/transliterate.ts';
import { KEY_FOR } from '../../src/features/keyboard/layout.ts';

const bundle = JSON.parse(
  await readFile(join(import.meta.dirname, '../../public/content/alphabet.json'), 'utf8'),
) as AlphabetBundle;
const plain = (s: string) => s.replaceAll('́', '');
const letter = (lower: string) => bundle.letters.find((l) => l.lower === lower)!;
const word = (id: string) => bundle.words.find((w) => w.id === id)!;

/** Answer the current exercise. Returns false when the lesson is over. */
async function answer(
  page: Page,
  { mistake, physicalKeys }: { mistake: boolean; physicalKeys: boolean },
) {
  const screen = page.locator('[data-exercise-id]');
  if ((await screen.count()) === 0) return false;
  const id = (await screen.getAttribute('data-exercise-id'))!;
  const options = screen.getByRole('group').getByRole('button');
  const choose = async (correct: string) => {
    const all = await options.allInnerTexts();
    const target = mistake ? all.find((t) => !t.endsWith(correct))! : correct;
    await options
      .filter({ hasText: new RegExp(`^\\d?\\s*${target.replace(/\d\s*/, '')}$`) })
      .first()
      .click();
  };

  let m: RegExpMatchArray | null;
  if (id.endsWith('.intro')) {
    await page.getByRole('button', { name: 'Continue' }).click();
    return true;
  } else if ((m = id.match(/^alphabet\.(.)\.sound$/))) {
    await choose(letter(m[1]!).sound);
  } else if ((m = id.match(/^alphabet\.(.)\.letter$/))) {
    await choose(m[1]!);
  } else if ((m = id.match(/^alphabet\.read\.(.+)$/))) {
    await choose(toLatin(plain(word(m[1]!).lemma)));
  } else if ((m = id.match(/^alphabet\.type\.(.+)$/))) {
    const text = plain(word(m[1]!).lemma);
    const field = page.getByLabel('Your answer');
    if (physicalKeys) {
      await field.click();
      await page.keyboard.type([...text].map((c) => KEY_FOR[c]).join('')); // phonetic typing
    } else {
      await field.fill(mistake ? `${text}х` : text);
    }
  } else {
    throw new Error(`unexpected exercise ${id}`);
  }
  await page.getByRole('button', { name: 'Check' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: mistake ? 'Not quite.' : 'Correct' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  return true;
}

test('complete the first alphabet lesson, with a deliberate mistake', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Section 0/ }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'The Bulgarian alphabet' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Start' }).first().click();

  let mistakes = 0;
  for (let step = 0; step < 80; step++) {
    if (await page.getByRole('heading', { name: 'Lesson complete!' }).isVisible()) break;
    const id = await page.locator('[data-exercise-id]').getAttribute('data-exercise-id');
    const makeMistake = mistakes === 0 && !id!.endsWith('.intro');
    if (!(await answer(page, { mistake: makeMistake, physicalKeys: !isMobile }))) break;
    if (makeMistake) mistakes++;
  }

  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible();
  await expect(page.getByText(/^\d+%$/)).not.toHaveText('100%'); // the mistake counts
  await page.getByRole('link', { name: 'Back to the alphabet' }).click();
  await expect(page.getByText('✓ Completed')).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'Practise all letters you have learned' }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Learn' }).first().click();
  await expect(page.getByText('1 of 6 lessons done')).toBeVisible();
});

test('the letter chart explains each letter', async ({ page }) => {
  await page.goto('/alphabet');
  const chart = page.getByRole('button', { name: /^Letter / });
  await expect(chart).toHaveCount(30);
  await expect(chart.nth(0)).toHaveAccessibleName('Letter А');
  await expect(chart.nth(1)).toHaveAccessibleName('Letter Б'); // alphabetical, not lesson order
  await page.getByRole('button', { name: 'Letter В' }).click();
  await expect(page.getByText("Looks like Latin B — but it isn't!")).toBeVisible();
  await expect(page.getByText(/never “b”/)).toBeVisible();
});
