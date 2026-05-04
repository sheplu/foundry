import { afterEach, describe, expect, it } from 'vitest';
import { FoundryTab } from './tab.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-tab-test-${++counter}`;
  class Sub extends FoundryTab {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTab.define', () => {
  it('registers the given tag', () => {
    const tag = `foundry-tab-define-${++counter}`;
    FoundryTab.define(tag);
    expect(customElements.get(tag)).toBe(FoundryTab);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-tab-noop-${++counter}`;
    class Existing extends FoundryTab {}
    customElements.define(tag, Existing);

    expect(() => FoundryTab.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTab defaults', () => {
  it('sets role="tab" on the host after connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('tab');
  });

  it('preserves a consumer-supplied role', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('role', 'menuitem');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('menuitem');
  });

  it('defaults boolean flags to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('selected')).toBe(false);
  });

  it('defaults aria-selected="false" and tabindex=-1 on unselected tabs', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('aria-selected')).toBe('false');
    expect(el.tabIndex).toBe(-1);
  });
});

describe('FoundryTab attribute reflection', () => {
  it('reflects value', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab & { value: string };
    document.body.appendChild(el);
    el.value = 'overview';
    expect(el.getAttribute('value')).toBe('overview');
  });

  it('reflects disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab & { disabled: boolean };
    document.body.appendChild(el);
    el.disabled = true;
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('reflects selected', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab & { selected: boolean };
    document.body.appendChild(el);
    el.selected = true;
    expect(el.hasAttribute('selected')).toBe(true);
  });
});

describe('FoundryTab aria + tabindex sync', () => {
  it('flips aria-selected + tabindex when selected changes', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab & { selected: boolean };
    document.body.appendChild(el);

    el.selected = true;
    expect(el.getAttribute('aria-selected')).toBe('true');
    expect(el.tabIndex).toBe(0);

    el.selected = false;
    expect(el.getAttribute('aria-selected')).toBe('false');
    expect(el.tabIndex).toBe(-1);
  });

  it('sets aria-disabled="true" when disabled is set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab & { disabled: boolean };
    document.body.appendChild(el);
    el.disabled = true;
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  it('removes aria-disabled when disabled is cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab & { disabled: boolean };
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    el.disabled = false;
    expect(el.hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('FoundryTab resolvedValue', () => {
  it('returns the value attribute when set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab;
    el.setAttribute('value', 'settings');
    el.textContent = 'Settings tab';
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('settings');
  });

  it('falls back to trimmed textContent when value is absent', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTab;
    el.textContent = '  Overview  ';
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('Overview');
  });
});

describe('FoundryTab propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('aria-selected');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(el.getAttribute('aria-selected')).toBe(before);
  });
});
