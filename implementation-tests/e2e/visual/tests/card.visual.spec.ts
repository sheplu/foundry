import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-card> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-card--default'));
    await page.locator('foundry-card').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('card-default.png');
  });

  test('Elevated story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-card--elevated'));
    await page.locator('foundry-card').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('card-elevated.png');
  });

  test('WithMedia story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-card--with-media'));
    await page.locator('foundry-card').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('card-with-media.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-card--theming'));
    await page.locator('foundry-card').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('card-theming.png');
  });
});
