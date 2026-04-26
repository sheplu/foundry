import { afterEach, describe, expect, it } from 'vitest';
import { FoundryHeading } from './heading.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-heading-test-${++counter}`;
  class Sub extends FoundryHeading {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryHeading.define', () => {
  it('registers the given tag with FoundryHeading', () => {
    const tag = `foundry-heading-define-${++counter}`;
    FoundryHeading.define(tag);
    expect(customElements.get(tag)).toBe(FoundryHeading);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-heading-noop-${++counter}`;
    class Existing extends FoundryHeading {}
    customElements.define(tag, Existing);

    expect(() => FoundryHeading.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryHeading ARIA', () => {
  it('sets role="heading" on the host', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('heading');
  });

  it('defaults to aria-level="2"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('aria-level')).toBe('2');
  });

  it('reflects aria-level from the level attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryHeading & { level: number };
    el.setAttribute('level', '3');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-level')).toBe('3');
  });

  it('updates aria-level when level changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryHeading & { level: number };
    document.body.appendChild(el);

    el.level = 4;
    expect(el.getAttribute('aria-level')).toBe('4');
  });

  it('clamps out-of-range levels to 1..6', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryHeading & { level: number };
    document.body.appendChild(el);

    el.level = 99;
    expect(el.getAttribute('aria-level')).toBe('6');

    el.level = -3;
    expect(el.getAttribute('aria-level')).toBe('2');
  });
});

describe('FoundryHeading size defaults', () => {
  it('picks size="lg" for level 2 when size is not set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('lg');
  });

  it('picks size="xl" for level 1', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('level', '1');
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('xl');
  });

  it('picks size="md" for level 3', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('level', '3');
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('md');
  });

  it('picks size="sm" for level 4 and below', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('level', '5');
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('sm');
  });

  it('preserves an explicit size when level changes', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryHeading & { level: number };
    el.setAttribute('size', 'xl');
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('xl');

    el.level = 4;
    expect(el.getAttribute('size')).toBe('xl');
    expect(el.getAttribute('aria-level')).toBe('4');
  });

  it('falls back to level-default when size is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryHeading;
    el.setAttribute('size', 'xl');
    document.body.appendChild(el);

    el.removeAttribute('size');
    // Level defaults to 2, so size should fall back to 'lg'.
    expect(el.getAttribute('size')).toBe('lg');
  });
});

describe('FoundryHeading slotting', () => {
  it('passes children through to the default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'Page title';
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot');
    expect(slot).not.toBeNull();
    const assigned = slot?.assignedNodes({ flatten: true });
    expect(assigned?.[0]?.textContent).toBe('Page title');
  });
});
