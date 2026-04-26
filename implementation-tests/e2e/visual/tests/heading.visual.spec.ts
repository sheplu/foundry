import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-heading> visual regression', () => {
  test('LevelScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('typography-heading--level-scale'));
    await page.locator('foundry-heading').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('heading-level-scale.png');
  });

  test('SizeDecoupled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('typography-heading--size-decoupled'));
    await page.locator('foundry-heading').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('heading-size-decoupled.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('typography-heading--theming'));
    await page.locator('foundry-heading').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('heading-theming.png');
  });
});
