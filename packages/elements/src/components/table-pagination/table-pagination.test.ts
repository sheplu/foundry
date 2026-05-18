import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryTablePagination } from './table-pagination.ts';
import { FoundryTable } from '../table/table.ts';
import { FoundryThead } from '../thead/thead.ts';
import { FoundryTbody } from '../tbody/tbody.ts';
import { FoundryTr } from '../tr/tr.ts';
import { FoundryTh } from '../th/th.ts';
import { FoundryTd } from '../td/td.ts';

beforeAll(() => {
  FoundryTablePagination.define();
  FoundryTable.define();
  FoundryThead.define();
  FoundryTbody.define();
  FoundryTr.define();
  FoundryTh.define();
  FoundryTd.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-table-pagination-test-${++counter}`;
  class Sub extends FoundryTablePagination {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function buildTableMarkup(rowCount: number, headerSortable = false): string {
  const headers = headerSortable
    ? '<foundry-th sortable>Name</foundry-th><foundry-th sortable>Age</foundry-th>'
    : '<foundry-th>Name</foundry-th><foundry-th>Age</foundry-th>';
  const rows = Array.from({ length: rowCount }, (_, i) =>
    `<foundry-tr><foundry-td>Row ${i + 1}</foundry-td><foundry-td>${20 + i}</foundry-td></foundry-tr>`,
  ).join('');
  return `
    <foundry-table label="Test">
      <foundry-thead><foundry-tr>${headers}</foundry-tr></foundry-thead>
      <foundry-tbody>${rows}</foundry-tbody>
    </foundry-table>
  `;
}

async function makeWrapper(opts: {
  rowCount?: number;
  page?: number;
  pageSize?: number;
  sortable?: boolean;
} = {}): Promise<FoundryTablePagination> {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryTablePagination;
  if (opts.page !== undefined) el.setAttribute('page', String(opts.page));
  if (opts.pageSize !== undefined) el.setAttribute('page-size', String(opts.pageSize));
  el.innerHTML = buildTableMarkup(opts.rowCount ?? 25, opts.sortable);
  document.body.appendChild(el);
  await raf();
  return el;
}

function bodyRows(el: FoundryTablePagination): HTMLElement[] {
  return Array.from(
    el.querySelectorAll<HTMLElement>('foundry-tbody foundry-tr'),
  );
}

function visibleRowCount(el: FoundryTablePagination): number {
  return bodyRows(el).filter((r) => !r.hasAttribute('hidden')).length;
}

function innerPagination(el: FoundryTablePagination): HTMLElement {
  const p = el.shadowRoot?.querySelector('foundry-pagination');
  if (!(p instanceof HTMLElement)) throw new Error('inner pagination missing');
  return p;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTablePagination.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-table-pagination')).toBe(FoundryTablePagination);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-table-pagination-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryTablePagination.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTablePagination defaults', () => {
  it('defaults page=1, page-size=10', async () => {
    const el = await makeWrapper();
    expect((el as unknown as { page: number }).page).toBe(1);
    expect((el as unknown as { pageSize: number }).pageSize).toBe(10);
  });

  it('renders an inner foundry-pagination', async () => {
    const el = await makeWrapper();
    expect(innerPagination(el)).toBeTruthy();
  });
});

describe('FoundryTablePagination — slot integration', () => {
  it('with 25 rows + page-size=10, only first 10 are visible', async () => {
    const el = await makeWrapper({ rowCount: 25 });
    expect(visibleRowCount(el)).toBe(10);
    expect(bodyRows(el)[0]?.hasAttribute('hidden')).toBe(false);
    expect(bodyRows(el)[10]?.hasAttribute('hidden')).toBe(true);
  });

  it('page=2 with 25 rows shows rows 11-20', async () => {
    const el = await makeWrapper({ rowCount: 25, page: 2 });
    const rows = bodyRows(el);
    expect(rows[10]?.hasAttribute('hidden')).toBe(false);
    expect(rows[19]?.hasAttribute('hidden')).toBe(false);
    expect(rows[9]?.hasAttribute('hidden')).toBe(true);
    expect(rows[20]?.hasAttribute('hidden')).toBe(true);
  });

  it('page=3 with 25 rows shows the trailing 5 rows', async () => {
    const el = await makeWrapper({ rowCount: 25, page: 3 });
    expect(visibleRowCount(el)).toBe(5);
  });
});

describe('FoundryTablePagination — pagination wiring', () => {
  it('inner pagination total = ceil(rows / pageSize)', async () => {
    const el = await makeWrapper({ rowCount: 25, pageSize: 10 });
    const inner = innerPagination(el);
    expect((inner as unknown as { total: number }).total).toBe(3);
  });

  it('change event from inner pagination updates the host page + visibility', async () => {
    const el = await makeWrapper({ rowCount: 25 });
    const inner = innerPagination(el);
    inner.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { page: 2 },
    }));
    expect(Number(el.getAttribute('page'))).toBe(2);
    expect(bodyRows(el)[10]?.hasAttribute('hidden')).toBe(false);
  });

  it('re-emits change event from the host with detail.page', async () => {
    const el = await makeWrapper({ rowCount: 25 });
    let received: { page: number } | undefined;
    el.addEventListener('change', (e) => {
      received = (e as CustomEvent<{ page: number }>).detail;
    });
    const inner = innerPagination(el);
    inner.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { page: 3 },
    }));
    expect(received?.page).toBe(3);
  });
});

describe('FoundryTablePagination — sort reset', () => {
  it('bubbled sort event from a foundry-th resets page to 1', async () => {
    const el = await makeWrapper({ rowCount: 25, page: 3, sortable: true });
    expect(Number(el.getAttribute('page'))).toBe(3);
    const th = el.querySelector('foundry-th');
    th?.dispatchEvent(new CustomEvent('sort', {
      bubbles: true,
      composed: true,
      detail: { direction: 'asc' },
    }));
    expect(Number(el.getAttribute('page'))).toBe(1);
  });

  it('sort event already on page 1 is a no-op', async () => {
    const el = await makeWrapper({ rowCount: 25, sortable: true });
    expect((el as unknown as { page: number }).page).toBe(1);
    const th = el.querySelector('foundry-th');
    th?.dispatchEvent(new CustomEvent('sort', {
      bubbles: true,
      composed: true,
      detail: { direction: 'asc' },
    }));
    expect((el as unknown as { page: number }).page).toBe(1);
  });

  it('sort event from a non-foundry-th target is ignored', async () => {
    const el = await makeWrapper({ rowCount: 25, page: 2 });
    el.dispatchEvent(new CustomEvent('sort', {
      bubbles: true,
      composed: true,
      detail: { direction: 'asc' },
    }));
    expect(Number(el.getAttribute('page'))).toBe(2);
  });
});

describe('FoundryTablePagination — mutation handling', () => {
  it('adding a row recomputes total + re-applies visibility', async () => {
    const el = await makeWrapper({ rowCount: 10 });
    const inner = innerPagination(el);
    expect((inner as unknown as { total: number }).total).toBe(1);
    const tbody = el.querySelector('foundry-tbody');
    const newRow = document.createElement('foundry-tr');
    newRow.innerHTML = '<foundry-td>New</foundry-td><foundry-td>99</foundry-td>';
    for (let i = 0; i < 5; i += 1) {
      tbody?.appendChild(newRow.cloneNode(true));
    }
    await raf();
    expect((inner as unknown as { total: number }).total).toBe(2);
  });

  it('removing rows past the current page clamps page down', async () => {
    const el = await makeWrapper({ rowCount: 25, page: 3 });
    const tbody = el.querySelector('foundry-tbody');
    // Remove the trailing 15 rows (leaving 10), forcing page 3 invalid.
    const allRows = Array.from(tbody?.querySelectorAll('foundry-tr') ?? []);
    for (let i = 10; i < allRows.length; i += 1) {
      allRows[i]?.remove();
    }
    await raf();
    expect(Number(el.getAttribute('page'))).toBe(1);
  });
});

describe('FoundryTablePagination — page-size handling', () => {
  it('changing page-size recomputes total + visibility', async () => {
    const el = await makeWrapper({ rowCount: 25, pageSize: 10 });
    expect(visibleRowCount(el)).toBe(10);
    (el as unknown as { pageSize: number }).pageSize = 5;
    expect(visibleRowCount(el)).toBe(5);
  });

  it('non-finite page-size falls back to default 10', async () => {
    const el = await makeWrapper({ rowCount: 25 });
    el.setAttribute('page-size', 'not-a-number');
    // After attr change → fromAttribute returns null for NaN → readProperty
    // returns null → #readPageSize falls back to 10.
    expect(visibleRowCount(el)).toBe(10);
  });

  it('page-size=0 falls back to default 10', async () => {
    const el = await makeWrapper({ rowCount: 25 });
    (el as unknown as { pageSize: number }).pageSize = 0;
    expect(visibleRowCount(el)).toBe(10);
  });
});

describe('FoundryTablePagination — page clamping', () => {
  it('page above total clamps to total', async () => {
    const el = await makeWrapper({ rowCount: 25, page: 99 });
    expect(Number(el.getAttribute('page'))).toBe(3);
  });

  it('page below 1 clamps to 1', async () => {
    const el = await makeWrapper({ rowCount: 25, page: 0 });
    expect(Number(el.getAttribute('page'))).toBe(1);
  });
});

describe('FoundryTablePagination — totalPages getter', () => {
  it('exposes totalPages reflecting current state', async () => {
    const el = await makeWrapper({ rowCount: 25, pageSize: 10 });
    expect(el.totalPages).toBe(3);
  });

  it('totalPages floors to 1 even when there are zero rows', async () => {
    const el = await makeWrapper({ rowCount: 0 });
    expect(el.totalPages).toBe(1);
  });

  it('visibleRows returns only currently-shown rows', async () => {
    const el = await makeWrapper({ rowCount: 25, pageSize: 10 });
    expect(el.visibleRows.length).toBe(10);
    (el as unknown as { page: number }).page = 3;
    expect(el.visibleRows.length).toBe(5);
  });
});

describe('FoundryTablePagination — empty slot', () => {
  it('handles being mounted without a table inside', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTablePagination;
    document.body.appendChild(el);
    await raf();
    expect(el.totalPages).toBe(1);
    expect(el.visibleRows.length).toBe(0);
  });
});

describe('FoundryTablePagination — labels forwarding', () => {
  it('forwards prev-label onto inner pagination', async () => {
    const el = await makeWrapper({ rowCount: 25 });
    el.setAttribute('prev-label', 'Précédent');
    const inner = innerPagination(el);
    expect((inner as unknown as { prevLabel: string }).prevLabel).toBe('Précédent');
  });

  it('forwards sibling-count', async () => {
    const el = await makeWrapper({ rowCount: 100 });
    el.setAttribute('sibling-count', '2');
    const inner = innerPagination(el);
    expect((inner as unknown as { siblingCount: number }).siblingCount).toBe(2);
  });
});

describe('FoundryTablePagination — propertyChanged filter', () => {
  it('ignores unknown property names', async () => {
    const el = await makeWrapper({ rowCount: 5 });
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});
