import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-combobox> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-combobox--default'));
    await page.locator('foundry-combobox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('combobox-default.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-combobox--required'));
    await page.locator('foundry-combobox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('combobox-required.png');
  });

  test('WithError story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-combobox--with-error'));
    await page.locator('foundry-combobox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('combobox-with-error.png');
  });

  test('FreeFormCommit story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-combobox--free-form-commit'));
    await page.locator('foundry-combobox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('combobox-free-form-commit.png');
  });

  test('NoMatchingOption story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-combobox--no-matching-option'));
    await page.locator('foundry-combobox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('combobox-no-matching-option.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-combobox--disabled'));
    await page.locator('foundry-combobox').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('combobox-disabled.png');
  });
});
