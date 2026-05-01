import { afterEach, describe, expect, it } from 'vitest';
import { FoundryBreadcrumbs } from './breadcrumbs.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-breadcrumbs-test-${++counter}`;
  class Sub extends FoundryBreadcrumbs {}
  customElements.define(tag, Sub);
  return { tag };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryBreadcrumbs.define', () => {
  it('registers the given tag', () => {
    const tag = `foundry-breadcrumbs-define-${++counter}`;
    FoundryBreadcrumbs.define(tag);
    expect(customElements.get(tag)).toBe(FoundryBreadcrumbs);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-breadcrumbs-noop-${++counter}`;
    class Existing extends FoundryBreadcrumbs {}
    customElements.define(tag, Existing);

    expect(() => FoundryBreadcrumbs.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryBreadcrumbs rendering', () => {
  it('renders a <nav aria-label="Breadcrumb"> wrapper', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryBreadcrumbs;
    document.body.appendChild(el);

    const nav = el.shadowRoot?.querySelector('nav');
    expect(nav).toBeInstanceOf(HTMLElement);
    expect(nav?.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('renders an <ol> inside the <nav>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryBreadcrumbs;
    document.body.appendChild(el);

    const ol = el.shadowRoot?.querySelector('nav > ol');
    expect(ol).toBeInstanceOf(HTMLOListElement);
  });

  it('exposes "nav" and "list" CSS parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector('[part="nav"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="list"]')).toBeTruthy();
  });

  it('accepts children via its default slot', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span>Home</span><span>Docs</span>';
    document.body.appendChild(el);

    const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const assigned = slot?.assignedNodes({ flatten: true }) ?? [];
    expect(assigned.length).toBe(2);
  });
});
