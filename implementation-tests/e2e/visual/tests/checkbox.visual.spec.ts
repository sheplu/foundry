import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-checkbox> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-checkbox--default'));
    await page.locator('foundry-checkbox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('checkbox-default.png');
  });

  test('Checked story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-checkbox--checked'));
    await page.locator('foundry-checkbox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('checkbox-checked.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-checkbox--required'));
    await page.locator('foundry-checkbox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('checkbox-required.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-checkbox--disabled'));
    await page.locator('foundry-checkbox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('checkbox-disabled.png');
  });

  test('InForm story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-checkbox--in-form'));
    await page.locator('foundry-checkbox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('checkbox-in-form.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-checkbox--theming'));
    await page.locator('foundry-checkbox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('checkbox-theming.png');
  });
});
