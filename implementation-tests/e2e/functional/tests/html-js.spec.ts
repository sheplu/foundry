import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:5175' });

test.describe('html-js canary — reference screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/implementation-tests/html-js/');
    // Wait for custom elements to upgrade.
    await page.locator('[data-testid="btn-primary"]').waitFor({ state: 'visible' });
  });

  test('renders the three button variants with correct attributes', async ({ page }) => {
    for (const variant of ['primary', 'secondary', 'danger'] as const) {
      const host = page.locator(`[data-testid="btn-${variant}"]`);
      await expect(host).toHaveAttribute('variant', variant);
      await expect(host).toContainText(variant);
    }
  });

  test('clicking an enabled button increments the click counter', async ({ page }) => {
    const counter = page.locator('[data-testid="click-count"]');
    await expect(counter).toHaveText('0');

    await page.locator('[data-testid="btn-primary"]').click();
    await expect(counter).toHaveText('1');

    await page.locator('[data-testid="btn-secondary"]').click();
    await page.locator('[data-testid="btn-danger"]').click();
    await expect(counter).toHaveText('3');
  });

  test('clicking a disabled button does not increment the counter', async ({ page }) => {
    const counter = page.locator('[data-testid="click-count"]');
    await expect(counter).toHaveText('0');

    // Playwright honors `disabled` and will fail loudly; force is intentional
    // to verify that the native <button disabled> suppresses the click.
    await page.locator('[data-testid="btn-primary-disabled"]').click({ force: true });
    await expect(counter).toHaveText('0');
  });

  test('theme toggle flips html[data-theme] between light and dark', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.locator('[data-testid="theme-toggle"]').click();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.locator('[data-testid="theme-toggle"]').click();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('every icon renders an <svg> inside its shadow root', async ({ page }) => {
    const gallery = page.locator('[data-testid="icon-gallery"]');
    for (const name of ['check', 'chevron-down', 'close']) {
      const hasSvg = await gallery.locator(`foundry-icon[name="${name}"]`).evaluate((el) => {
        return Boolean(el.shadowRoot?.querySelector('svg'));
      });
      expect(hasSvg, `foundry-icon[name="${name}"] must render an svg`).toBe(true);
    }
  });

  test('icon buttons forward label as aria-label and respect disabled', async ({ page }) => {
    const confirm = page.locator('[data-testid="iconbtn-confirm"]');
    const close = page.locator('[data-testid="iconbtn-close"]');
    const disabled = page.locator('[data-testid="iconbtn-close-disabled"]');
    const counter = page.locator('[data-testid="click-count"]');

    const ariaLabel = await confirm.evaluate((el) =>
      el.shadowRoot?.querySelector('button')?.getAttribute('aria-label'),
    );
    expect(ariaLabel).toBe('Confirm');

    await expect(counter).toHaveText('0');
    await confirm.click();
    await close.click();
    await expect(counter).toHaveText('2');

    await disabled.click({ force: true });
    await expect(counter).toHaveText('2');
  });

  test('headings expose role=heading with the correct aria-level', async ({ page }) => {
    const cases = [
      { id: 'heading-page', level: '1' },
      { id: 'heading-section', level: '2' },
      { id: 'heading-sub', level: '3' },
    ];
    for (const { id, level } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('role', 'heading');
      await expect(host).toHaveAttribute('aria-level', level);
    }
  });

  test('text variants reflect as attributes and render content', async ({ page }) => {
    const cases = [
      { id: 'text-body', variant: 'body' },
      { id: 'text-body-sm', variant: 'body-sm' },
      { id: 'text-caption', variant: 'caption' },
      { id: 'text-emphasis', variant: 'emphasis' },
    ];
    for (const { id, variant } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('variant', variant);
      await expect(host).toBeVisible();
    }
  });

  test('stack spaces reflect as attributes and lay out children', async ({ page }) => {
    const cases = [
      { id: 'stack-xs', space: 'xs' },
      { id: 'stack-sm', space: 'sm' },
      { id: 'stack-md', space: 'md' },
      { id: 'stack-lg', space: 'lg' },
    ];
    for (const { id, space } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('space', space);
      await expect(host).toBeVisible();
    }
  });

  test('cluster spaces reflect as attributes and lay out children', async ({ page }) => {
    const cases = [
      { id: 'cluster-xs', space: 'xs' },
      { id: 'cluster-sm', space: 'sm' },
      { id: 'cluster-md', space: 'md' },
      { id: 'cluster-lg', space: 'lg' },
    ];
    for (const { id, space } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('space', space);
      await expect(host).toBeVisible();
    }
  });

  test('inset spaces reflect as attributes and render content', async ({ page }) => {
    const cases = [
      { id: 'inset-sm', space: 'sm' },
      { id: 'inset-md', space: 'md' },
      { id: 'inset-lg', space: 'lg' },
    ];
    for (const { id, space } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('space', space);
      await expect(host).toBeVisible();
    }
  });

  test('dividers expose role=separator with the right aria-orientation', async ({ page }) => {
    const horizontal = page.locator('[data-testid="divider-horizontal"]');
    await expect(horizontal).toHaveAttribute('role', 'separator');
    await expect(horizontal).not.toHaveAttribute('aria-orientation', /.+/);

    const vertical = page.locator('[data-testid="divider-vertical"]');
    await expect(vertical).toHaveAttribute('role', 'separator');
    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
  });

  test('badge variants reflect as attributes and render content', async ({ page }) => {
    const cases = [
      { id: 'badge-neutral', variant: 'neutral' },
      { id: 'badge-info', variant: 'info' },
      { id: 'badge-success', variant: 'success' },
      { id: 'badge-warning', variant: 'warning' },
      { id: 'badge-danger', variant: 'danger' },
    ];
    for (const { id, variant } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('variant', variant);
      await expect(host).toBeVisible();
    }
  });

  test('alerts expose the right live-region role per variant', async ({ page }) => {
    const cases = [
      { id: 'alert-info', variant: 'info', role: 'status', hasTitle: true },
      { id: 'alert-warning', variant: 'warning', role: 'alert', hasTitle: false },
      { id: 'alert-danger', variant: 'danger', role: 'alert', hasTitle: true },
    ];
    for (const { id, variant, role, hasTitle } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('variant', variant);
      await expect(host).toHaveAttribute('role', role);
      if (hasTitle) {
        await expect(host).toHaveAttribute('has-title', '');
      } else {
        await expect(host).not.toHaveAttribute('has-title', /.*/);
      }
    }
  });

  test('required text field blocks form submission when empty', async ({ page }) => {
    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toBeEmpty();
    await page.locator('[data-testid="form-submit"]').click();
    await expect(output).toBeEmpty();
  });

  test('filling required fields then submitting renders the FormData as JSON', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('ada@example.com');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('ada');
    await page.locator('[data-testid="form-submit"]').click();

    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toContainText('"email":"ada@example.com"');
    await expect(output).toContainText('"username":"ada"');
  });

  test('text field reflects invalid when a constraint fails and clears when satisfied', async ({ page }) => {
    const tf = page.locator('[data-testid="tf-username"]');
    const input = tf.locator('input');

    await input.fill('ab');
    await input.blur();
    await expect(tf).toHaveAttribute('invalid', '');

    await input.fill('abc');
    await expect(tf).not.toHaveAttribute('invalid', /.*/);
  });
});
