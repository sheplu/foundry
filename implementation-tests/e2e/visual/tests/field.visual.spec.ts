import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-field> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-field--default'));
    await page.locator('foundry-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('field-default.png');
  });

  test('WithHelper story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-field--with-helper'));
    await page.locator('foundry-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('field-with-helper.png');
  });

  test('WithError story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-field--with-error'));
    await page.locator('foundry-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('field-with-error.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-field--required'));
    await page.locator('foundry-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('field-required.png');
  });

  test('WrappingNativeDate story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-field--wrapping-native-date'));
    await page.locator('foundry-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('field-wrapping-native-date.png');
  });

  test('WrappingTextarea story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-field--wrapping-textarea'));
    await page.locator('foundry-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('field-wrapping-textarea.png');
  });
});
