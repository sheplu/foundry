import { afterEach, describe, expect, it } from 'vitest';
import { FoundryPopover } from './popover.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-popover-test-${++counter}`;
  class Sub extends FoundryPopover {}
  customElements.define(tag, Sub);
  return { tag };
}

function mountWithTrigger(tag: string): {
  host: FoundryPopover;
  trigger: HTMLButtonElement;
} {
  const host = document.createElement(tag) as FoundryPopover;
  const trigger = document.createElement('button');
  trigger.textContent = 'Open';
  host.appendChild(trigger);
  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.textContent = 'popover body';
  host.appendChild(content);
  document.body.appendChild(host);
  return { host, trigger };
}

function dispatchToggle(surface: HTMLElement, newState: 'open' | 'closed'): void {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', { value: newState });
  surface.dispatchEvent(event);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryPopover.define', () => {
  it('registers the given tag', () => {
    const name = `foundry-popover-define-${++counter}`;
    FoundryPopover.define(name);
    expect(customElements.get(name)).toBe(FoundryPopover);
  });

  it('does not re-register an existing tag', () => {
    const name = `foundry-popover-noop-${++counter}`;
    class Existing extends FoundryPopover {}
    customElements.define(name, Existing);

    expect(() => FoundryPopover.define(name)).not.toThrow();
    expect(customElements.get(name)).toBe(Existing);
  });
});

describe('FoundryPopover defaults', () => {
  it('defaults placement to "bottom" and open to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('placement')).toBe('bottom');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('renders a surface with role="dialog" and popover="auto"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const surface = el.shadowRoot?.querySelector('[part="surface"]');
    expect(surface?.getAttribute('role')).toBe('dialog');
    expect(surface?.getAttribute('popover')).toBe('auto');
  });
});

describe('FoundryPopover placement reflection', () => {
  it('reflects placement changes via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryPopover & { placement: string };
    document.body.appendChild(el);
    el.placement = 'top';
    expect(el.getAttribute('placement')).toBe('top');
  });
});

describe('FoundryPopover trigger wiring', () => {
  it('wires ARIA attrs on the first slotted element', () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    const surfaceId = host.shadowRoot?.querySelector('[part="surface"]')?.id;

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-controls')).toBe(surfaceId);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('no-ops gracefully when no trigger is slotted', () => {
    const { tag } = uniqueSubclass();
    const host = document.createElement(tag) as FoundryPopover;
    document.body.appendChild(host);
    // No slotted trigger; rendering should complete without throwing.
    expect(host.shadowRoot?.querySelector('[part="surface"]')).toBeTruthy();
  });

  it('removes only our-owned attrs on disconnect', async () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    // Consumer-owned attribute the wiring must NOT touch.
    trigger.setAttribute('data-consumer-flag', 'keep');

    host.remove();
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
    expect(trigger.hasAttribute('aria-expanded')).toBe(false);
    expect(trigger.getAttribute('data-consumer-flag')).toBe('keep');
  });
});

describe('FoundryPopover toggle-event sync', () => {
  it('native toggle event updates aria-expanded on the trigger (open)', () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    const surface = host.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;

    dispatchToggle(surface, 'open');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(host.hasAttribute('open')).toBe(true);
  });

  it('native toggle event updates aria-expanded on the trigger (closed)', () => {
    const { tag } = uniqueSubclass();
    const { host, trigger } = mountWithTrigger(tag);
    const surface = host.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;

    dispatchToggle(surface, 'open');
    dispatchToggle(surface, 'closed');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryPopover propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('placement');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(el.getAttribute('placement')).toBe(before);
  });
});
