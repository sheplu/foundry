import { afterEach, describe, expect, it } from 'vitest';
import { FoundryTd } from './td.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-td-test-${++counter}`;
  class Sub extends FoundryTd {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTd.define', () => {
  it('registers the canonical tag', () => {
    FoundryTd.define();
    expect(customElements.get('foundry-td')).toBe(FoundryTd);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-td-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryTd.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTd rendering', () => {
  it('renders an inner native <td>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const inner = el.shadowRoot?.querySelector('td[part="cell"]');
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
    el.setAttribute('role', 'cell');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('cell');
  });
});
