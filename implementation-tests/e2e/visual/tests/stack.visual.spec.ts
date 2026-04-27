import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-stack> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-stack--default'));
    await page.locator('foundry-stack').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('stack-default.png');
  });

  test('SpaceScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-stack--space-scale'));
    await page.locator('foundry-stack').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('stack-space-scale.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-stack--theming'));
    await page.locator('foundry-stack').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('stack-theming.png');
  });
});
