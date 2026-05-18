import { expect } from '@open-wc/testing';
import {
  FoundryTablePagination,
  FoundryTable,
  FoundryThead,
  FoundryTbody,
  FoundryTr,
  FoundryTh,
  FoundryTd,
} from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryTablePagination.define();
FoundryTable.define();
FoundryThead.define();
FoundryTbody.define();
FoundryTr.define();
FoundryTh.define();
FoundryTd.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function buildSample(rowCount = 12, sortable = false): string {
  const headers = sortable
    ? '<foundry-th sortable>Name</foundry-th>'
    : '<foundry-th>Name</foundry-th>';
  const rows = Array.from({ length: rowCount }, (_, i) =>
    `<foundry-tr><foundry-td>Row ${i + 1}</foundry-td></foundry-tr>`,
  ).join('');
  return `
    <foundry-table-pagination page-size="5">
      <foundry-table label="Items">
        <foundry-thead><foundry-tr>${headers}</foundry-tr></foundry-thead>
        <foundry-tbody>${rows}</foundry-tbody>
      </foundry-table>
    </foundry-table-pagination>
  `;
}

describe('<foundry-table-pagination> functional', () => {
  afterEach(() => cleanup());

  it('passes axe at default state (table + pagination rendered)', async () => {
    const el = mount<FoundryTablePagination>(buildSample(12));
    await raf();
    await expectA11y(el);
  });

  it('clicking inner pagination "Next" hides current rows and shows next page', async () => {
    const el = mount<FoundryTablePagination>(buildSample(12));
    await raf();
    const rows = el.querySelectorAll<HTMLElement>('foundry-tbody foundry-tr');
    expect(rows[0]?.hasAttribute('hidden')).to.equal(false);
    expect(rows[5]?.hasAttribute('hidden')).to.equal(true);

    const inner = el.shadowRoot?.querySelector('foundry-pagination');
    const nextBtn = inner?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="next"]');
    nextBtn?.click();
    await raf();

    expect(rows[0]?.hasAttribute('hidden')).to.equal(true);
    expect(rows[5]?.hasAttribute('hidden')).to.equal(false);
  });

  it('clicking a sortable header on the inner table resets page to 1', async () => {
    const el = mount<FoundryTablePagination>(buildSample(12, true));
    await raf();
    // Move to page 3 first.
    (el as unknown as { page: number }).page = 3;
    await raf();
    expect((el as unknown as { page: number }).page).to.equal(3);

    const th = el.querySelector('foundry-th');
    const sortBtn = th?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]');
    sortBtn?.click();
    await raf();
    expect((el as unknown as { page: number }).page).to.equal(1);
  });

  it('adding a row programmatically recomputes total', async () => {
    const el = mount<FoundryTablePagination>(buildSample(10));
    await raf();
    const inner = el.shadowRoot?.querySelector('foundry-pagination');
    expect((inner as unknown as { total: number }).total).to.equal(2);
    const tbody = el.querySelector('foundry-tbody');
    for (let i = 0; i < 5; i += 1) {
      const row = document.createElement('foundry-tr');
      row.innerHTML = '<foundry-td>Added</foundry-td>';
      tbody?.appendChild(row);
    }
    await raf();
    expect((inner as unknown as { total: number }).total).to.equal(3);
  });

  it('forwards prev-label onto the inner pagination', async () => {
    const el = mount<FoundryTablePagination>(buildSample(12));
    el.setAttribute('prev-label', 'Précédent');
    await raf();
    const inner = el.shadowRoot?.querySelector('foundry-pagination');
    expect((inner as unknown as { prevLabel: string }).prevLabel).to.equal('Précédent');
  });
});
