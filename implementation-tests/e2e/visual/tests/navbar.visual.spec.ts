import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-navbar> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-navbar--default'));
    await page.locator('foundry-navbar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('navbar-default.png');
  });

  test('BrandOnly story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-navbar--brand-only'));
    await page.locator('foundry-navbar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('navbar-brand-only.png');
  });

  test('Elevated story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-navbar--elevated'));
    await page.locator('foundry-navbar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('navbar-elevated.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-navbar--theming'));
    await page.locator('foundry-navbar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('navbar-theming.png');
  });
});
