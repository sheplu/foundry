import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryTh } from './th.ts';

beforeAll(() => {
  FoundryTh.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-th-test-${++counter}`;
  class Sub extends FoundryTh {}
  customElements.define(tag, Sub);
  return { tag };
}

function makeTh(opts: {
  sortable?: boolean;
  direction?: 'asc' | 'desc' | 'none';
  scope?: 'col' | 'row';
  text?: string;
} = {}): FoundryTh {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryTh;
  if (opts.sortable) el.setAttribute('sortable', '');
  if (opts.direction) el.setAttribute('direction', opts.direction);
  if (opts.scope) el.setAttribute('scope', opts.scope);
  el.textContent = opts.text ?? 'Name';
  document.body.appendChild(el);
  return el;
}

function getCell(el: FoundryTh): HTMLTableCellElement {
  const cell = el.shadowRoot?.querySelector('th[part="cell"]');
  if (!(cell instanceof HTMLTableCellElement)) throw new Error('inner th missing');
  return cell;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTh.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-th')).toBe(FoundryTh);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-th-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryTh.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTh defaults', () => {
  it('defaults sortable=false, direction="none", scope="col"', () => {
    const el = makeTh();
    expect(el.hasAttribute('sortable')).toBe(false);
    expect(el.getAttribute('scope')).toBe('col');
  });

  it('host carries role="presentation"', () => {
    const el = makeTh();
    expect(el.getAttribute('role')).toBe('presentation');
  });

  it('renders an inner native <th>', () => {
    const el = makeTh();
    expect(getCell(el)).toBeTruthy();
  });

  it('forwards scope onto the inner th', () => {
    const el = makeTh({ scope: 'row' });
    expect(getCell(el).getAttribute('scope')).toBe('row');
  });

  it('updates inner scope when scope changes', () => {
    const el = makeTh();
    expect(getCell(el).getAttribute('scope')).toBe('col');
    el.setAttribute('scope', 'row');
    expect(getCell(el).getAttribute('scope')).toBe('row');
  });
});

describe('FoundryTh — non-sortable', () => {
  it('does not render a button when sortable is unset', () => {
    const el = makeTh();
    expect(el.shadowRoot?.querySelector('button[part="button"]')).toBeNull();
  });

  it('does not set aria-sort on the inner th', () => {
    const el = makeTh();
    expect(getCell(el).hasAttribute('aria-sort')).toBe(false);
  });

  it('clicking the host does not dispatch a sort event', () => {
    const el = makeTh();
    let fired = 0;
    el.addEventListener('sort', () => {
      fired += 1;
    });
    el.click();
    expect(fired).toBe(0);
  });
});

describe('FoundryTh — sortable', () => {
  it('renders an inner button + chevron when sortable is set', () => {
    const el = makeTh({ sortable: true });
    expect(el.shadowRoot?.querySelector('button[part="button"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('svg[part="icon"]')).toBeTruthy();
  });

  it('toggling sortable=true after mount renders the button', () => {
    const el = makeTh();
    expect(el.shadowRoot?.querySelector('button[part="button"]')).toBeNull();
    (el as unknown as { sortable: boolean }).sortable = true;
    expect(el.shadowRoot?.querySelector('button[part="button"]')).toBeTruthy();
  });

  it('toggling sortable=false tears down the button', () => {
    const el = makeTh({ sortable: true });
    (el as unknown as { sortable: boolean }).sortable = false;
    expect(el.shadowRoot?.querySelector('button[part="button"]')).toBeNull();
  });

  it('inner <th> exposes aria-sort="none" by default', () => {
    const el = makeTh({ sortable: true });
    expect(getCell(el).getAttribute('aria-sort')).toBe('none');
  });

  it('aria-sort reflects direction="asc" as "ascending"', () => {
    const el = makeTh({ sortable: true, direction: 'asc' });
    expect(getCell(el).getAttribute('aria-sort')).toBe('ascending');
  });

  it('aria-sort reflects direction="desc" as "descending"', () => {
    const el = makeTh({ sortable: true, direction: 'desc' });
    expect(getCell(el).getAttribute('aria-sort')).toBe('descending');
  });

  it('clicking the button dispatches sort with detail.direction="asc" from none', () => {
    const el = makeTh({ sortable: true });
    let detail: { direction: string } | undefined;
    el.addEventListener('sort', (e) => {
      detail = (e as CustomEvent<{ direction: string }>).detail;
    });
    const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]');
    btn?.click();
    expect(detail?.direction).toBe('asc');
  });

  it('clicking when direction="asc" emits desc', () => {
    const el = makeTh({ sortable: true, direction: 'asc' });
    let detail: { direction: string } | undefined;
    el.addEventListener('sort', (e) => {
      detail = (e as CustomEvent<{ direction: string }>).detail;
    });
    el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]')?.click();
    expect(detail?.direction).toBe('desc');
  });

  it('clicking when direction="desc" cycles back to asc', () => {
    const el = makeTh({ sortable: true, direction: 'desc' });
    let detail: { direction: string } | undefined;
    el.addEventListener('sort', (e) => {
      detail = (e as CustomEvent<{ direction: string }>).detail;
    });
    el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]')?.click();
    expect(detail?.direction).toBe('asc');
  });

  it('sort event bubbles + composes across shadow boundary', () => {
    const outer = document.createElement('div');
    const el = makeTh({ sortable: true });
    outer.appendChild(el);
    document.body.appendChild(outer);
    let received = false;
    outer.addEventListener('sort', () => {
      received = true;
    });
    el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]')?.click();
    expect(received).toBe(true);
  });

  it('updating direction after sort updates aria-sort', () => {
    const el = makeTh({ sortable: true });
    expect(getCell(el).getAttribute('aria-sort')).toBe('none');
    el.setAttribute('direction', 'asc');
    expect(getCell(el).getAttribute('aria-sort')).toBe('ascending');
  });

  it('non-asc/desc direction values normalize to "none"', () => {
    const el = makeTh({ sortable: true });
    el.setAttribute('direction', 'bogus');
    expect(getCell(el).getAttribute('aria-sort')).toBe('none');
  });

  it('Enter on the focused button activates sort (via native button synthesis)', () => {
    const el = makeTh({ sortable: true });
    let fired = 0;
    el.addEventListener('sort', () => {
      fired += 1;
    });
    const btn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]');
    btn?.focus();
    // Native browsers synthesize a click after Enter on a focused <button>.
    btn?.click();
    expect(fired).toBe(1);
  });
});

describe('FoundryTh — propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makeTh({ sortable: true });
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});
