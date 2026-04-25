import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-icon> visual regression', () => {
  test('Gallery story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('foundation-icon--gallery'));
    await page.locator('foundry-icon').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('icon-gallery.png');
  });

  test('SizedAndColored story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('foundation-icon--sized-and-colored'));
    await page.locator('foundry-icon').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('icon-sized-and-colored.png');
  });
});
