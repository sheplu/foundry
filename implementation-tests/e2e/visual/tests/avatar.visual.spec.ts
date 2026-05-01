import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-avatar> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('media-avatar--default'));
    await page.locator('foundry-avatar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('avatar-default.png');
  });

  test('InitialsFallback story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('media-avatar--initials-fallback'));
    await page.locator('foundry-avatar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('avatar-initials.png');
  });

  test('Sizes story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('media-avatar--sizes'));
    await page.locator('foundry-avatar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('avatar-sizes.png');
  });

  test('Square story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('media-avatar--square'));
    await page.locator('foundry-avatar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('avatar-square.png');
  });

  test('WithStatus story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('media-avatar--with-status'));
    await page.locator('foundry-avatar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('avatar-status.png');
  });

  test('CustomSlottedInitials story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('media-avatar--custom-slotted-initials'));
    await page.locator('foundry-avatar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('avatar-slotted.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('media-avatar--theming'));
    await page.locator('foundry-avatar').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('avatar-theming.png');
  });
});
