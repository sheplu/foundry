import { expect, test, type Page } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

// Freeze the fade for deterministic snapshots.
test.use({ reducedMotion: 'reduce' });

async function openTrigger(page: Page): Promise<void> {
  // Stories wrap the trigger in a foundry-button; the actual focusable
  // element is the inner native button. Clicking the host bubbles through.
  await page.locator('foundry-popover foundry-button').first().click();
  await page.locator('foundry-popover[open]').first().waitFor();
}

test.describe('<foundry-popover> visual regression', () => {
  test('Default story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-popover--default'));
    await page.locator('foundry-popover').first().waitFor({ state: 'visible' });
    await openTrigger(page);
    await expect(page.locator('#storybook-root')).toHaveScreenshot('popover-default.png');
  });

  test('Placements story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-popover--placements'));
    await page.locator('foundry-popover').first().waitFor({ state: 'visible' });
    await openTrigger(page);
    await expect(page.locator('#storybook-root')).toHaveScreenshot('popover-placements.png');
  });

  test('RichContent story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-popover--rich-content'));
    await page.locator('foundry-popover').first().waitFor({ state: 'visible' });
    await openTrigger(page);
    await expect(page.locator('#storybook-root')).toHaveScreenshot('popover-rich-content.png');
  });

  test('Theming story matches snapshot', async ({ page }) => {
    await page.goto(iframeUrl('feedback-popover--theming'));
    await page.locator('foundry-popover').first().waitFor({ state: 'visible' });
    await openTrigger(page);
    await expect(page.locator('#storybook-root')).toHaveScreenshot('popover-theming.png');
  });
});
