import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('the course path renders units and navigation works', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Your course' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Greetings' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Section 0/ })).toBeVisible();

  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  await nav.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Profile' })).toBeVisible();
});

test('switching to Turkish changes the UI and survives a reload', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Language').first().selectOption('tr');
  await expect(page.getByRole('heading', { level: 1, name: 'Ayarlar' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Ayarlar' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
});

test('export → reset → import restores progress', async ({ page }) => {
  page.on('dialog', (dialog) => void dialog.accept());
  await page.goto('/settings');

  // Change something so there is progress to lose.
  await page.getByLabel('Appearance').selectOption('dark');
  await page.getByLabel('Daily goal').selectOption('50');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^shtarkel-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const backupPath = await download.path();
  const backup = JSON.parse(await readFile(backupPath, 'utf8')) as { format: string };
  expect(backup.format).toBe('shtarkel-backup');

  await page.getByRole('button', { name: 'Reset all progress' }).click();
  await expect(page.getByText('All progress was reset.')).toBeVisible();
  await expect(page.getByLabel('Daily goal')).toHaveValue('20');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');

  await page.getByTestId('import-input').setInputFiles(backupPath);
  await expect(page.getByText('Backup imported.')).toBeVisible();
  await expect(page.getByLabel('Daily goal')).toHaveValue('50');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('a bad backup file is rejected without touching progress', async ({ page }) => {
  await page.goto('/settings');
  await page.getByLabel('Daily goal').selectOption('50');
  await page.getByTestId('import-input').setInputFiles({
    name: 'nope.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": 1}'),
  });
  await expect(page.getByText('This file is not a valid Shtarkel backup.')).toBeVisible();
  await expect(page.getByLabel('Daily goal')).toHaveValue('50');
});
