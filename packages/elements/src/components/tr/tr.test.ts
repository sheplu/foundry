import { afterEach, describe, expect, it } from 'vitest';
import { FoundryTr } from './tr.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-tr-test-${++counter}`;
  class Sub extends FoundryTr {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTr.define', () => {
  it('registers the canonical tag', () => {
    FoundryTr.define();
    expect(customElements.get('foundry-tr')).toBe(FoundryTr);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-tr-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryTr.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTr rendering', () => {
  it('renders an inner native <tr>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const inner = el.shadowRoot?.querySelector('tr[part="row"]');
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
    el.setAttribute('role', 'row');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('row');
  });
});
