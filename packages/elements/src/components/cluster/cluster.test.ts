import { afterEach, describe, expect, it } from 'vitest';
import { FoundryCluster } from './cluster.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-cluster-test-${++counter}`;
  class Sub extends FoundryCluster {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryCluster.define', () => {
  it('registers the given tag with FoundryCluster', () => {
    const tag = `foundry-cluster-define-${++counter}`;
    FoundryCluster.define(tag);
    expect(customElements.get(tag)).toBe(FoundryCluster);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-cluster-noop-${++counter}`;
    class Existing extends FoundryCluster {}
    customElements.define(tag, Existing);

    expect(() => FoundryCluster.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryCluster space', () => {
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
    const el = document.createElement(tag) as FoundryCluster & { space: string };
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

describe('FoundryCluster slotting', () => {
  it('passes children through to the default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    const child = document.createElement('span');
    child.textContent = 'chip';
    el.appendChild(child);
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot).not.toBeNull();
    const assigned = slot?.assignedNodes({ flatten: true });
    expect(assigned?.[0]).toBe(child);
  });
});
