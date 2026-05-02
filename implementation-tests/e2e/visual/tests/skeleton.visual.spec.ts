import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Freeze the pulse animation so snapshots are deterministic across runs.
test.use({ reducedMotion: 'reduce' });

test.describe('<foundry-skeleton> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-skeleton--default'));
    await page.locator('foundry-skeleton').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('skeleton-default.png');
  });

  test('Shapes story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-skeleton--shapes'));
    await page.locator('foundry-skeleton').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('skeleton-shapes.png');
  });

  test('Paragraph story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-skeleton--paragraph'));
    await page.locator('foundry-skeleton').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('skeleton-paragraph.png');
  });

  test('Card story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-skeleton--card'));
    await page.locator('foundry-skeleton').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('skeleton-card.png');
  });

  test('ReducedMotion story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-skeleton--reduced-motion'));
    await page.locator('foundry-skeleton').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('skeleton-reduced-motion.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-skeleton--theming'));
    await page.locator('foundry-skeleton').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('skeleton-theming.png');
  });
});
