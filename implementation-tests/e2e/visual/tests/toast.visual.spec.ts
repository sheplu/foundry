import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Closed-state-only snapshots: toasts in stories use duration="0" so they
// stay put while the screenshot is captured. The region position grid uses
// pre-rendered declarative children so the timer doesn't start.
test.describe('<foundry-toast> visual regression', () => {
  test('Variants story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-toast--variants'));
    await page.locator('foundry-toast').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('toast-variants.png');
  });

  test('WithTitle story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-toast--with-title'));
    await page.locator('foundry-toast').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('toast-with-title.png');
  });

  test('ToastRegion Positions story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-toastregion--positions'));
    await page.locator('foundry-toast-region').first().waitFor({ state: 'attached' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('toast-positions.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-toast--theming'));
    await page.locator('foundry-toast').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('toast-theming.png');
  });
});
