import { afterEach, describe, expect, it } from 'vitest';
import { FoundryStack } from './stack.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-stack-test-${++counter}`;
  class Sub extends FoundryStack {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryStack.define', () => {
  it('registers the given tag with FoundryStack', () => {
    const tag = `foundry-stack-define-${++counter}`;
    FoundryStack.define(tag);
    expect(customElements.get(tag)).toBe(FoundryStack);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-stack-noop-${++counter}`;
    class Existing extends FoundryStack {}
    customElements.define(tag, Existing);

    expect(() => FoundryStack.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryStack space', () => {
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
    const el = document.createElement(tag) as FoundryStack & { space: string };
    document.body.appendChild(el);

    el.space = 'xs';
    expect(el.getAttribute('space')).toBe('xs');
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

describe('FoundryStack slotting', () => {
  it('passes children through to the default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    const child = document.createElement('div');
    child.textContent = 'child';
    el.appendChild(child);
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot).not.toBeNull();
    const assigned = slot?.assignedNodes({ flatten: true });
    expect(assigned?.[0]).toBe(child);
  });
});

describe('FoundryStack propertyChanged filter', () => {
  it('ignores unknown property names without changing the space attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('space');

    // `propertyChanged` is protected; tests invoke it directly to prove the
    // component ignores names outside its declared surface.
    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('not-a-real-prop', null, 'whatever');

    expect(el.getAttribute('space')).toBe(before);
  });
});
