import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-divider> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-divider--default'));
    await page.locator('foundry-divider').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('divider-default.png');
  });

  test('Horizontal story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-divider--horizontal'));
    await page.locator('foundry-divider').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('divider-horizontal.png');
  });

  test('Vertical story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-divider--vertical'));
    await page.locator('foundry-divider').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('divider-vertical.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-divider--theming'));
    await page.locator('foundry-divider').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('divider-theming.png');
  });
});
