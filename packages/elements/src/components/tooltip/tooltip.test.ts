import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundryTooltip } from './tooltip.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-tooltip-test-${++counter}`;
  class Sub extends FoundryTooltip {}
  customElements.define(tag, Sub);
  return { tag };
}

// NOTE: we deliberately avoid `raf()` in these tests because we install fake
// timers (so delayed show/hide can be advanced synchronously) and `rAF` in
// jsdom queues against the same timer pool. Tests that need async slot
// resolution microtasks use `Promise.resolve()` instead.

function mountWithTrigger(tag: string): {
  host: FoundryTooltip;
  trigger: HTMLButtonElement;
} {
  const host = document.createElement(tag) as FoundryTooltip;
  const trigger = document.createElement('button');
  trigger.textContent = 'hover me';
  host.appendChild(trigger);
  const content = document.createElement('span');
  content.setAttribute('slot', 'content');
  content.textContent = 'tip';
  host.appendChild(content);
  document.body.appendChild(host);
  return { host, trigger };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('FoundryTooltip.define', () => {
  it('registers the given tag', () => {
    const name = `foundry-tooltip-define-${++counter}`;
    FoundryTooltip.define(name);
    expect(customElements.get(name)).toBe(FoundryTooltip);
  });

  it('does not re-register an existing tag', () => {
    const name = `foundry-tooltip-noop-${++counter}`;
    class Existing extends FoundryTooltip {}
    customElements.define(name, Existing);

    expect(() => FoundryTooltip.define(name)).not.toThrow();
    expect(customElements.get(name)).toBe(Existing);
  });
});

describe('FoundryTooltip defaults', () => {
  it('defaults placement to "top" and open to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('placement')).toBe('top');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('renders a surface with role="tooltip" and popover="manual"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const surface = el.shadowRoot?.querySelector('[part="surface"]');
    expect(surface?.getAttribute('role')).toBe('tooltip');
    expect(surface?.getAttribute('popover')).toBe('manual');
  });
});

describe('FoundryTooltip trigger resolution', () => {
  it('wires listeners to the first slotted element', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(300);
    expect(host.hasAttribute('open')).toBe(true);
  });

  it('gracefully no-ops when no trigger is slotted', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTooltip;
    document.body.appendChild(el);
    await Promise.resolve();
    // No trigger; advancing timers should not throw or open anything.
    vi.advanceTimersByTime(1000);
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('re-resolves the trigger on slotchange', async () => {
    const { tag } = uniqueSubclass();
    const { host } = mountWithTrigger(tag);
    await Promise.resolve();

    // Swap the trigger for a new one.
    host.innerHTML = '';
    const newTrigger = document.createElement('button');
    host.appendChild(newTrigger);
    const content = document.createElement('span');
    content.setAttribute('slot', 'content');
    host.appendChild(content);
    // Let slotchange flush.
    await Promise.resolve();

    newTrigger.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(300);
    expect(host.hasAttribute('open')).toBe(true);
  });
});

describe('FoundryTooltip show/hide', () => {
  it('pointerenter shows after delay-show', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('pointerenter'));
    expect(host.hasAttribute('open')).toBe(false);
    vi.advanceTimersByTime(299);
    expect(host.hasAttribute('open')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(host.hasAttribute('open')).toBe(true);
  });

  it('pointerleave before delay-show cancels the pending show', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(100);
    trigger.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(1000);
    expect(host.hasAttribute('open')).toBe(false);
  });

  it('focusin shows immediately (no delay)', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('focusin'));
    expect(host.hasAttribute('open')).toBe(true);
  });

  it('focusout hides', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('focusin'));
    expect(host.hasAttribute('open')).toBe(true);

    trigger.dispatchEvent(new Event('focusout'));
    expect(host.hasAttribute('open')).toBe(false);
  });

  it('pointerleave after show hides', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(300);
    expect(host.hasAttribute('open')).toBe(true);

    trigger.dispatchEvent(new Event('pointerleave'));
    expect(host.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryTooltip aria-describedby round-trip', () => {
  it('sets aria-describedby on trigger when shown; removes on hide', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('focusin'));
    const described = trigger.getAttribute('aria-describedby');
    expect(described).toBeTruthy();
    // The surface's id is the value of aria-describedby.
    const surface = host.shadowRoot?.querySelector('[part="surface"]');
    expect(surface?.id).toBe(described);

    trigger.dispatchEvent(new Event('focusout'));
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('FoundryTooltip placement', () => {
  it('reflects placement changes via property', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTooltip & { placement: string };
    document.body.appendChild(el);
    await Promise.resolve();

    el.placement = 'bottom';
    expect(el.getAttribute('placement')).toBe('bottom');
  });

  it('respects a pre-set placement attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('placement', 'right');
    document.body.appendChild(el);
    expect(el.getAttribute('placement')).toBe('right');
  });
});

describe('FoundryTooltip delay coercion', () => {
  it('reads delay-show from the attribute as a number', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTooltip;
    el.setAttribute('delay-show', '100');
    const trigger = document.createElement('button');
    el.appendChild(trigger);
    document.body.appendChild(el);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(99);
    expect(el.hasAttribute('open')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('falls back to 300 when delay-show is non-numeric', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTooltip;
    el.setAttribute('delay-show', 'bogus');
    const trigger = document.createElement('button');
    el.appendChild(trigger);
    document.body.appendChild(el);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(299);
    expect(el.hasAttribute('open')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(el.hasAttribute('open')).toBe(true);
  });
});

describe('FoundryTooltip propertyChanged filter', () => {
  it('ignores unknown property names', async () => {
    const { tag } = uniqueSubclass();
    const { host } = mountWithTrigger(tag);
    await Promise.resolve();
    const before = host.hasAttribute('open');

    (host as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(host.hasAttribute('open')).toBe(before);
  });
});

describe('FoundryTooltip delay-hide', () => {
  it('delays hide when delay-hide is set, and can be canceled by re-entering', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTooltip;
    el.setAttribute('delay-show', '0');
    el.setAttribute('delay-hide', '100');
    const trigger = document.createElement('button');
    el.appendChild(trigger);
    document.body.appendChild(el);
    await Promise.resolve();

    // Open then schedule a delayed hide.
    trigger.dispatchEvent(new Event('focusin'));
    expect(el.hasAttribute('open')).toBe(true);
    trigger.dispatchEvent(new Event('focusout'));
    // Still open — the hide is pending.
    expect(el.hasAttribute('open')).toBe(true);

    // Re-enter before the hide timer fires: cancels it (exercises the
    // #hideTimer branch of #clearTimers).
    trigger.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(200);
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('fires the hide after delay-hide elapses', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTooltip;
    el.setAttribute('delay-show', '0');
    el.setAttribute('delay-hide', '50');
    const trigger = document.createElement('button');
    el.appendChild(trigger);
    document.body.appendChild(el);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('focusin'));
    trigger.dispatchEvent(new Event('focusout'));
    vi.advanceTimersByTime(50);
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryTooltip disconnect cleanup', () => {
  it('detaches listeners + clears timers when removed from the DOM', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    await Promise.resolve();

    trigger.dispatchEvent(new Event('pointerenter'));
    host.remove();
    vi.advanceTimersByTime(1000);
    // The host is disconnected; no throw, no open-flag change.
    expect(host.hasAttribute('open')).toBe(false);
  });
});
