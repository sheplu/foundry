import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-number-stepper> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-numberstepper--default'));
    await page.locator('foundry-number-stepper').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('number-stepper-default.png');
  });

  test('WithValue story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-numberstepper--with-value'));
    await page.locator('foundry-number-stepper').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('number-stepper-with-value.png');
  });

  test('WithStep story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-numberstepper--with-step'));
    await page.locator('foundry-number-stepper').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('number-stepper-with-step.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-numberstepper--required'));
    await page.locator('foundry-number-stepper').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('number-stepper-required.png');
  });

  test('WithError story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-numberstepper--with-error'));
    await page.locator('foundry-number-stepper').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('number-stepper-with-error.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-numberstepper--disabled'));
    await page.locator('foundry-number-stepper').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('number-stepper-disabled.png');
  });
});
