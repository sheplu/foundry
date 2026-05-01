import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-switch> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-switch--default'));
    await page.locator('foundry-switch').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('switch-default.png');
  });

  test('Checked story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-switch--checked'));
    await page.locator('foundry-switch').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('switch-checked.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-switch--required'));
    await page.locator('foundry-switch').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('switch-required.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-switch--disabled'));
    await page.locator('foundry-switch').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('switch-disabled.png');
  });

  test('InForm story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-switch--in-form'));
    await page.locator('foundry-switch').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('switch-in-form.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-switch--theming'));
    await page.locator('foundry-switch').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('switch-theming.png');
  });
});
