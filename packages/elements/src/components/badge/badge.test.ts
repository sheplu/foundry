import { afterEach, describe, expect, it } from 'vitest';
import { FoundryBadge } from './badge.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-badge-test-${++counter}`;
  class Sub extends FoundryBadge {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryBadge.define', () => {
  it('registers the given tag with FoundryBadge', () => {
    const tag = `foundry-badge-define-${++counter}`;
    FoundryBadge.define(tag);
    expect(customElements.get(tag)).toBe(FoundryBadge);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-badge-noop-${++counter}`;
    class Existing extends FoundryBadge {}
    customElements.define(tag, Existing);

    expect(() => FoundryBadge.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryBadge variant', () => {
  it('defaults to variant="neutral" on connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('neutral');
  });

  it('preserves an explicit variant attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'success');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('success');
  });

  it('reflects the variant property to the attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryBadge & { variant: string };
    document.body.appendChild(el);

    el.variant = 'danger';
    expect(el.getAttribute('variant')).toBe('danger');
  });

  it('falls back to "neutral" when the variant attribute is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'warning');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('warning');

    el.removeAttribute('variant');
    expect(el.getAttribute('variant')).toBe('neutral');
  });
});

describe('FoundryBadge slotting', () => {
  it('passes children through to the default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'new';
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot).not.toBeNull();
    const assigned = slot?.assignedNodes({ flatten: true });
    expect(assigned?.[0]?.textContent).toBe('new');
  });
});

describe('FoundryBadge propertyChanged filter', () => {
  it('ignores unknown property names without changing the variant attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('variant');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unknown', null, 'x');

    expect(el.getAttribute('variant')).toBe(before);
  });
});
