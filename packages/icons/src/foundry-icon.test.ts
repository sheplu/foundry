import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FoundryIcon } from './foundry-icon.ts';
import { check, chevronDown, close } from './icons.ts';

let counter = 0;

function uniqueSubclass(): { tag: string; Ctor: typeof FoundryIcon } {
  const tag = `foundry-icon-test-${++counter}`;
  class Sub extends FoundryIcon {}
  customElements.define(tag, Sub);
  return { tag, Ctor: Sub };
}

beforeEach(() => {
  FoundryIcon.registry.clear();
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryIcon.register', () => {
  it('adds entries to the shared registry', () => {
    FoundryIcon.register({ check });
    expect(FoundryIcon.registry.get('check')).toBe(check);
  });

  it('merges across multiple calls', () => {
    FoundryIcon.register({ check });
    FoundryIcon.register({ close });
    expect(FoundryIcon.registry.get('check')).toBe(check);
    expect(FoundryIcon.registry.get('close')).toBe(close);
  });

  it('overwrites prior values for the same name', () => {
    FoundryIcon.register({ alias: check });
    FoundryIcon.register({ alias: close });
    expect(FoundryIcon.registry.get('alias')).toBe(close);
  });
});

describe('FoundryIcon.define', () => {
  it('registers the given tag with FoundryIcon', () => {
    const tag = `foundry-icon-define-${++counter}`;
    FoundryIcon.define(tag);
    expect(customElements.get(tag)).toBe(FoundryIcon);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-icon-noop-${++counter}`;
    class Existing extends FoundryIcon {}
    customElements.define(tag, Existing);

    expect(() => FoundryIcon.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryIcon rendering', () => {
  it('renders the registered SVG into refs.inner when name is set', () => {
    FoundryIcon.register({ check });
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIcon & { name?: string };
    el.setAttribute('name', 'check');
    document.body.appendChild(el);

    const inner = el.shadowRoot?.querySelector('[data-ref="inner"]');
    expect(inner?.innerHTML).toContain('<svg');
    expect(inner?.querySelector('svg')).not.toBeNull();
  });

  it('leaves inner empty when the name is unregistered', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIcon;
    el.setAttribute('name', 'missing');
    document.body.appendChild(el);

    const inner = el.shadowRoot?.querySelector('[data-ref="inner"]');
    expect(inner?.innerHTML).toBe('');
  });

  it('updates the inner SVG when name changes after mount', () => {
    FoundryIcon.register({ check, close });
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIcon & { name?: string };
    el.setAttribute('name', 'check');
    document.body.appendChild(el);

    const inner = el.shadowRoot?.querySelector('[data-ref="inner"]');
    const initial = inner?.innerHTML;
    expect(initial).toContain('<svg');

    el.setAttribute('name', 'close');
    const after = inner?.innerHTML;
    expect(after).toContain('<svg');
    expect(after).not.toBe(initial);
  });
});

describe('FoundryIcon a11y', () => {
  it('is decorative by default (aria-hidden, no role)', () => {
    FoundryIcon.register({ check });
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIcon;
    el.setAttribute('name', 'check');
    document.body.appendChild(el);

    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('becomes meaningful when label is set (role=img + aria-label)', () => {
    FoundryIcon.register({ check });
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIcon;
    el.setAttribute('name', 'check');
    el.setAttribute('label', 'Confirmed');
    document.body.appendChild(el);

    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Confirmed');
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('resets cleanly when label is removed', () => {
    FoundryIcon.register({ check });
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIcon;
    el.setAttribute('name', 'check');
    el.setAttribute('label', 'Confirmed');
    document.body.appendChild(el);

    el.removeAttribute('label');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('FoundryIcon propertyChanged filter', () => {
  it('ignores unknown property names without re-rendering', () => {
    FoundryIcon.register({ check });
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('name', 'check');
    document.body.appendChild(el);
    const innerBefore = el.shadowRoot?.querySelector('[data-ref="inner"]')?.innerHTML;

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unknown', null, 'x');

    const innerAfter = el.shadowRoot?.querySelector('[data-ref="inner"]')?.innerHTML;
    expect(innerAfter).toBe(innerBefore);
  });
});

describe('Icon SVG files conform to authoring rules', () => {
  const svgs = { check, 'chevron-down': chevronDown, close };

  for (const [name, svg] of Object.entries(svgs)) {
    it(`${name} uses currentColor and a 24x24 viewBox`, () => {
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('currentColor');
      expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}/); // no hardcoded hex
      expect(svg).not.toMatch(/\swidth="/);
      expect(svg).not.toMatch(/\sheight="/);
      expect(svg).not.toContain('<?xml');
    });
  }
});
