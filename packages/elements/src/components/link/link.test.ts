import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundryLink } from './link.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-link-test-${++counter}`;
  class Sub extends FoundryLink {}
  customElements.define(tag, Sub);
  return { tag };
}

function getAnchor(el: HTMLElement): HTMLAnchorElement {
  const a = el.shadowRoot?.querySelector('a');
  if (!(a instanceof HTMLAnchorElement)) throw new Error('inner anchor missing');
  return a;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryLink.define', () => {
  it('registers the given tag with FoundryLink', () => {
    const tag = `foundry-link-define-${++counter}`;
    FoundryLink.define(tag);
    expect(customElements.get(tag)).toBe(FoundryLink);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-link-noop-${++counter}`;
    class Existing extends FoundryLink {}
    customElements.define(tag, Existing);

    expect(() => FoundryLink.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryLink rendering', () => {
  it('renders an inner native <a>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink;
    document.body.appendChild(el);
    expect(getAnchor(el)).toBeInstanceOf(HTMLAnchorElement);
  });

  it('attaches its shadow root with delegatesFocus: true', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink;
    const spy = vi.spyOn(el, 'attachShadow');
    document.body.appendChild(el);

    expect(spy).toHaveBeenCalledWith({ mode: 'open', delegatesFocus: true });
  });
});

describe('FoundryLink variant', () => {
  it('defaults variant to "inline" and reflects it to the host attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink & { variant: string };
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('inline');
    expect(el.variant).toBe('inline');
  });

  it('honors a pre-set variant attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'standalone');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('standalone');
  });

  it('reflects variant changes made via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink & { variant: string };
    document.body.appendChild(el);

    el.variant = 'standalone';
    expect(el.getAttribute('variant')).toBe('standalone');
  });
});

describe('FoundryLink attribute forwarding', () => {
  it('forwards href, target, download, hreflang, type onto the inner <a>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('href', '/docs');
    el.setAttribute('target', '_self');
    el.setAttribute('download', 'notes.txt');
    el.setAttribute('hreflang', 'en');
    el.setAttribute('type', 'text/plain');
    document.body.appendChild(el);

    const a = getAnchor(el);
    expect(a.getAttribute('href')).toBe('/docs');
    expect(a.getAttribute('target')).toBe('_self');
    expect(a.getAttribute('download')).toBe('notes.txt');
    expect(a.getAttribute('hreflang')).toBe('en');
    expect(a.getAttribute('type')).toBe('text/plain');
  });

  it('re-forwards when host attributes change at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink & { href: string };
    document.body.appendChild(el);
    const a = getAnchor(el);

    el.href = '/a';
    expect(a.getAttribute('href')).toBe('/a');
    el.href = '/b';
    expect(a.getAttribute('href')).toBe('/b');
  });

  it('removes forwarded attributes when they are cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('href', '/x');
    document.body.appendChild(el);
    const a = getAnchor(el);
    expect(a.hasAttribute('href')).toBe(true);

    el.removeAttribute('href');
    expect(a.hasAttribute('href')).toBe(false);
  });
});

describe('FoundryLink rel handling', () => {
  it('adds rel="noopener" automatically when target="_blank" and no rel is set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('href', 'https://example.com');
    el.setAttribute('target', '_blank');
    document.body.appendChild(el);

    expect(getAnchor(el).getAttribute('rel')).toBe('noopener');
  });

  it('respects an explicit rel exactly (no auto-noopener injection)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('href', 'https://example.com');
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'external');
    document.body.appendChild(el);

    expect(getAnchor(el).getAttribute('rel')).toBe('external');
  });

  it('removes rel when target is not _blank and no rel was set by the consumer', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink & { target: string };
    el.setAttribute('target', '_blank');
    document.body.appendChild(el);
    expect(getAnchor(el).getAttribute('rel')).toBe('noopener');

    el.target = '_self';
    expect(getAnchor(el).hasAttribute('rel')).toBe(false);
  });

  it('re-evaluates rel when target changes between _blank and other values', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink & { target: string };
    document.body.appendChild(el);
    expect(getAnchor(el).hasAttribute('rel')).toBe(false);

    el.target = '_blank';
    expect(getAnchor(el).getAttribute('rel')).toBe('noopener');
  });

  it('applies a rel change made via the property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink & { rel: string };
    el.setAttribute('target', '_blank');
    document.body.appendChild(el);
    expect(getAnchor(el).getAttribute('rel')).toBe('noopener');

    el.rel = 'external nofollow';
    expect(getAnchor(el).getAttribute('rel')).toBe('external nofollow');
  });
});

describe('FoundryLink focus', () => {
  it('delegates focus() to the inner anchor', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryLink;
    el.setAttribute('href', '/');
    document.body.appendChild(el);

    let focused = false;
    getAnchor(el).addEventListener('focus', () => {
      focused = true;
    });
    el.focus();
    expect(focused).toBe(true);
  });
});

describe('FoundryLink propertyChanged filter', () => {
  it('ignores property names outside the known set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('href', '/a');
    document.body.appendChild(el);
    const a = getAnchor(el);
    const before = a.getAttribute('href');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(a.getAttribute('href')).toBe(before);
  });
});
