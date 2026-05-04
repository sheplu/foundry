import { afterEach, describe, expect, it } from 'vitest';
import { FoundryPanel } from './panel.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-panel-test-${++counter}`;
  class Sub extends FoundryPanel {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryPanel.define', () => {
  it('registers the given tag', () => {
    const tag = `foundry-panel-define-${++counter}`;
    FoundryPanel.define(tag);
    expect(customElements.get(tag)).toBe(FoundryPanel);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-panel-noop-${++counter}`;
    class Existing extends FoundryPanel {}
    customElements.define(tag, Existing);
    expect(() => FoundryPanel.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryPanel defaults', () => {
  it('sets role="tabpanel" on the host after connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('tabpanel');
  });

  it('sets tabindex="0" so the panel is keyboard-focusable', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('preserves a consumer-supplied tabindex', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('tabindex', '-1');
    document.body.appendChild(el);
    expect(el.getAttribute('tabindex')).toBe('-1');
  });

  it('defaults selected=false and aria-hidden="true"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('selected')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('FoundryPanel selected reflection', () => {
  it('clears aria-hidden when selected becomes true', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryPanel & { selected: boolean };
    document.body.appendChild(el);
    el.selected = true;
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('restores aria-hidden when selected becomes false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryPanel & { selected: boolean };
    el.setAttribute('selected', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    el.selected = false;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects selected attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryPanel & { selected: boolean };
    document.body.appendChild(el);
    el.selected = true;
    expect(el.hasAttribute('selected')).toBe(true);
  });
});

describe('FoundryPanel propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('aria-hidden');
    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);
    expect(el.getAttribute('aria-hidden')).toBe(before);
  });
});
