import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-breadcrumbs> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-breadcrumbs--default'));
    await page.locator('foundry-breadcrumbs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('breadcrumbs-default.png');
  });

  test('WithCustomSeparator story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-breadcrumbs--with-custom-separator'));
    await page.locator('foundry-breadcrumbs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot(
      'breadcrumbs-custom-separator.png',
    );
  });

  test('LongTrail story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-breadcrumbs--long-trail'));
    await page.locator('foundry-breadcrumbs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('breadcrumbs-long.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('navigation-breadcrumbs--theming'));
    await page.locator('foundry-breadcrumbs').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('breadcrumbs-theming.png');
  });
});
