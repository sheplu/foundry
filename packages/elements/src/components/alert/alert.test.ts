import { afterEach, describe, expect, it } from 'vitest';
import { FoundryAlert } from './alert.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-alert-test-${++counter}`;
  class Sub extends FoundryAlert {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryAlert.define', () => {
  it('registers the given tag with FoundryAlert', () => {
    const tag = `foundry-alert-define-${++counter}`;
    FoundryAlert.define(tag);
    expect(customElements.get(tag)).toBe(FoundryAlert);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-alert-noop-${++counter}`;
    class Existing extends FoundryAlert {}
    customElements.define(tag, Existing);

    expect(() => FoundryAlert.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryAlert variant + role', () => {
  it('defaults to variant="info" on connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('info');
  });

  it('sets role="status" for info / success / neutral', () => {
    for (const variant of ['info', 'success', 'neutral'] as const) {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('variant', variant);
      document.body.appendChild(el);
      expect(el.getAttribute('role')).toBe('status');
    }
  });

  it('sets role="alert" for warning / danger', () => {
    for (const variant of ['warning', 'danger'] as const) {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag);
      el.setAttribute('variant', variant);
      document.body.appendChild(el);
      expect(el.getAttribute('role')).toBe('alert');
    }
  });

  it('updates role when variant changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAlert & { variant: string };
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('status');

    el.variant = 'danger';
    expect(el.getAttribute('role')).toBe('alert');

    el.variant = 'success';
    expect(el.getAttribute('role')).toBe('status');
  });

  it('reflects the variant property to the attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAlert & { variant: string };
    document.body.appendChild(el);

    el.variant = 'warning';
    expect(el.getAttribute('variant')).toBe('warning');
  });

  it('falls back to "info" when the variant attribute is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'danger');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('danger');

    el.removeAttribute('variant');
    expect(el.getAttribute('variant')).toBe('info');
  });
});

describe('FoundryAlert title slot', () => {
  it('does not set has-title when title slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'body only';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-title')).toBe(false);
  });

  it('sets has-title when an element is assigned to the title slot', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="title">Heads up</span>body';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-title')).toBe(true);
  });

  it('removes has-title when the title slot content is removed', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    const title = document.createElement('span');
    title.setAttribute('slot', 'title');
    title.textContent = 'Heads up';
    el.appendChild(title);
    el.appendChild(document.createTextNode('body'));
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-title')).toBe(true);

    title.remove();
    await raf();
    expect(el.hasAttribute('has-title')).toBe(false);
  });
});

describe('FoundryAlert slotting', () => {
  it('renders both title and body slots', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="title">Title text</span>Body text';
    document.body.appendChild(el);
    await raf();

    const titleSlot = el.shadowRoot?.querySelector('slot[name="title"]') as HTMLSlotElement | null;
    const bodySlot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    expect(titleSlot?.assignedElements()[0]?.textContent).toBe('Title text');
    expect(bodySlot?.assignedNodes()[0]?.textContent).toBe('Body text');
  });
});
