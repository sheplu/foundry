import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryMenuitem } from './menuitem.ts';

beforeAll(() => {
  FoundryMenuitem.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-menuitem-test-${++counter}`;
  class Sub extends FoundryMenuitem {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryMenuitem.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-menuitem')).toBe(FoundryMenuitem);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-menuitem-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryMenuitem.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryMenuitem defaults', () => {
  it('sets role="menuitem" on the host after connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('menuitem');
  });

  it('preserves a consumer-supplied role', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('role', 'menuitemcheckbox');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('menuitemcheckbox');
  });

  it('defaults boolean flags to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('active')).toBe(false);
  });

  it('renders item, icon, label, shortcut parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const root = el.shadowRoot;
    expect(root?.querySelector('[part="item"]')).toBeTruthy();
    expect(root?.querySelector('[part="icon"]')).toBeTruthy();
    expect(root?.querySelector('[part="label"]')).toBeTruthy();
    expect(root?.querySelector('[part="shortcut"]')).toBeTruthy();
  });
});

describe('FoundryMenuitem attribute reflection', () => {
  it('reflects value', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryMenuitem & { value: string };
    document.body.appendChild(el);
    el.value = 'edit';
    expect(el.getAttribute('value')).toBe('edit');
  });

  it('reflects disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryMenuitem & { disabled: boolean };
    document.body.appendChild(el);
    el.disabled = true;
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('reflects active', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryMenuitem & { active: boolean };
    document.body.appendChild(el);
    el.active = true;
    expect(el.hasAttribute('active')).toBe(true);
  });
});

describe('FoundryMenuitem aria-disabled sync', () => {
  it('sets aria-disabled="true" when disabled is set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryMenuitem & { disabled: boolean };
    document.body.appendChild(el);
    el.disabled = true;
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  it('removes aria-disabled when disabled is cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryMenuitem & { disabled: boolean };
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    el.disabled = false;
    expect(el.hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('FoundryMenuitem has-icon / has-shortcut reflection', () => {
  it('reflects has-icon when icon slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="icon">★</span>Edit';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-icon')).toBe(true);
  });

  it('does not set has-icon when icon slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Edit';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-icon')).toBe(false);
  });

  it('reflects has-shortcut when shortcut slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = 'Save<span slot="shortcut">⌘S</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-shortcut')).toBe(true);
  });

  it('does not set has-shortcut when shortcut slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Save';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-shortcut')).toBe(false);
  });
});

describe('FoundryMenuitem resolvedValue', () => {
  it('returns the value attribute when set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryMenuitem;
    el.setAttribute('value', 'duplicate');
    el.textContent = 'Duplicate item';
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('duplicate');
  });

  it('falls back to trimmed textContent when value is absent', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryMenuitem;
    el.textContent = '  Archive  ';
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('Archive');
  });
});

describe('FoundryMenuitem propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.getAttribute('aria-disabled');
    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);
    expect(el.getAttribute('aria-disabled')).toBe(before);
  });
});
