import { afterEach, describe, expect, it } from 'vitest';
import { FoundryThead } from './thead.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-thead-test-${++counter}`;
  class Sub extends FoundryThead {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryThead.define', () => {
  it('registers the canonical tag', () => {
    FoundryThead.define();
    expect(customElements.get('foundry-thead')).toBe(FoundryThead);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-thead-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryThead.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryThead rendering', () => {
  it('renders an inner native <thead>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const inner = el.shadowRoot?.querySelector('thead[part="thead"]');
    expect(inner).toBeTruthy();
  });

  it('host carries role="presentation" so AT sees the inner thead', () => {
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

  it('renders slotted content', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span>row</span>';
    document.body.appendChild(el);
    expect(el.querySelector('span')?.textContent).toBe('row');
  });
});
