import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-select> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--default'));
    await page.locator('foundry-select').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('select-default.png');
  });

  test('WithPlaceholder story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--with-placeholder'));
    await page.locator('foundry-select').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('select-with-placeholder.png');
  });

  test('Preselected story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--preselected'));
    await page.locator('foundry-select').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('select-preselected.png');
  });

  test('Required story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--required'));
    await page.locator('foundry-select').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('select-required.png');
  });

  test('Disabled story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--disabled'));
    await page.locator('foundry-select').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('select-disabled.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--theming'));
    await page.locator('foundry-select').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('select-theming.png');
  });

  test('Searchable story matches snapshot (closed)', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--searchable'));
    await page.locator('foundry-select').first().waitFor({ state: 'visible' });
    await expect(page.locator('#storybook-root')).toHaveScreenshot('select-searchable.png');
  });

  test('Searchable story matches snapshot (open)', async ({ page }) => {
    await page.goto(iframeUrl('forms-select--searchable'));
    const sel = page.locator('foundry-select').first();
    await sel.waitFor({ state: 'visible' });
    await sel.evaluate((el) => (el as HTMLElement & { show?: () => void }).show?.());
    // Wait for the slide-in / popover animation to settle.
    await page.waitForTimeout(150);
    await expect(page).toHaveScreenshot('select-searchable-open.png');
  });
});
