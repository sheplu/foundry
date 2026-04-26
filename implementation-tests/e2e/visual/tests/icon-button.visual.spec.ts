import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-icon-button> visual regression', () => {
  test('States story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('actions-iconbutton--states'));
    await page.locator('foundry-icon-button').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('icon-button-states.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('actions-iconbutton--theming'));
    await page.locator('foundry-icon-button').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('icon-button-theming.png');
  });
});
