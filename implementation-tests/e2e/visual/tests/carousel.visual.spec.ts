import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-carousel> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-carousel--default'));
    await page.locator('foundry-carousel').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('carousel-default.png');
  });

  test('Fade story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-carousel--fade'));
    await page.locator('foundry-carousel').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('carousel-fade.png');
  });

  test('NoLoop story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-carousel--no-loop'));
    await page.locator('foundry-carousel').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('carousel-no-loop.png');
  });

  test('RichContent story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-carousel--rich-content'));
    await page.locator('foundry-carousel').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('carousel-rich.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-carousel--theming'));
    await page.locator('foundry-carousel').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('carousel-theming.png');
  });
});
