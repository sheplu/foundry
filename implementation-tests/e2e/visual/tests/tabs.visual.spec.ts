import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-tabs> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-tabs--default'));
    await page.locator('foundry-tabs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tabs-default.png');
  });

  test('Vertical story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-tabs--vertical'));
    await page.locator('foundry-tabs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tabs-vertical.png');
  });

  test('Overflow story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-tabs--overflow'));
    await page.locator('foundry-tabs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tabs-overflow.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-tabs--theming'));
    await page.locator('foundry-tabs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tabs-theming.png');
  });
});
