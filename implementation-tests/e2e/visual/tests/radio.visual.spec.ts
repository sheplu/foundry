import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-radio> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-radio--default'));
    await page.locator('foundry-radio').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('radio-default.png');
  });

  test('Group story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-radio--group'));
    await page.locator('foundry-radio').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('radio-group.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-radio--disabled'));
    await page.locator('foundry-radio').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('radio-disabled.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-radio--required'));
    await page.locator('foundry-radio').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('radio-required.png');
  });

  test('InForm story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-radio--in-form'));
    await page.locator('foundry-radio').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('radio-in-form.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-radio--theming'));
    await page.locator('foundry-radio').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('radio-theming.png');
  });
});
