import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-pagination> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-pagination--default'));
    await page.locator('foundry-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('pagination-default.png');
  });

  test('ManyPages story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-pagination--many-pages'));
    await page.locator('foundry-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('pagination-many-pages.png');
  });

  test('NearStart story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-pagination--near-start'));
    await page.locator('foundry-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('pagination-near-start.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-pagination--theming'));
    await page.locator('foundry-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('pagination-theming.png');
  });
});
