import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Closed-state snapshots only. The surface lives in the top layer when
// open (awkward to snapshot reliably); functional tests cover the open
// flow in a real browser.
test.describe('<foundry-menu> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-menu--default'));
    await page.locator('foundry-menu').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('menu-default.png');
  });

  test('WithIcons story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-menu--with-icons'));
    await page.locator('foundry-menu').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('menu-with-icons.png');
  });

  test('Mixed story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-menu--mixed'));
    await page.locator('foundry-menu').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('menu-mixed.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-menu--theming'));
    await page.locator('foundry-menu').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('menu-theming.png');
  });
});
