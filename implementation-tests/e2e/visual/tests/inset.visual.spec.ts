import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-inset> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-inset--default'));
    await page.locator('foundry-inset').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('inset-default.png');
  });

  test('SpaceScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-inset--space-scale'));
    await page.locator('foundry-inset').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('inset-space-scale.png');
  });

  test('Nested story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-inset--nested'));
    await page.locator('foundry-inset').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('inset-nested.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-inset--theming'));
    await page.locator('foundry-inset').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('inset-theming.png');
  });
});
