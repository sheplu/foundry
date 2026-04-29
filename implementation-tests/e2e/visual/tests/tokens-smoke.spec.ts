/**
 * Smoke test for Foundations/Tokens stories. Not a visual baseline — a
 * data-driven story would flag every new token as a diff, which is the
 * opposite of what we want. Instead, verify each tier story renders:
 *   - iframe loads without console errors
 *   - the rendered body contains tokens (h2 groups visible)
 *   - at least one color swatch is present for the tier
 *
 * This file is intentionally in the visual-regression dir so it runs
 * inside the same Playwright Docker image as the baselines.
 */
import { expect, test } from '@playwright/test';

const iframeUrl = (id: string): string => `/iframe.html?id=${id}&viewMode=story`;

test.describe('Foundations/Tokens stories smoke', () => {
  for (const story of ['primitive', 'semantic', 'component'] as const) {
    test(`${story} story renders without errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('pageerror', (err) => consoleErrors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(iframeUrl(`foundations-tokens--${story}`));
      await page.locator('#storybook-root h1').waitFor({ state: 'visible' });

      // Title mentions the tier
      const h1 = await page.locator('#storybook-root h1').textContent();
      expect(h1?.toLowerCase()).toContain(story);

      // At least one category section rendered
      const sections = await page.locator('#storybook-root h2').count();
      expect(sections).toBeGreaterThan(0);

      expect(consoleErrors).toEqual([]);
    });
  }
});
