import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryNavbar } from './navbar.ts';

beforeAll(() => {
  FoundryNavbar.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-navbar-test-${++counter}`;
  class Sub extends FoundryNavbar {}
  customElements.define(tag, Sub);
  return { tag };
}

function makeNavbar(html = ''): FoundryNavbar {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryNavbar;
  if (html) el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

function innerNav(el: FoundryNavbar): HTMLElement {
  const n = el.shadowRoot?.querySelector('nav');
  if (!n) throw new Error('nav missing');
  return n;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryNavbar.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-navbar')).toBe(FoundryNavbar);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-navbar-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryNavbar.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryNavbar defaults', () => {
  it('defaults variant to "outlined" and reflects onto the host', () => {
    const el = makeNavbar();
    expect(el.getAttribute('variant')).toBe('outlined');
  });

  it('defaults label to "Main navigation" and forwards to inner nav', () => {
    const el = makeNavbar();
    expect(innerNav(el).getAttribute('aria-label')).toBe('Main navigation');
  });

  it('sticky defaults to false (no attribute)', () => {
    const el = makeNavbar();
    expect(el.hasAttribute('sticky')).toBe(false);
  });
});

describe('FoundryNavbar rendering', () => {
  it('renders nav + brand + content + actions in shadow DOM', () => {
    const el = makeNavbar();
    expect(el.shadowRoot?.querySelector('[part="nav"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="brand"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="content"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="actions"]')).toBeTruthy();
  });

  it('inner nav is a semantic <nav> with role="navigation" implicit', () => {
    const el = makeNavbar();
    expect(innerNav(el).tagName).toBe('NAV');
  });
});

describe('FoundryNavbar slot detection', () => {
  it('sets has-brand when the brand slot has content', () => {
    const el = makeNavbar('<span slot="brand">Acme</span>');
    expect(el.hasAttribute('has-brand')).toBe(true);
  });

  it('does not set has-brand when the brand slot is empty', () => {
    const el = makeNavbar();
    expect(el.hasAttribute('has-brand')).toBe(false);
  });

  it('sets has-actions when the actions slot has content', () => {
    const el = makeNavbar('<button slot="actions">Sign in</button>');
    expect(el.hasAttribute('has-actions')).toBe(true);
  });

  it('does not set has-actions when the actions slot is empty', () => {
    const el = makeNavbar();
    expect(el.hasAttribute('has-actions')).toBe(false);
  });

  it('default slot content does not flip the has-* attrs', () => {
    const el = makeNavbar('<a href="#">Home</a>');
    expect(el.hasAttribute('has-brand')).toBe(false);
    expect(el.hasAttribute('has-actions')).toBe(false);
  });

  it('updates has-brand dynamically when slot content is added', () => {
    const el = makeNavbar();
    expect(el.hasAttribute('has-brand')).toBe(false);
    const span = document.createElement('span');
    span.slot = 'brand';
    span.textContent = 'Acme';
    el.appendChild(span);
    // slotchange is async in some engines; jsdom fires it synchronously after
    // microtask flush, but we check synchronously here — the MutationObserver
    // path isn't involved. Verify via the next microtask.
    return Promise.resolve().then(() => {
      expect(el.hasAttribute('has-brand')).toBe(true);
    });
  });
});

describe('FoundryNavbar variant', () => {
  it('accepts variant="flat"', () => {
    const el = makeNavbar();
    (el as unknown as { variant: string }).variant = 'flat';
    expect(el.getAttribute('variant')).toBe('flat');
  });

  it('accepts variant="elevated"', () => {
    const el = makeNavbar();
    el.setAttribute('variant', 'elevated');
    expect(el.getAttribute('variant')).toBe('elevated');
  });

  it('falls back to "outlined" when variant attribute is removed', () => {
    const el = makeNavbar();
    el.setAttribute('variant', 'elevated');
    el.removeAttribute('variant');
    // Variant stays unset (absent attribute), then #syncVariant restores default
    // on the next propertyChanged — but attribute removal doesn't retrigger
    // connected(). Users should set variant via the property, not remove it.
    expect(el.getAttribute('variant')).toBe('outlined');
  });
});

describe('FoundryNavbar sticky', () => {
  it('reflects sticky attribute when toggled on', () => {
    const el = makeNavbar();
    (el as unknown as { sticky: boolean }).sticky = true;
    expect(el.hasAttribute('sticky')).toBe(true);
  });

  it('reflects sticky off when toggled', () => {
    const el = makeNavbar();
    el.setAttribute('sticky', '');
    (el as unknown as { sticky: boolean }).sticky = false;
    expect(el.hasAttribute('sticky')).toBe(false);
  });
});

describe('FoundryNavbar label', () => {
  it('updates the inner nav aria-label when label changes', () => {
    const el = makeNavbar();
    el.setAttribute('label', 'Site chrome');
    expect(innerNav(el).getAttribute('aria-label')).toBe('Site chrome');
  });

  it('falls back to the default label when label is set to empty string', () => {
    const el = makeNavbar();
    (el as unknown as { label: string }).label = '';
    expect(innerNav(el).getAttribute('aria-label')).toBe('Main navigation');
  });
});

describe('FoundryNavbar propertyChanged filter', () => {
  it('ignores unknown property names without throwing', () => {
    const el = makeNavbar();
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});
