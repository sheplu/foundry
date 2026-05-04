import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Closed-state snapshots only. Native <dialog>'s top-layer + backdrop
// renders full-viewport when opened, which is brittle across storybook
// viewport sizes and token themes. Open-state is covered by the
// real-browser functional spec.
test.describe('<foundry-modal> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-modal--default'));
    await page.locator('foundry-modal').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('modal-default.png');
  });

  test('Sizes story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-modal--sizes'));
    await page.locator('foundry-modal').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('modal-sizes.png');
  });

  test('NonDismissible story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-modal--non-dismissible'));
    await page.locator('foundry-modal').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('modal-non-dismissible.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('overlays-modal--theming'));
    await page.locator('foundry-modal').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('modal-theming.png');
  });
});
