import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-link> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-link--default'));
    await page.locator('foundry-link').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('link-default.png');
  });

  test('Inline story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-link--inline'));
    await page.locator('foundry-link').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('link-inline.png');
  });

  test('Standalone story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-link--standalone'));
    await page.locator('foundry-link').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('link-standalone.png');
  });

  test('External story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-link--external'));
    await page.locator('foundry-link').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('link-external.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-link--theming'));
    await page.locator('foundry-link').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('link-theming.png');
  });
});
