import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-text-field> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--default'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-default.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--required'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-required.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--disabled'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-disabled.png');
  });

  test('Readonly story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--readonly'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-readonly.png');
  });

  test('WithHint story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--with-hint'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-with-hint.png');
  });

  test('Invalid story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--invalid'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-invalid.png');
  });

  test('Types story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--types'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-types.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textfield--theming'));
    await page.locator('foundry-text-field').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('text-field-theming.png');
  });
});
