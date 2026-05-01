import { expect, test } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:5173' });

test.describe('React canary — reference screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
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

    // Label must surface on the inner native button as aria-label.
    const ariaLabel = await confirm.evaluate((el) =>
      el.shadowRoot?.querySelector('button')?.getAttribute('aria-label'),
    );
    expect(ariaLabel).toBe('Confirm');

    await expect(counter).toHaveText('0');
    await confirm.click();
    await close.click();
    await expect(counter).toHaveText('2');

    // Disabled icon button must not increment.
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
    // Still empty — HTML constraint validation blocks submit.
    await expect(output).toBeEmpty();
  });

  test('filling required fields then submitting renders the FormData as JSON', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('ada@example.com');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('ada');
    await page.locator('[data-testid="tf-bio"]').locator('textarea').fill('Multi-line\nbio text.');
    // Check the subscribe checkbox → should surface in the submitted JSON.
    await page.locator('[data-testid="cb-subscribe"]').locator('[part="box"]').click();
    // Toggle the notifications switch on → should surface in the submitted JSON.
    await page.locator('[data-testid="sw-notifications"]').locator('[part="track"]').click();
    await page.locator('[data-testid="form-submit"]').click();

    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toContainText('"email":"ada@example.com"');
    await expect(output).toContainText('"username":"ada"');
    await expect(output).toContainText('"bio":"Multi-line\\nbio text."');
    await expect(output).toContainText('"subscribe":"weekly"');
    await expect(output).toContainText('"notifications":"on"');
    // Radio group is pre-seeded with `free` checked; plan surfaces automatically.
    await expect(output).toContainText('"plan":"free"');
  });

  test('unchecked switch is omitted from the submitted FormData', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('a@b.c');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('abc');
    // Deliberately don't toggle the switch.
    await page.locator('[data-testid="form-submit"]').click();

    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toContainText('"email":"a@b.c"');
    await expect(output).not.toContainText('notifications');
  });

  test('clicking the slotted switch label toggles it (nested-label pattern)', async ({ page }) => {
    const sw = page.locator('[data-testid="sw-notifications"]');
    await expect(sw).not.toHaveAttribute('checked', /.*/);

    await sw.locator('span[slot="label"]').click();
    await expect(sw).toHaveAttribute('checked', '');

    await sw.locator('span[slot="label"]').click();
    await expect(sw).not.toHaveAttribute('checked', /.*/);
  });

  test('unchecked checkbox is omitted from the submitted FormData', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('a@b.c');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('abc');
    // Deliberately don't click the checkbox.
    await page.locator('[data-testid="form-submit"]').click();

    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toContainText('"email":"a@b.c"');
    // The "subscribe" key must NOT be present in the output JSON.
    await expect(output).not.toContainText('subscribe');
  });

  test('clicking the slotted checkbox label toggles the checkbox (nested-label pattern)', async ({ page }) => {
    const cb = page.locator('[data-testid="cb-subscribe"]');
    await expect(cb).not.toHaveAttribute('checked', /.*/);

    // The slotted <span slot="label"> is in the light DOM; click it.
    await cb.locator('span[slot="label"]').click();
    await expect(cb).toHaveAttribute('checked', '');

    await cb.locator('span[slot="label"]').click();
    await expect(cb).not.toHaveAttribute('checked', /.*/);
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

  test('textarea round-trips multi-line content through form submission', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('a@b.c');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('abc');
    const ta = page.locator('[data-testid="tf-bio"]').locator('textarea');
    await ta.fill('line one\nline two\nline three');
    await page.locator('[data-testid="form-submit"]').click();

    const output = page.locator('[data-testid="form-output"]');
    // JSON escapes newlines as \n — contains the multi-line value serialised.
    await expect(output).toContainText('"bio":"line one\\nline two\\nline three"');
  });

  test('clicking a different radio in the plan group changes the submitted value', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('a@b.c');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('abc');
    // Click the Pro radio's visual box.
    await page.locator('[data-testid="rd-plan-pro"]').locator('[part="box"]').click();
    await page.locator('[data-testid="form-submit"]').click();

    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toContainText('"plan":"pro"');
    // Exactly one plan value should be submitted.
    await expect(output).not.toContainText('"plan":"free"');
  });

  test('exactly one radio per group is checked at a time', async ({ page }) => {
    const free = page.locator('[data-testid="rd-plan-free"]');
    const pro = page.locator('[data-testid="rd-plan-pro"]');
    const enterprise = page.locator('[data-testid="rd-plan-enterprise"]');

    // Free is pre-checked.
    await expect(free).toHaveAttribute('checked', '');
    await expect(pro).not.toHaveAttribute('checked', /.*/);
    await expect(enterprise).not.toHaveAttribute('checked', /.*/);

    await pro.locator('[part="box"]').click();
    await expect(free).not.toHaveAttribute('checked', /.*/);
    await expect(pro).toHaveAttribute('checked', '');
    await expect(enterprise).not.toHaveAttribute('checked', /.*/);

    await enterprise.locator('[part="box"]').click();
    await expect(free).not.toHaveAttribute('checked', /.*/);
    await expect(pro).not.toHaveAttribute('checked', /.*/);
    await expect(enterprise).toHaveAttribute('checked', '');
  });

  test('ArrowDown on a focused radio moves focus + selection to the next sibling', async ({ page }) => {
    const free = page.locator('[data-testid="rd-plan-free"]');
    const pro = page.locator('[data-testid="rd-plan-pro"]');

    // Focus the pre-checked radio (free), then press ArrowDown.
    await free.locator('input').focus();
    await page.keyboard.press('ArrowDown');

    // Selection moved to Pro.
    await expect(pro).toHaveAttribute('checked', '');
    await expect(free).not.toHaveAttribute('checked', /.*/);
  });
});
