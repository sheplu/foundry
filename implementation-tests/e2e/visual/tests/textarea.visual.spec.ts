import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-textarea> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--default'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-default.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--required'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-required.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--disabled'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-disabled.png');
  });

  test('Readonly story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--readonly'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-readonly.png');
  });

  test('WithHint story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--with-hint'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-with-hint.png');
  });

  test('Invalid story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--invalid'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-invalid.png');
  });

  test('Rows story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--rows'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-rows.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-textarea--theming'));
    await page.locator('foundry-textarea').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('textarea-theming.png');
  });
});
