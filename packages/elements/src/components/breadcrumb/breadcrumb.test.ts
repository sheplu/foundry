import { afterEach, describe, expect, it } from 'vitest';
import { FoundryBreadcrumb } from './breadcrumb.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-breadcrumb-test-${++counter}`;
  class Sub extends FoundryBreadcrumb {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryBreadcrumb.define', () => {
  it('registers the given tag', () => {
    const tag = `foundry-breadcrumb-define-${++counter}`;
    FoundryBreadcrumb.define(tag);
    expect(customElements.get(tag)).toBe(FoundryBreadcrumb);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-breadcrumb-noop-${++counter}`;
    class Existing extends FoundryBreadcrumb {}
    customElements.define(tag, Existing);

    expect(() => FoundryBreadcrumb.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryBreadcrumb rendering', () => {
  it('renders item, content, and separator parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Home';
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector('[part="item"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="content"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="separator"]')).toBeTruthy();
  });

  it('sets role="listitem" on the host for assistive-tech list semantics', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('listitem');
  });

  it('separator slot has fallback "/" content', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot[name="separator"]') as HTMLSlotElement;
    // Fallback content is the text node "/".
    expect(slot?.textContent?.trim()).toBe('/');
  });

  it('renders children via the default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span>Docs</span>';
    document.body.appendChild(el);

    const defaultSlot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement;
    const assigned = defaultSlot?.assignedNodes({ flatten: true }) ?? [];
    expect(assigned.length).toBe(1);
  });
});

describe('FoundryBreadcrumb current attribute', () => {
  it('sets aria-current="page" when current is true (via attribute)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('current', '');
    document.body.appendChild(el);

    expect(el.getAttribute('aria-current')).toBe('page');
  });

  it('sets aria-current="page" when current is set via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryBreadcrumb & { current: boolean };
    document.body.appendChild(el);
    expect(el.hasAttribute('aria-current')).toBe(false);

    el.current = true;
    expect(el.getAttribute('aria-current')).toBe('page');
  });

  it('removes aria-current when current is cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryBreadcrumb & { current: boolean };
    el.setAttribute('current', '');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-current')).toBe('page');

    el.current = false;
    expect(el.hasAttribute('aria-current')).toBe(false);
  });
});

describe('FoundryBreadcrumb separator slot introspection', () => {
  it('reflects has-separator=true by default (fallback / is used)', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-separator')).toBe(true);
  });

  it('reflects has-separator=true when a custom separator is slotted', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="separator">›</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-separator')).toBe(true);
  });
});

describe('FoundryBreadcrumb propertyChanged filter', () => {
  it('ignores property names outside "current"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const beforeAriaCurrent = el.getAttribute('aria-current');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(el.getAttribute('aria-current')).toBe(beforeAriaCurrent);
  });
});
