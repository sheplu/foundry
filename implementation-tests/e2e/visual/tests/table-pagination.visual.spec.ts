import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-table-pagination> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table-pagination--default'));
    await page.locator('foundry-table-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-pagination-default.png');
  });

  test('LargeDataset story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table-pagination--large-dataset'));
    await page.locator('foundry-table-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-pagination-large.png');
  });

  test('WithSort story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table-pagination--with-sort'));
    await page.locator('foundry-table-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-pagination-sort.png');
  });

  test('Localized story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table-pagination--localized'));
    await page.locator('foundry-table-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-pagination-localized.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-table-pagination--theming'));
    await page.locator('foundry-table-pagination').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('table-pagination-theming.png');
  });
});
