import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import type { Exercise, UnitBundle } from '../../src/content/schema.ts';
import { expandAlternatives } from '../../src/engine/answer-check/expand.ts';
import { answerWords } from '../../src/features/exercises/tiles.ts';

const unit = JSON.parse(
  await readFile(join(import.meta.dirname, '../../dist/content/units/unit.a1-01.json'), 'utf8'),
) as UnitBundle;
const exercises = new Map(unit.lessons.flatMap((l) => l.exercises).map((e) => [e.id, e] as const));
const canonical = (pattern: string) => expandAlternatives(pattern).answers[0]!;
const exact = (text: string) =>
  new RegExp(`^\\d?\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

async function clickOption(page: Page, text: string) {
  await page
    .locator('[data-exercise-id] [role=group]')
    .getByRole('button', { name: exact(text) })
    .first()
    .click();
}

async function answer(page: Page, ex: Exercise, wrong: boolean) {
  switch (ex.type) {
    case 'select_meaning':
      return clickOption(
        page,
        ex.options[wrong ? (ex.answerIndex + 1) % ex.options.length : ex.answerIndex]!.en,
      );
    case 'fill_blank':
      return clickOption(
        page,
        ex.options[wrong ? (ex.answerIndex + 1) % ex.options.length : ex.answerIndex]!,
      );
    case 'match_pairs':
      for (const p of ex.pairs) {
        await page.getByRole('button', { name: p.bg, exact: true }).click();
        await page.getByRole('button', { name: p.meaning.en, exact: true }).click();
      }
      return;
    case 'tiles_translate': {
      const target = ex.direction === 'src_to_bg' ? ex.accepted.bg! : ex.accepted.en!;
      const words = answerWords(target[0]!);
      const bank = page.getByRole('group', { name: 'Word bank' });
      for (const w of wrong ? words.slice(1) : words)
        await bank
          .getByRole('button', { name: exact(w) })
          .first()
          .click();
      return;
    }
    case 'type_translate': {
      const target = ex.direction === 'src_to_bg' ? ex.accepted.bg! : ex.accepted.en!;
      return page.getByLabel('Your answer').fill(wrong ? 'дадада' : canonical(target[0]!));
    }
    case 'listen_tiles': {
      // Generated audio exists, so listening exercises are part of the lesson.
      const words = answerWords(ex.accepted[0]!);
      const bank = page.getByRole('group', { name: 'Word bank' });
      for (const w of wrong ? words.slice(1) : words)
        await bank
          .getByRole('button', { name: exact(w) })
          .first()
          .click();
      return;
    }
    case 'listen_type':
      return page.getByLabel('Your answer').fill(wrong ? 'дадада' : canonical(ex.accepted[0]!));
  }
}

test('complete A1 unit 1, lesson 1 with a deliberate mistake', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Hello & goodbye/ }).click();

  const seen = new Set<string>();
  let mistakeMade = false;
  for (let step = 0; step < 60; step++) {
    if (await page.getByRole('heading', { name: 'Lesson complete!' }).isVisible()) break;
    const id = (await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'))!;
    const ex = exercises.get(id);
    if (!ex) {
      // Grammar tip or new-word card.
      await page.getByRole('button', { name: 'Continue' }).click();
      continue;
    }
    const wrong = !mistakeMade;
    await answer(page, ex, wrong);
    await page.getByRole('button', { name: 'Check' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: wrong ? 'Not quite.' : /Correct/ }),
    ).toBeVisible();
    if (wrong) {
      mistakeMade = true;
      await expect(page.getByText("You'll see this one again at the end.")).toBeVisible();
    }
    seen.add(ex.type);
    await page.getByRole('button', { name: 'Continue' }).click();
  }

  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible();
  await expect(page.getByText(/^\d+%$/)).not.toHaveText('100%');
  await expect(page.getByText(/здравей, здравейте, чао, довиждане/)).toBeVisible();
  expect([...seen].sort()).toEqual([
    'listen_tiles',
    'listen_type',
    'match_pairs',
    'select_meaning',
    'tiles_translate',
    'type_translate',
  ]);

  await page.getByRole('link', { name: 'Back to the course' }).click();
  // Lesson 1 is ticked; lesson 2 is now the highlighted next lesson.
  await expect(page.getByRole('link', { name: /Hello & goodbye/ })).toContainText('✓');
});

test('grammar tips library lists unit tips', async ({ page }) => {
  await page.goto('/grammar');
  await expect(page.getByRole('heading', { level: 2, name: 'Greetings' })).toBeVisible();
  await page.getByText('Informal and formal greetings').click();
  await expect(page.getByText(/is for one person you know well/)).toBeVisible();
});
