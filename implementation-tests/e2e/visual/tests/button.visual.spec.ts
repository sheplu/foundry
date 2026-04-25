import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-button> visual regression', () => {
  test('States story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('actions-button--states'));
    await page.locator('foundry-button').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-states.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('actions-button--theming'));
    await page.locator('foundry-button').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-theming.png');
  });
});
