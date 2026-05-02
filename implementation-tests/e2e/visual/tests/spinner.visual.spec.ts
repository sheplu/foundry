import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Freeze all CSS animations by emulating prefers-reduced-motion: reduce.
// Spinner's CSS halts rotation under this media query, which gives stable
// snapshots across runs.
test.use({ reducedMotion: 'reduce' });

test.describe('<foundry-spinner> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-spinner--default'));
    await page.locator('foundry-spinner').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('spinner-default.png');
  });

  test('Sizes story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-spinner--sizes'));
    await page.locator('foundry-spinner').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('spinner-sizes.png');
  });

  test('WithLabel story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-spinner--with-label'));
    await page.locator('foundry-spinner').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('spinner-with-label.png');
  });

  test('ColoredContext story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-spinner--colored-context'));
    await page.locator('foundry-spinner').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('spinner-colored.png');
  });

  test('ReducedMotion story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-spinner--reduced-motion'));
    await page.locator('foundry-spinner').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('spinner-reduced-motion.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-spinner--theming'));
    await page.locator('foundry-spinner').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('spinner-theming.png');
  });
});
