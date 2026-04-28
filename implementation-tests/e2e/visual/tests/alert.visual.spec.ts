import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-alert> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-alert--default'));
    await page.locator('foundry-alert').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('alert-default.png');
  });

  test('VariantScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-alert--variant-scale'));
    await page.locator('foundry-alert').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('alert-variant-scale.png');
  });

  test('TitleOnly story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-alert--title-only'));
    await page.locator('foundry-alert').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('alert-title-only.png');
  });

  test('BodyOnly story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-alert--body-only'));
    await page.locator('foundry-alert').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('alert-body-only.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-alert--theming'));
    await page.locator('foundry-alert').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('alert-theming.png');
  });
});
