import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-badge> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-badge--default'));
    await page.locator('foundry-badge').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('badge-default.png');
  });

  test('VariantScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-badge--variant-scale'));
    await page.locator('foundry-badge').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('badge-variant-scale.png');
  });

  test('WithIcon story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-badge--with-icon'));
    await page.locator('foundry-badge').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('badge-with-icon.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-badge--theming'));
    await page.locator('foundry-badge').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('badge-theming.png');
  });
});
