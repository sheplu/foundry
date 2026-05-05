import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryPagination } from './pagination.ts';

beforeAll(() => {
  FoundryPagination.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-pagination-test-${++counter}`;
  class Sub extends FoundryPagination {}
  customElements.define(tag, Sub);
  return { tag };
}

function makePager(opts: {
  page?: number;
  total?: number;
  siblingCount?: number;
} = {}): FoundryPagination {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryPagination;
  if (opts.page !== undefined) el.setAttribute('page', String(opts.page));
  if (opts.total !== undefined) el.setAttribute('total', String(opts.total));
  if (opts.siblingCount !== undefined) el.setAttribute('sibling-count', String(opts.siblingCount));
  document.body.appendChild(el);
  return el;
}

function listTokens(el: FoundryPagination): string[] {
  // Return the visible-text sequence, using 'prev' / 'next' / '…' for
  // non-numeric buttons so tests can assert truncation patterns cleanly.
  const items = Array.from(
    el.shadowRoot?.querySelectorAll('li > *') ?? [],
  ) as HTMLElement[];
  return items.map((node) => {
    const part = node.getAttribute('part') ?? '';
    if (part.includes('prev')) return 'prev';
    if (part.includes('next')) return 'next';
    if (part === 'ellipsis') return '…';
    return node.textContent?.trim() ?? '';
  });
}

function pageButtons(el: FoundryPagination): HTMLButtonElement[] {
  return Array.from(
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[part^="page"]') ?? [],
  );
}

function prevButton(el: FoundryPagination): HTMLButtonElement {
  const btn = el.shadowRoot?.querySelector('button[part="prev"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('no prev');
  return btn;
}

function nextButton(el: FoundryPagination): HTMLButtonElement {
  const btn = el.shadowRoot?.querySelector('button[part="next"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('no next');
  return btn;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryPagination.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-pagination')).toBe(FoundryPagination);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-pagination-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryPagination.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryPagination defaults', () => {
  it('defaults page=1, total=1, sibling-count=1', () => {
    const el = makePager();
    expect((el as unknown as { page: number }).page).toBe(1);
    expect((el as unknown as { total: number }).total).toBe(1);
    expect((el as unknown as { siblingCount: number }).siblingCount).toBe(1);
  });

  it('renders prev + single page 1 + next when total=1', () => {
    const el = makePager();
    expect(listTokens(el)).toEqual(['prev', '1', 'next']);
  });
});

describe('FoundryPagination — small totals render without ellipses', () => {
  it('total=5 renders every page', () => {
    const el = makePager({ total: 5, page: 3 });
    expect(listTokens(el)).toEqual(['prev', '1', '2', '3', '4', '5', 'next']);
  });

  it('total=7 still renders every page (threshold)', () => {
    const el = makePager({ total: 7, page: 4 });
    expect(listTokens(el)).toEqual([
      'prev', '1', '2', '3', '4', '5', '6', '7', 'next',
    ]);
  });

  it('total=8 begins truncation', () => {
    const el = makePager({ total: 8, page: 4 });
    const tokens = listTokens(el);
    // With page=4, sibling=1 → left sibling=3 (no ellipsis before, gap=2),
    // right sibling=5, gap to 8 is 3 → ellipsis-end fires.
    expect(tokens).toContain('…');
    expect(tokens[0]).toBe('prev');
    expect(tokens[tokens.length - 1]).toBe('next');
  });
});

describe('FoundryPagination — truncation near the current page', () => {
  it('total=20, page=1 shows first pages + ellipsis + last', () => {
    const el = makePager({ total: 20, page: 1 });
    expect(listTokens(el)).toEqual([
      'prev', '1', '2', '…', '20', 'next',
    ]);
  });

  it('total=20, page=10 shows ellipses on both sides', () => {
    const el = makePager({ total: 20, page: 10 });
    expect(listTokens(el)).toEqual([
      'prev', '1', '…', '9', '10', '11', '…', '20', 'next',
    ]);
  });

  it('total=20, page=20 shows first + ellipsis + last pages', () => {
    const el = makePager({ total: 20, page: 20 });
    expect(listTokens(el)).toEqual([
      'prev', '1', '…', '19', '20', 'next',
    ]);
  });

  it('sibling-count=2 widens the middle range', () => {
    const el = makePager({ total: 20, page: 10, siblingCount: 2 });
    expect(listTokens(el)).toEqual([
      'prev', '1', '…', '8', '9', '10', '11', '12', '…', '20', 'next',
    ]);
  });
});

describe('FoundryPagination — current page styling', () => {
  it('current page button carries aria-current="page" and page-current part', () => {
    const el = makePager({ total: 5, page: 3 });
    const current = el.shadowRoot?.querySelector('button[aria-current="page"]');
    expect(current?.getAttribute('part')).toBe('page page-current');
    expect(current?.textContent).toBe('3');
  });

  it('no other button has aria-current', () => {
    const el = makePager({ total: 5, page: 3 });
    const currents = el.shadowRoot?.querySelectorAll('[aria-current]');
    expect(currents?.length).toBe(1);
  });
});

describe('FoundryPagination — click dispatches change', () => {
  it('clicking a numbered page fires change with detail.page', () => {
    const el = makePager({ total: 5, page: 3 });
    let detail: { page: number } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ page: number }>).detail;
    });
    const buttons = pageButtons(el);
    const target = buttons.find((b) => b.textContent === '2');
    target?.click();
    expect(detail?.page).toBe(2);
  });

  it('clicking next advances the page', () => {
    const el = makePager({ total: 5, page: 3 });
    let detail: { page: number } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ page: number }>).detail;
    });
    nextButton(el).click();
    expect(detail?.page).toBe(4);
  });

  it('clicking prev decrements the page', () => {
    const el = makePager({ total: 5, page: 3 });
    let detail: { page: number } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ page: number }>).detail;
    });
    prevButton(el).click();
    expect(detail?.page).toBe(2);
  });

  it('clicking the current page is a no-op (no change event)', () => {
    const el = makePager({ total: 5, page: 3 });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    const current = el.shadowRoot?.querySelector(
      'button[aria-current="page"]',
    ) as HTMLButtonElement;
    current?.click();
    expect(fired).toBe(0);
  });

  it('change event bubbles + composes across shadow boundaries', () => {
    const outer = document.createElement('div');
    const el = makePager({ total: 5, page: 2 });
    outer.appendChild(el);
    document.body.appendChild(outer);
    let received = false;
    outer.addEventListener('change', () => {
      received = true;
    });
    nextButton(el).click();
    expect(received).toBe(true);
  });

  it('clicking on the list background (non-button area) is ignored', () => {
    const el = makePager({ total: 5, page: 2 });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    const list = el.shadowRoot?.querySelector('[part="list"]') as HTMLElement;
    list.click();
    expect(fired).toBe(0);
  });

  it('clicking ellipsis (non-button) is ignored', () => {
    const el = makePager({ total: 20, page: 10 });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    const ellipsis = el.shadowRoot?.querySelector('[part="ellipsis"]') as HTMLElement;
    ellipsis.click();
    expect(fired).toBe(0);
  });
});

describe('FoundryPagination — boundary disable', () => {
  it('disables prev when page=1', () => {
    const el = makePager({ total: 5, page: 1 });
    expect(prevButton(el).hasAttribute('disabled')).toBe(true);
    expect(nextButton(el).hasAttribute('disabled')).toBe(false);
  });

  it('disables next when page=total', () => {
    const el = makePager({ total: 5, page: 5 });
    expect(prevButton(el).hasAttribute('disabled')).toBe(false);
    expect(nextButton(el).hasAttribute('disabled')).toBe(true);
  });

  it('clicking disabled prev does not fire change', () => {
    const el = makePager({ total: 5, page: 1 });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    prevButton(el).click();
    expect(fired).toBe(0);
  });
});

describe('FoundryPagination — keyboard', () => {
  it('ArrowRight moves focus to the next enabled button', () => {
    const el = makePager({ total: 5, page: 3 });
    const buttons = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );
    buttons[0]?.focus();
    buttons[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(el.shadowRoot?.activeElement).toBe(buttons[1]);
  });

  it('Home / End jump to first / last enabled buttons', () => {
    const el = makePager({ total: 5, page: 3 });
    const buttons = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );
    buttons[2]?.focus();
    buttons[2]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    expect(el.shadowRoot?.activeElement).toBe(buttons[buttons.length - 1]);

    buttons[buttons.length - 1]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(el.shadowRoot?.activeElement).toBe(buttons[0]);
  });

  it('ArrowLeft wraps from first to last', () => {
    const el = makePager({ total: 5, page: 3 });
    const buttons = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );
    buttons[0]?.focus();
    buttons[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(el.shadowRoot?.activeElement).toBe(buttons[buttons.length - 1]);
  });

  it('non-arrow / non-home / non-end keys are no-ops', () => {
    const el = makePager({ total: 5, page: 3 });
    const buttons = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );
    buttons[0]?.focus();
    buttons[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    // Focus stays put.
    expect(el.shadowRoot?.activeElement).toBe(buttons[0]);
  });

  it('keydown from a non-button target is ignored', () => {
    const el = makePager({ total: 5, page: 3 });
    const ellipsis = el.shadowRoot?.querySelector('[part="ellipsis"]');
    // total=5 has no ellipsis; use the list itself.
    const list = el.shadowRoot?.querySelector('[part="list"]') as HTMLElement;
    expect(() => {
      list.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      );
    }).not.toThrow();
    // Sanity: no crash, no focus change.
    expect(ellipsis).toBeNull();
  });
});

describe('FoundryPagination — i18n labels', () => {
  it('prev-label + next-label reflect onto aria-labels', () => {
    const el = makePager({ total: 5, page: 2 });
    el.setAttribute('prev-label', 'Précédent');
    el.setAttribute('next-label', 'Suivant');
    expect(prevButton(el).getAttribute('aria-label')).toBe('Précédent');
    expect(nextButton(el).getAttribute('aria-label')).toBe('Suivant');
  });

  it('page-label forms per-button aria-labels', () => {
    const el = makePager({ total: 5, page: 2 });
    el.setAttribute('page-label', 'Aller à la page');
    const buttons = pageButtons(el);
    const page3 = buttons.find((b) => b.textContent === '3');
    expect(page3?.getAttribute('aria-label')).toBe('Aller à la page 3');
  });
});

describe('FoundryPagination — attribute validation / clamping', () => {
  it('page below 1 clamps to 1 in rendering', () => {
    const el = makePager({ page: 0, total: 5 });
    // After render the prev button should be disabled (treated as page 1).
    expect(prevButton(el).hasAttribute('disabled')).toBe(true);
  });

  it('page above total clamps to total in rendering', () => {
    const el = makePager({ page: 99, total: 5 });
    // Next button should be disabled (treated as page=5 = total).
    expect(nextButton(el).hasAttribute('disabled')).toBe(true);
  });

  it('total < 1 still renders with single page', () => {
    const el = makePager({ total: 0 });
    expect(listTokens(el)).toEqual(['prev', '1', 'next']);
  });

  it('non-finite total falls back to default', () => {
    const el = makePager();
    el.setAttribute('total', 'not-a-number');
    // After the attribute-change re-render, defaults to total=1 → only
    // page 1 renders.
    expect(listTokens(el)).toEqual(['prev', '1', 'next']);
  });

  it('non-finite page falls back to default page=1', () => {
    const el = makePager({ total: 5 });
    el.setAttribute('page', 'NaN');
    // Defaults to page=1 → prev is disabled.
    expect(prevButton(el).hasAttribute('disabled')).toBe(true);
  });

  it('negative sibling-count falls back to default', () => {
    const el = makePager({ total: 20, page: 10 });
    el.setAttribute('sibling-count', '-3');
    // Default sibling-count=1 → same rendering as before.
    expect(listTokens(el)).toEqual([
      'prev', '1', '…', '9', '10', '11', '…', '20', 'next',
    ]);
  });

  it('non-finite sibling-count falls back to default', () => {
    const el = makePager({ total: 20, page: 10 });
    el.setAttribute('sibling-count', 'nope');
    expect(listTokens(el)).toEqual([
      'prev', '1', '…', '9', '10', '11', '…', '20', 'next',
    ]);
  });
});

describe('FoundryPagination — re-renders on attribute changes', () => {
  it('changing page updates the current button', () => {
    const el = makePager({ total: 5, page: 2 });
    (el as unknown as { page: number }).page = 4;
    const current = el.shadowRoot?.querySelector('button[aria-current="page"]');
    expect(current?.textContent).toBe('4');
  });

  it('changing total re-renders the pager', () => {
    const el = makePager({ total: 3, page: 1 });
    expect(listTokens(el)).toEqual(['prev', '1', '2', '3', 'next']);
    (el as unknown as { total: number }).total = 5;
    expect(listTokens(el)).toEqual(['prev', '1', '2', '3', '4', '5', 'next']);
  });

  it('changing sibling-count re-renders the pager', () => {
    const el = makePager({ total: 20, page: 10, siblingCount: 1 });
    expect(listTokens(el)).toEqual([
      'prev', '1', '…', '9', '10', '11', '…', '20', 'next',
    ]);
    (el as unknown as { siblingCount: number }).siblingCount = 2;
    expect(listTokens(el)).toEqual([
      'prev', '1', '…', '8', '9', '10', '11', '12', '…', '20', 'next',
    ]);
  });
});

describe('FoundryPagination — propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makePager({ total: 5, page: 2 });
    const before = listTokens(el);
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
    expect(listTokens(el)).toEqual(before);
  });
});
