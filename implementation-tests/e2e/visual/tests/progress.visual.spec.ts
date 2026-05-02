import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Freeze the fill-width transition so snapshots are deterministic across runs.
test.use({ reducedMotion: 'reduce' });

test.describe('<foundry-progress> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-progress--default'));
    await page.locator('foundry-progress').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('progress-default.png');
  });

  test('Variants story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-progress--variants'));
    await page.locator('foundry-progress').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('progress-variants.png');
  });

  test('Scale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-progress--scale'));
    await page.locator('foundry-progress').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('progress-scale.png');
  });

  test('WithCustomMax story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-progress--with-custom-max'));
    await page.locator('foundry-progress').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('progress-custom-max.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-progress--theming'));
    await page.locator('foundry-progress').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('progress-theming.png');
  });
});
