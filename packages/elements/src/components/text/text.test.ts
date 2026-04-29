import { afterEach, describe, expect, it } from 'vitest';
import { FoundryText } from './text.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-text-test-${++counter}`;
  class Sub extends FoundryText {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryText.define', () => {
  it('registers the given tag with FoundryText', () => {
    const tag = `foundry-text-define-${++counter}`;
    FoundryText.define(tag);
    expect(customElements.get(tag)).toBe(FoundryText);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-text-noop-${++counter}`;
    class Existing extends FoundryText {}
    customElements.define(tag, Existing);

    expect(() => FoundryText.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryText variant', () => {
  it('defaults to variant="body" on connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('body');
  });

  it('preserves an explicit variant attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'caption');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('caption');
  });

  it('reflects the variant property to the attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryText & { variant: string };
    document.body.appendChild(el);

    el.variant = 'emphasis';
    expect(el.getAttribute('variant')).toBe('emphasis');
  });

  it('falls back to "body" when the variant attribute is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'caption');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('caption');

    el.removeAttribute('variant');
    expect(el.getAttribute('variant')).toBe('body');
  });
});

describe('FoundryText slotting', () => {
  it('passes children through to the default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Hello world';
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot).not.toBeNull();
    const assigned = slot?.assignedNodes({ flatten: true });
    expect(assigned?.[0]?.textContent).toBe('Hello world');
  });
});

describe('FoundryText propertyChanged filter', () => {
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
