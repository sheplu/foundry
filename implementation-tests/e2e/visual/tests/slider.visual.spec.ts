import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-slider> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-slider--default'));
    await page.locator('foundry-slider').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('slider-default.png');
  });

  test('LargeRange story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-slider--large-range'));
    await page.locator('foundry-slider').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('slider-large-range.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-slider--disabled'));
    await page.locator('foundry-slider').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('slider-disabled.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-slider--theming'));
    await page.locator('foundry-slider').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('slider-theming.png');
  });
});
