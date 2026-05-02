import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Freeze the fade transition so screenshots are deterministic across runs.
test.use({ reducedMotion: 'reduce' });

test.describe('<foundry-tooltip> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-tooltip--default'));
    await page.locator('foundry-tooltip').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tooltip-default.png');
  });

  test('Placements story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-tooltip--placements'));
    await page.locator('foundry-tooltip').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tooltip-placements.png');
  });

  test('LongContent story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-tooltip--long-content'));
    await page.locator('foundry-tooltip').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tooltip-long-content.png');
  });

  test('ReducedMotion story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-tooltip--reduced-motion'));
    await page.locator('foundry-tooltip').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tooltip-reduced-motion.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-tooltip--theming'));
    await page.locator('foundry-tooltip').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tooltip-theming.png');
  });
});
