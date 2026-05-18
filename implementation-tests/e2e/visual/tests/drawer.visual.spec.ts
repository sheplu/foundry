import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('<foundry-drawer> visual regression', () => {
  test('FromStart story matches snapshot (opened)', async ({ page }) => {
    await page.goto(iframeUrl('overlays-drawer--from-start'));
    const host = page.locator('foundry-drawer').first();
    await host.waitFor({ state: 'attached' });
    await host.evaluate((el) => (el as HTMLElement & { show?: () => void }).show?.());
    // Wait for the slide-in animation to complete before snapshotting.
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('drawer-from-start.png');
  });

  test('Default (end) story matches snapshot (opened)', async ({ page }) => {
    await page.goto(iframeUrl('overlays-drawer--default'));
    const host = page.locator('foundry-drawer').first();
    await host.waitFor({ state: 'attached' });
    await host.evaluate((el) => (el as HTMLElement & { show?: () => void }).show?.());
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('drawer-default.png');
  });

  test('FromTop story matches snapshot (opened)', async ({ page }) => {
    await page.goto(iframeUrl('overlays-drawer--from-top'));
    const host = page.locator('foundry-drawer').first();
    await host.waitFor({ state: 'attached' });
    await host.evaluate((el) => (el as HTMLElement & { show?: () => void }).show?.());
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('drawer-from-top.png');
  });

  test('FromBottom story matches snapshot (opened)', async ({ page }) => {
    await page.goto(iframeUrl('overlays-drawer--from-bottom'));
    const host = page.locator('foundry-drawer').first();
    await host.waitFor({ state: 'attached' });
    await host.evaluate((el) => (el as HTMLElement & { show?: () => void }).show?.());
    await page.waitForTimeout(250);
    await expect(page).toHaveScreenshot('drawer-from-bottom.png');
  });
});
