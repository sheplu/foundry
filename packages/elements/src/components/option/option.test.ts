import { afterEach, describe, expect, it } from 'vitest';
import { FoundryOption } from './option.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-option-test-${++counter}`;
  class Sub extends FoundryOption {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryOption.define', () => {
  it('registers the given tag', () => {
    const tag = `foundry-option-define-${++counter}`;
    FoundryOption.define(tag);
    expect(customElements.get(tag)).toBe(FoundryOption);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-option-noop-${++counter}`;
    class Existing extends FoundryOption {}
    customElements.define(tag, Existing);

    expect(() => FoundryOption.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryOption defaults', () => {
  it('sets role="option" on the host after connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('option');
  });

  it('keeps a consumer-supplied role', () => {
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
});

describe('FoundryOption attribute reflection', () => {
  it('reflects value', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption & { value: string };
    document.body.appendChild(el);
    el.value = 'utc';
    expect(el.getAttribute('value')).toBe('utc');
  });

  it('reflects disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption & { disabled: boolean };
    document.body.appendChild(el);
    el.disabled = true;
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('reflects selected', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption & { selected: boolean };
    document.body.appendChild(el);
    el.selected = true;
    expect(el.hasAttribute('selected')).toBe(true);
  });
});

describe('FoundryOption aria state', () => {
  it('sets aria-selected="false" by default', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('aria-selected')).toBe('false');
  });

  it('flips aria-selected when selected changes', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption & { selected: boolean };
    document.body.appendChild(el);
    el.selected = true;
    expect(el.getAttribute('aria-selected')).toBe('true');
    el.selected = false;
    expect(el.getAttribute('aria-selected')).toBe('false');
  });

  it('sets aria-disabled="true" when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption & { disabled: boolean };
    document.body.appendChild(el);
    el.disabled = true;
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  it('removes aria-disabled when disabled is cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption & { disabled: boolean };
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    el.disabled = false;
    expect(el.hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('FoundryOption resolvedValue', () => {
  it('returns the value attribute when set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption;
    el.setAttribute('value', 'pst');
    el.textContent = 'Pacific Standard';
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('pst');
  });

  it('falls back to trimmed textContent when value is absent', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption;
    el.textContent = '  UTC  ';
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('UTC');
  });

  it('returns empty string when value is absent and textContent is blank', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryOption;
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('');
  });
});

describe('FoundryOption propertyChanged filter', () => {
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
