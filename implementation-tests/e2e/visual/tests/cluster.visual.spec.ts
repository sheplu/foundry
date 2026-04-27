import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-cluster> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-cluster--default'));
    await page.locator('foundry-cluster').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('cluster-default.png');
  });

  test('SpaceScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-cluster--space-scale'));
    await page.locator('foundry-cluster').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('cluster-space-scale.png');
  });

  test('Wrapping story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-cluster--wrapping'));
    await page.locator('foundry-cluster').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('cluster-wrapping.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-cluster--theming'));
    await page.locator('foundry-cluster').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('cluster-theming.png');
  });
});
