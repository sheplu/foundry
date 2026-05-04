import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Closed-state snapshots only. The caret has a rotate transition that
// would make open-state snapshots flaky without pausing animations;
// functional tests cover the open flow in a real browser.
test.describe('<foundry-accordion> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-accordion--default'));
    await page.locator('foundry-accordion').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('accordion-default.png');
  });

  test('Multiple story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-accordion--multiple'));
    await page.locator('foundry-accordion').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('accordion-multiple.png');
  });

  test('FAQ story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-accordion--faq'));
    await page.locator('foundry-accordion').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('accordion-faq.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('layout-accordion--theming'));
    await page.locator('foundry-accordion').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('accordion-theming.png');
  });
});
