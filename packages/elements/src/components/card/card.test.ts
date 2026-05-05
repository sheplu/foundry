import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryCard } from './card.ts';

beforeAll(() => {
  FoundryCard.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-card-test-${++counter}`;
  class Sub extends FoundryCard {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryCard.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-card')).toBe(FoundryCard);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-card-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryCard.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryCard defaults + template wiring', () => {
  it('reflects variant="outlined" by default after connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('outlined');
  });

  it('renders card / header / media / body / footer parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const root = el.shadowRoot;
    expect(root?.querySelector('[part="card"]')).toBeTruthy();
    expect(root?.querySelector('[part="header"]')).toBeTruthy();
    expect(root?.querySelector('[part="media"]')).toBeTruthy();
    expect(root?.querySelector('[part="body"]')).toBeTruthy();
    expect(root?.querySelector('[part="footer"]')).toBeTruthy();
  });

  it('renders the default slot for body content', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const defaultSlot = el.shadowRoot?.querySelector('[part="body"] slot:not([name])');
    expect(defaultSlot).toBeTruthy();
  });
});

describe('FoundryCard variant reflection', () => {
  it('reflects an explicit outlined variant', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'outlined');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('outlined');
  });

  it('reflects elevated variant', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryCard & { variant: string };
    document.body.appendChild(el);
    el.variant = 'elevated';
    expect(el.getAttribute('variant')).toBe('elevated');
  });

  it('switching variant at runtime updates the attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryCard & { variant: string };
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('outlined');
    el.variant = 'elevated';
    expect(el.getAttribute('variant')).toBe('elevated');
    el.variant = 'outlined';
    expect(el.getAttribute('variant')).toBe('outlined');
  });
});

describe('FoundryCard slot-content reflection', () => {
  it('reflects has-header when header slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="header">Title</span>Body';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-header')).toBe(true);
  });

  it('does not set has-header when header slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Body only';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-header')).toBe(false);
  });

  it('toggles has-header when header content is added at runtime', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-header')).toBe(false);
    const header = document.createElement('span');
    header.setAttribute('slot', 'header');
    header.textContent = 'Added';
    el.appendChild(header);
    await raf();
    expect(el.hasAttribute('has-header')).toBe(true);
  });

  it('reflects has-media when media slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<img slot="media" src="" alt="" />Body';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-media')).toBe(true);
  });

  it('does not set has-media when media slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Body';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-media')).toBe(false);
  });

  it('reflects has-footer when footer slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = 'Body<div slot="footer">Actions</div>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-footer')).toBe(true);
  });

  it('does not set has-footer when footer slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Body';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-footer')).toBe(false);
  });

  it('never sets a has-body attribute regardless of default-slot content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="header">H</span>Body<div slot="footer">F</div>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-body')).toBe(false);
  });
});

describe('FoundryCard propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('variant');
    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);
    expect(el.getAttribute('variant')).toBe(before);
  });
});
