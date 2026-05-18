import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryCarouselSlide } from './carousel-slide.ts';

beforeAll(() => {
  FoundryCarouselSlide.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-carousel-slide-test-${++counter}`;
  class Sub extends FoundryCarouselSlide {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryCarouselSlide.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-carousel-slide')).toBe(FoundryCarouselSlide);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-carousel-slide-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryCarouselSlide.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryCarouselSlide defaults', () => {
  it('host carries role="group" by default', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('group');
  });

  it('preserves a consumer-supplied role', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('role', 'tabpanel');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('tabpanel');
  });

  it('defaults selected=false and sets aria-hidden="true"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('selected')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('FoundryCarouselSlide selection', () => {
  it('selected=true clears aria-hidden', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('selected', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('aria-hidden')).toBe(false);
  });

  it('toggling selected updates aria-hidden in both directions', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    (el as unknown as { selected: boolean }).selected = true;
    expect(el.hasAttribute('aria-hidden')).toBe(false);
    (el as unknown as { selected: boolean }).selected = false;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('FoundryCarouselSlide label', () => {
  it('label attribute reflects onto aria-label', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('label', 'Welcome slide');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Welcome slide');
  });

  it('clearing label removes aria-label', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('label', 'Welcome');
    document.body.appendChild(el);
    el.removeAttribute('label');
    expect(el.hasAttribute('aria-label')).toBe(false);
  });
});

describe('FoundryCarouselSlide resolvedValue', () => {
  it('returns the value attribute when set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryCarouselSlide;
    el.setAttribute('value', 'home');
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('home');
  });

  it('returns empty string when value is unset', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryCarouselSlide;
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('');
  });
});

describe('FoundryCarouselSlide propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryCarouselSlide;
    document.body.appendChild(el);
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});
