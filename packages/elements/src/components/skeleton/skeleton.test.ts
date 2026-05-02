import { afterEach, describe, expect, it } from 'vitest';
import { FoundrySkeleton } from './skeleton.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-skeleton-test-${++counter}`;
  class Sub extends FoundrySkeleton {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundrySkeleton.define', () => {
  it('registers the given tag', () => {
    const name = `foundry-skeleton-define-${++counter}`;
    FoundrySkeleton.define(name);
    expect(customElements.get(name)).toBe(FoundrySkeleton);
  });

  it('does not re-register an existing tag', () => {
    const name = `foundry-skeleton-noop-${++counter}`;
    class Existing extends FoundrySkeleton {}
    customElements.define(name, Existing);

    expect(() => FoundrySkeleton.define(name)).not.toThrow();
    expect(customElements.get(name)).toBe(Existing);
  });
});

describe('FoundrySkeleton defaults', () => {
  it('defaults shape to "text"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('shape')).toBe('text');
  });

  it('is decorative by default (aria-hidden, no role, no aria-label)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });
});

describe('FoundrySkeleton shape', () => {
  it('respects a pre-set shape attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('shape', 'circle');
    document.body.appendChild(el);
    expect(el.getAttribute('shape')).toBe('circle');
  });

  it('reflects shape changes via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySkeleton & { shape: string };
    document.body.appendChild(el);
    el.shape = 'rect';
    expect(el.getAttribute('shape')).toBe('rect');
  });

  it('lets raw string attributes pass through without validation', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('shape', 'bogus');
    document.body.appendChild(el);
    expect(el.getAttribute('shape')).toBe('bogus');
  });
});

describe('FoundrySkeleton label / aria', () => {
  it('sets role="status" + aria-label when label is set (attribute)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('label', 'Loading');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-label')).toBe('Loading');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('sets role="status" + aria-label when label is set (property)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySkeleton & { label: string };
    document.body.appendChild(el);

    el.label = 'Fetching';
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-label')).toBe('Fetching');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('updates aria-label when label changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySkeleton & { label: string };
    el.setAttribute('label', 'One');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('One');

    el.label = 'Two';
    expect(el.getAttribute('aria-label')).toBe('Two');
  });

  it('returns to decorative when label is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySkeleton & { label: string };
    el.setAttribute('label', 'Loading');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('status');

    el.label = '';
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('FoundrySkeleton rendering', () => {
  it('renders an inner element with part="surface"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const surface = el.shadowRoot?.querySelector('[part="surface"]');
    expect(surface).toBeTruthy();
  });
});

describe('FoundrySkeleton propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('label', 'Loading');
    document.body.appendChild(el);
    const before = el.getAttribute('aria-label');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(el.getAttribute('aria-label')).toBe(before);
  });
});
