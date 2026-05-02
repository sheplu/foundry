import { afterEach, describe, expect, it } from 'vitest';
import { FoundrySpinner } from './spinner.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-spinner-test-${++counter}`;
  class Sub extends FoundrySpinner {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundrySpinner.define', () => {
  it('registers the given tag', () => {
    const name = `foundry-spinner-define-${++counter}`;
    FoundrySpinner.define(name);
    expect(customElements.get(name)).toBe(FoundrySpinner);
  });

  it('does not re-register an existing tag', () => {
    const name = `foundry-spinner-noop-${++counter}`;
    class Existing extends FoundrySpinner {}
    customElements.define(name, Existing);

    expect(() => FoundrySpinner.define(name)).not.toThrow();
    expect(customElements.get(name)).toBe(Existing);
  });
});

describe('FoundrySpinner defaults', () => {
  it('defaults size to "md"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('md');
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

describe('FoundrySpinner size variants', () => {
  it('respects a pre-set size attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('size', 'lg');
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('lg');
  });

  it('reflects size changes via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySpinner & { size: string };
    document.body.appendChild(el);
    el.size = 'sm';
    expect(el.getAttribute('size')).toBe('sm');
  });

  it('lets raw string attributes pass through without validation', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('size', 'xxl');
    document.body.appendChild(el);
    // No enum guard; the attribute is a straight reflection.
    expect(el.getAttribute('size')).toBe('xxl');
  });
});

describe('FoundrySpinner label / aria', () => {
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
    const el = document.createElement(tag) as FoundrySpinner & { label: string };
    document.body.appendChild(el);

    el.label = 'Fetching data';
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-label')).toBe('Fetching data');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('updates aria-label when label changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySpinner & { label: string };
    el.setAttribute('label', 'One');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('One');

    el.label = 'Two';
    expect(el.getAttribute('aria-label')).toBe('Two');
  });

  it('returns to decorative when label is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySpinner & { label: string };
    el.setAttribute('label', 'Loading');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('status');

    el.label = '';
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects the exact label string (no prefix/suffix)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('label', 'Saving your profile…');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Saving your profile…');
  });
});

describe('FoundrySpinner rendering', () => {
  it('renders an <svg> with two <circle> elements (track + arc)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const svg = el.shadowRoot?.querySelector('svg');
    expect(svg).toBeTruthy();

    const track = el.shadowRoot?.querySelector('[part="track"]');
    const arc = el.shadowRoot?.querySelector('[part="arc"]');
    expect(track?.tagName.toLowerCase()).toBe('circle');
    expect(arc?.tagName.toLowerCase()).toBe('circle');
  });
});

describe('FoundrySpinner propertyChanged filter', () => {
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
