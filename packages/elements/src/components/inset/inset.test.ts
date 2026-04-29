import { afterEach, describe, expect, it } from 'vitest';
import { FoundryInset } from './inset.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-inset-test-${++counter}`;
  class Sub extends FoundryInset {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryInset.define', () => {
  it('registers the given tag with FoundryInset', () => {
    const tag = `foundry-inset-define-${++counter}`;
    FoundryInset.define(tag);
    expect(customElements.get(tag)).toBe(FoundryInset);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-inset-noop-${++counter}`;
    class Existing extends FoundryInset {}
    customElements.define(tag, Existing);

    expect(() => FoundryInset.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryInset space', () => {
  it('defaults to space="md" on connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('space')).toBe('md');
  });

  it('preserves an explicit space attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('space', 'lg');
    document.body.appendChild(el);
    expect(el.getAttribute('space')).toBe('lg');
  });

  it('reflects the space property to the attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryInset & { space: string };
    document.body.appendChild(el);

    el.space = 'sm';
    expect(el.getAttribute('space')).toBe('sm');
  });

  it('falls back to "md" when the space attribute is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('space', 'lg');
    document.body.appendChild(el);
    expect(el.getAttribute('space')).toBe('lg');

    el.removeAttribute('space');
    expect(el.getAttribute('space')).toBe('md');
  });
});

describe('FoundryInset slotting', () => {
  it('passes children through to the default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    const child = document.createElement('p');
    child.textContent = 'padded content';
    el.appendChild(child);
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot).not.toBeNull();
    const assigned = slot?.assignedNodes({ flatten: true });
    expect(assigned?.[0]).toBe(child);
  });
});

describe('FoundryInset propertyChanged filter', () => {
  it('ignores unknown property names without changing the space attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('space');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unknown', null, 'x');

    expect(el.getAttribute('space')).toBe(before);
  });
});
