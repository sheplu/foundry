import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-text> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('typography-text--default'));
    await page.locator('foundry-text').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-default.png');
  });

  test('VariantScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('typography-text--variant-scale'));
    await page.locator('foundry-text').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-variant-scale.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('typography-text--theming'));
    await page.locator('foundry-text').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-theming.png');
  });
});
