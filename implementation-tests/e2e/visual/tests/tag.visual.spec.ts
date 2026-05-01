import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-tag> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-tag--default'));
    await page.locator('foundry-tag').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tag-default.png');
  });

  test('VariantScale story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-tag--variant-scale'));
    await page.locator('foundry-tag').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tag-variants.png');
  });

  test('RemovableList story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-tag--removable-list'));
    await page.locator('foundry-tag').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tag-removable-list.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-tag--disabled'));
    await page.locator('foundry-tag').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tag-disabled.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('data-tag--theming'));
    await page.locator('foundry-tag').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('tag-theming.png');
  });
});
