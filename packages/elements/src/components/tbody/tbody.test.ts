import { afterEach, describe, expect, it } from 'vitest';
import { FoundryTbody } from './tbody.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-tbody-test-${++counter}`;
  class Sub extends FoundryTbody {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTbody.define', () => {
  it('registers the canonical tag', () => {
    FoundryTbody.define();
    expect(customElements.get('foundry-tbody')).toBe(FoundryTbody);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-tbody-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryTbody.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTbody rendering', () => {
  it('renders an inner native <tbody>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const inner = el.shadowRoot?.querySelector('tbody[part="tbody"]');
    expect(inner).toBeTruthy();
  });

  it('host carries role="presentation"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('presentation');
  });

  it('preserves a consumer-supplied role', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('role', 'rowgroup');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('rowgroup');
  });
});
