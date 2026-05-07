import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-button-group> visual regression', () => {
  test('Presentation story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-button-group--presentation'));
    await page.locator('foundry-button-group').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-group-presentation.png');
  });

  test('Single story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-button-group--single'));
    await page.locator('foundry-button-group').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-group-single.png');
  });

  test('Multiple story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-button-group--multiple'));
    await page.locator('foundry-button-group').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-group-multiple.png');
  });

  test('Vertical story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-button-group--vertical'));
    await page.locator('foundry-button-group').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-group-vertical.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-button-group--theming'));
    await page.locator('foundry-button-group').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('button-group-theming.png');
  });
});
