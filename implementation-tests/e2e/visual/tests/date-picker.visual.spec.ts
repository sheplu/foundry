import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-date-picker> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-datepicker--default'));
    await page.locator('foundry-date-picker').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('date-picker-default.png');
  });

  test('WithValue story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-datepicker--with-value'));
    await page.locator('foundry-date-picker').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('date-picker-with-value.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-datepicker--required'));
    await page.locator('foundry-date-picker').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('date-picker-required.png');
  });

  test('WithError story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-datepicker--with-error'));
    await page.locator('foundry-date-picker').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('date-picker-with-error.png');
  });

  test('WithMinMax story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-datepicker--with-min-max'));
    await page.locator('foundry-date-picker').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('date-picker-with-min-max.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-datepicker--disabled'));
    await page.locator('foundry-date-picker').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('date-picker-disabled.png');
  });
});
