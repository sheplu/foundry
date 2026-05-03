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

  test('a loading button exposes aria-busy on the inner button and suppresses clicks', async ({ page }) => {
    const counter = page.locator('[data-testid="click-count"]');
    const loading = page.locator('[data-testid="btn-primary-loading"]');
    await expect(loading).toHaveAttribute('loading', '');

    const ariaBusy = await loading.evaluate(
      (el) => el.shadowRoot?.querySelector('button')?.getAttribute('aria-busy'),
    );
    expect(ariaBusy).toBe('true');

    await loading.click({ force: true });
    await expect(counter).toHaveText('0');
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

  test('breadcrumbs expose the semantic nav and ordered list', async ({ page }) => {
    const bc = page.locator('[data-testid="breadcrumbs"]');
    const shape = await bc.evaluate((el) => ({
      navLabel: el.shadowRoot?.querySelector('nav')?.getAttribute('aria-label'),
      hasOl: Boolean(el.shadowRoot?.querySelector('nav > ol')),
    }));
    expect(shape.navLabel).toBe('Breadcrumb');
    expect(shape.hasOl).toBe(true);
  });

  test('current breadcrumb reflects aria-current="page" on its host', async ({ page }) => {
    const current = page.locator('[data-testid="bc-current"]');
    await expect(current).toHaveAttribute('aria-current', 'page');
  });

  test('the last breadcrumb hides its separator via CSS', async ({ page }) => {
    const current = page.locator('[data-testid="bc-current"]');
    const display = await current.evaluate((el) => {
      const sep = el.shadowRoot?.querySelector('[part="separator"]');
      return sep ? getComputedStyle(sep).display : null;
    });
    expect(display).toBe('none');
  });

  test('nested foundry-link inside a breadcrumb is rendered with correct href', async ({ page }) => {
    const home = page.locator('[data-testid="bc-home"]').locator('foundry-link');
    const href = await home.evaluate(
      (el) => el.shadowRoot?.querySelector('a')?.getAttribute('href'),
    );
    expect(href).toBe('/');
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

  test('loading icon-button swaps the icon for a spinner, carries aria-busy, and suppresses clicks', async ({ page }) => {
    const loading = page.locator('[data-testid="iconbtn-loading"]');
    const counter = page.locator('[data-testid="click-count"]');

    await expect(loading).toHaveAttribute('loading', '');

    const state = await loading.evaluate((el) => {
      const inner = el.shadowRoot?.querySelector('button');
      const icon = el.shadowRoot?.querySelector('foundry-icon');
      const spinner = el.shadowRoot?.querySelector('foundry-spinner');
      return {
        ariaBusy: inner?.getAttribute('aria-busy'),
        innerDisabled: inner?.disabled,
        iconDisplay: icon ? getComputedStyle(icon).display : null,
        spinnerDisplay: spinner ? getComputedStyle(spinner).display : null,
      };
    });
    expect(state.ariaBusy).toBe('true');
    expect(state.innerDisabled).toBe(true);
    expect(state.iconDisplay).toBe('none');
    expect(state.spinnerDisplay).not.toBe('none');

    const counterBefore = await counter.textContent();
    await loading.click({ force: true });
    await expect(counter).toHaveText(counterBefore ?? '0');
  });

  test('tooltip shows on focus, wires aria-describedby, hides on blur', async ({ page }) => {
    const host = page.locator('[data-testid="tooltip-top"]');
    const trigger = page.locator('[data-testid="tooltip-top-trigger"]');

    await trigger.focus();
    await expect(host).toHaveAttribute('open', '');

    const relationship = await host.evaluate((el) => {
      const surface = el.shadowRoot?.querySelector('[part="surface"]');
      const inner = el.querySelector('[data-testid="tooltip-top-trigger"]');
      return {
        surfaceId: surface?.id,
        describedBy: inner?.getAttribute('aria-describedby'),
      };
    });
    expect(relationship.surfaceId).toBeTruthy();
    expect(relationship.describedBy).toBe(relationship.surfaceId);

    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await expect(host).not.toHaveAttribute('open', /.*/);
  });

  test('tooltip surface has role="tooltip" and popover="manual"', async ({ page }) => {
    const host = page.locator('[data-testid="tooltip-bottom"]');
    const shape = await host.evaluate((el) => {
      const surface = el.shadowRoot?.querySelector('[part="surface"]');
      return {
        role: surface?.getAttribute('role'),
        popover: surface?.getAttribute('popover'),
      };
    });
    expect(shape.role).toBe('tooltip');
    expect(shape.popover).toBe('manual');
  });

  test('popover opens on trigger click and flips aria-expanded', async ({ page }) => {
    const host = page.locator('[data-testid="popover-default"]');
    const trigger = page.locator('[data-testid="popover-trigger"]');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(host).toHaveAttribute('open', '');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  test('popover closes on Escape (light-dismiss via popover="auto")', async ({ page }) => {
    const host = page.locator('[data-testid="popover-default"]');
    const trigger = page.locator('[data-testid="popover-trigger"]');

    await trigger.click();
    await expect(host).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(host).not.toHaveAttribute('open', /.*/);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  test('popover surface has role="dialog" and popover="auto"', async ({ page }) => {
    const host = page.locator('[data-testid="popover-default"]');
    const shape = await host.evaluate((el) => {
      const surface = el.shadowRoot?.querySelector('[part="surface"]');
      return {
        role: surface?.getAttribute('role'),
        popover: surface?.getAttribute('popover'),
      };
    });
    expect(shape.role).toBe('dialog');
    expect(shape.popover).toBe('auto');
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

  test('link variants reflect as attributes and render an inner <a>', async ({ page }) => {
    const cases = [
      { id: 'link-inline', variant: 'inline', href: '/docs' },
      { id: 'link-standalone', variant: 'standalone', href: '/nav' },
      { id: 'link-external', variant: 'inline', href: 'https://example.com' },
    ];
    for (const { id, variant, href } of cases) {
      const host = page.locator(`[data-testid="${id}"]`);
      await expect(host).toHaveAttribute('variant', variant);
      await expect(host).toBeVisible();
      const innerHref = await host.evaluate(
        (el) => el.shadowRoot?.querySelector('a')?.getAttribute('href'),
      );
      expect(innerHref).toBe(href);
    }
  });

  test('external link auto-adds rel="noopener" on the inner <a>', async ({ page }) => {
    const external = page.locator('[data-testid="link-external"]');
    const rel = await external.evaluate(
      (el) => el.shadowRoot?.querySelector('a')?.getAttribute('rel'),
    );
    expect(rel).toBe('noopener');
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

  test('tag row renders the three tags with their attributes', async ({ page }) => {
    await expect(page.locator('[data-testid="tag-plain"]')).toBeVisible();
    const removable = page.locator('[data-testid="tag-removable"]');
    await expect(removable).toHaveAttribute('removable', '');
    await expect(removable).toHaveAttribute('value', 'design');
    const disabled = page.locator('[data-testid="tag-disabled"]');
    await expect(disabled).toHaveAttribute('disabled', '');
  });

  test('clicking close on a removable tag dispatches remove and removes the tag', async ({ page }) => {
    const log = page.locator('[data-testid="tag-remove-log"]');
    await expect(log).toHaveText('');

    const removable = page.locator('[data-testid="tag-removable"]');
    await removable.evaluate((el) => {
      el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="close"]')?.click();
    });

    await expect(log).toHaveText('design');
    await expect(page.locator('[data-testid="tag-removable"]')).toHaveCount(0);
  });

  test('disabled removable tag does not dispatch remove on close click', async ({ page }) => {
    const log = page.locator('[data-testid="tag-remove-log"]');
    const disabled = page.locator('[data-testid="tag-disabled"]');
    await disabled.evaluate((el) => {
      el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="close"]')?.click();
    });

    await expect(disabled).toBeVisible();
    await expect(log).not.toHaveText('locked');
  });

  test('avatar renders initials derived from name and sets role="img" + aria-label', async ({ page }) => {
    const av = page.locator('[data-testid="avatar-initials"]');
    await expect(av).toHaveAttribute('role', 'img');
    await expect(av).toHaveAttribute('aria-label', 'Ada Lovelace');
    const initialsText = await av.evaluate(
      (el) => el.shadowRoot?.querySelector('[part="initials"]')?.textContent?.trim(),
    );
    expect(initialsText).toBe('AL');
  });

  test('avatar with status renders the dot visibly', async ({ page }) => {
    const av = page.locator('[data-testid="avatar-status"]');
    await expect(av).toHaveAttribute('status', 'online');
    const dotDisplay = await av.evaluate((el) => {
      const dot = el.shadowRoot?.querySelector('[part="status"]');
      return dot ? getComputedStyle(dot).display : null;
    });
    expect(dotDisplay).not.toBe('none');
  });

  test('decorative avatar (no name / label) is aria-hidden', async ({ page }) => {
    const av = page.locator('[data-testid="avatar-decorative"]');
    await expect(av).toHaveAttribute('aria-hidden', 'true');
    await expect(av).not.toHaveAttribute('role', /.*/);
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

  test('spinner row exposes the right a11y state per variant', async ({ page }) => {
    const decorative = page.locator('[data-testid="spinner-default"]');
    await expect(decorative).toHaveAttribute('aria-hidden', 'true');
    await expect(decorative).not.toHaveAttribute('role', /.*/);

    const sm = page.locator('[data-testid="spinner-sm"]');
    await expect(sm).toHaveAttribute('size', 'sm');
    await expect(sm).toHaveAttribute('aria-hidden', 'true');

    const labelled = page.locator('[data-testid="spinner-labelled"]');
    await expect(labelled).toHaveAttribute('size', 'lg');
    await expect(labelled).toHaveAttribute('role', 'status');
    await expect(labelled).toHaveAttribute('aria-label', 'Loading');
    await expect(labelled).not.toHaveAttribute('aria-hidden', /.*/);
  });

  test('skeleton row exposes the right a11y state per shape', async ({ page }) => {
    const text = page.locator('[data-testid="skeleton-text"]');
    await expect(text).toHaveAttribute('shape', 'text');
    await expect(text).toHaveAttribute('aria-hidden', 'true');
    await expect(text).not.toHaveAttribute('role', /.*/);

    const circle = page.locator('[data-testid="skeleton-circle"]');
    await expect(circle).toHaveAttribute('shape', 'circle');
    await expect(circle).toHaveAttribute('aria-hidden', 'true');

    const labelled = page.locator('[data-testid="skeleton-labelled"]');
    await expect(labelled).toHaveAttribute('shape', 'rect');
    await expect(labelled).toHaveAttribute('role', 'status');
    await expect(labelled).toHaveAttribute('aria-label', 'Loading article');
    await expect(labelled).not.toHaveAttribute('aria-hidden', /.*/);
  });

  test('progress row exposes role="progressbar" + aria values per case', async ({ page }) => {
    const def = page.locator('[data-testid="progress-default"]');
    await expect(def).toHaveAttribute('role', 'progressbar');
    await expect(def).toHaveAttribute('aria-valuemin', '0');
    await expect(def).toHaveAttribute('aria-valuemax', '100');
    await expect(def).toHaveAttribute('aria-valuenow', '40');
    await expect(def).toHaveAttribute('aria-label', 'Progress');

    const success = page.locator('[data-testid="progress-success"]');
    await expect(success).toHaveAttribute('variant', 'success');
    await expect(success).toHaveAttribute('aria-valuenow', '80');

    const labelled = page.locator('[data-testid="progress-labelled"]');
    await expect(labelled).toHaveAttribute('aria-valuemax', '10');
    await expect(labelled).toHaveAttribute('aria-valuenow', '3');
    await expect(labelled).toHaveAttribute('aria-label', 'Checklist');
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
    // Select a timezone — required in Phase 1, driven via the host property.
    await page.locator('[data-testid="sel-timezone"]').evaluate((el) => {
      (el as unknown as { value: string }).value = 'utc';
    });
    await page.locator('[data-testid="form-submit"]').click();

    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toContainText('"email":"ada@example.com"');
    await expect(output).toContainText('"username":"ada"');
    await expect(output).toContainText('"bio":"Multi-line\\nbio text."');
    await expect(output).toContainText('"subscribe":"weekly"');
    await expect(output).toContainText('"notifications":"on"');
    await expect(output).toContainText('"timezone":"utc"');
    // Radio group is pre-seeded with `free` checked; plan surfaces automatically.
    await expect(output).toContainText('"plan":"free"');
  });

  test('select trigger exposes aria-haspopup="listbox" and placeholder text', async ({ page }) => {
    const sel = page.locator('[data-testid="sel-timezone"]');
    const button = sel.locator('button[part="control"]');
    await expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    await expect(sel.locator('[part="placeholder"]')).toHaveText('Select a timezone');
  });

  test('required select blocks form submission when empty', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('a@b.c');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('abc');
    // Leave timezone unset.
    await page.locator('[data-testid="form-submit"]').click();
    const output = page.locator('[data-testid="form-output"]');
    await expect(output).toBeEmpty();
    await expect(page.locator('[data-testid="sel-timezone"]')).toHaveAttribute('invalid', '');
  });

  test('programmatically setting select value updates trigger label and FormData', async ({ page }) => {
    const sel = page.locator('[data-testid="sel-timezone"]');
    await sel.evaluate((el) => {
      (el as unknown as { value: string }).value = 'est';
    });
    await expect(sel.locator('[part="value"]')).toHaveText('Eastern (EST)');

    // Fill remaining required fields so the form submits.
    await page.locator('[data-testid="tf-email"]').locator('input').fill('a@b.c');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('abc');
    await page.locator('[data-testid="form-submit"]').click();
    await expect(page.locator('[data-testid="form-output"]')).toContainText('"timezone":"est"');
  });

  test('unchecked switch is omitted from the submitted FormData', async ({ page }) => {
    await page.locator('[data-testid="tf-email"]').locator('input').fill('a@b.c');
    await page.locator('[data-testid="tf-username"]').locator('input').fill('abc');
    await page.locator('[data-testid="sel-timezone"]').evaluate((el) => {
      (el as unknown as { value: string }).value = 'utc';
    });
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
    await page.locator('[data-testid="sel-timezone"]').evaluate((el) => {
      (el as unknown as { value: string }).value = 'utc';
    });
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
    await page.locator('[data-testid="sel-timezone"]').evaluate((el) => {
      (el as unknown as { value: string }).value = 'utc';
    });
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
    await page.locator('[data-testid="sel-timezone"]').evaluate((el) => {
      (el as unknown as { value: string }).value = 'utc';
    });
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
