import { afterEach, describe, expect, it } from 'vitest';
import { FoundryDivider } from './divider.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-divider-test-${++counter}`;
  class Sub extends FoundryDivider {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryDivider.define', () => {
  it('registers the given tag with FoundryDivider', () => {
    const tag = `foundry-divider-define-${++counter}`;
    FoundryDivider.define(tag);
    expect(customElements.get(tag)).toBe(FoundryDivider);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-divider-noop-${++counter}`;
    class Existing extends FoundryDivider {}
    customElements.define(tag, Existing);

    expect(() => FoundryDivider.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryDivider orientation', () => {
  it('defaults to orientation="horizontal" on connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('orientation')).toBe('horizontal');
  });

  it('preserves an explicit vertical orientation', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('orientation', 'vertical');
    document.body.appendChild(el);
    expect(el.getAttribute('orientation')).toBe('vertical');
  });

  it('reflects the orientation property to the attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDivider & { orientation: string };
    document.body.appendChild(el);

    el.orientation = 'vertical';
    expect(el.getAttribute('orientation')).toBe('vertical');
  });

  it('falls back to "horizontal" when the orientation attribute is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('orientation', 'vertical');
    document.body.appendChild(el);
    expect(el.getAttribute('orientation')).toBe('vertical');

    el.removeAttribute('orientation');
    expect(el.getAttribute('orientation')).toBe('horizontal');
  });
});

describe('FoundryDivider ARIA', () => {
  it('sets role="separator" on the host', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('separator');
  });

  it('omits aria-orientation when horizontal', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('aria-orientation')).toBe(false);
  });

  it('sets aria-orientation="vertical" when vertical', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDivider & { orientation: string };
    el.setAttribute('orientation', 'vertical');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('removes aria-orientation when flipping back to horizontal', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDivider & { orientation: string };
    el.setAttribute('orientation', 'vertical');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-orientation')).toBe('vertical');

    el.orientation = 'horizontal';
    expect(el.hasAttribute('aria-orientation')).toBe(false);
  });
});
