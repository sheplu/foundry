import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-table> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table--default'));
    await page.locator('foundry-table').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-default.png');
  });

  test('Striped story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table--striped'));
    await page.locator('foundry-table').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-striped.png');
  });

  test('Bordered story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table--bordered'));
    await page.locator('foundry-table').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-bordered.png');
  });

  test('Compact story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table--compact'));
    await page.locator('foundry-table').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-compact.png');
  });

  test('Sortable story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table--sortable'));
    await page.locator('foundry-table').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-sortable.png');
  });

  test('Combined story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table--combined'));
    await page.locator('foundry-table').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-combined.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table--theming'));
    await page.locator('foundry-table').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-theming.png');
  });
});
