import { expect } from '@open-wc/testing';
import {
  FoundryTable,
  FoundryThead,
  FoundryTbody,
  FoundryTr,
  FoundryTh,
  FoundryTd,
} from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryTable.define();
FoundryThead.define();
FoundryTbody.define();
FoundryTr.define();
FoundryTh.define();
FoundryTd.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

const sampleTable = `
  <foundry-table label="Users">
    <foundry-thead>
      <foundry-tr>
        <foundry-th sortable data-testid="th-name">Name</foundry-th>
        <foundry-th sortable data-testid="th-age">Age</foundry-th>
        <foundry-th>City</foundry-th>
      </foundry-tr>
    </foundry-thead>
    <foundry-tbody>
      <foundry-tr>
        <foundry-td>Alice</foundry-td><foundry-td>32</foundry-td><foundry-td>Paris</foundry-td>
      </foundry-tr>
      <foundry-tr>
        <foundry-td>Bob</foundry-td><foundry-td>28</foundry-td><foundry-td>NYC</foundry-td>
      </foundry-tr>
      <foundry-tr>
        <foundry-td>Chen</foundry-td><foundry-td>45</foundry-td><foundry-td>Tokyo</foundry-td>
      </foundry-tr>
    </foundry-tbody>
  </foundry-table>
`;

describe('<foundry-table> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a default 3-column / 3-row table', async () => {
    const el = mount<FoundryTable>(sampleTable);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with bordered + striped + compact', async () => {
    const el = mount<FoundryTable>(`
      <foundry-table variant="striped" bordered compact label="Users">
        <foundry-thead>
          <foundry-tr><foundry-th>Name</foundry-th></foundry-tr>
        </foundry-thead>
        <foundry-tbody>
          <foundry-tr><foundry-td>Alice</foundry-td></foundry-tr>
        </foundry-tbody>
      </foundry-table>
    `);
    await raf();
    await expectA11y(el);
  });

  it('clicking a sortable header dispatches sort with detail.direction="asc"', async () => {
    const el = mount<FoundryTable>(sampleTable);
    await raf();
    let detail: { direction: string } | undefined;
    el.addEventListener('sort', (e) => {
      detail = (e as CustomEvent<{ direction: string }>).detail;
    });
    const nameHeader = el.querySelector<FoundryTh>('[data-testid="th-name"]');
    const button = nameHeader?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]');
    button?.click();
    expect(detail?.direction).to.equal('asc');
  });

  it('clicking a different sortable header clears prior direction (parent coordination)', async () => {
    const el = mount<FoundryTable>(sampleTable);
    await raf();
    const nameHeader = el.querySelector<FoundryTh>('[data-testid="th-name"]');
    const ageHeader = el.querySelector<FoundryTh>('[data-testid="th-age"]');
    // Simulate consumer writing direction back after sort.
    nameHeader?.setAttribute('direction', 'asc');
    expect(nameHeader?.getAttribute('direction')).to.equal('asc');
    // Click Age — table parent should clear Name's direction.
    ageHeader?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]')?.click();
    expect(nameHeader?.getAttribute('direction')).to.equal('none');
  });

  it('aria-sort on the inner <th> reflects the host direction', async () => {
    const el = mount<FoundryTable>(sampleTable);
    await raf();
    const nameHeader = el.querySelector<FoundryTh>('[data-testid="th-name"]');
    nameHeader?.setAttribute('direction', 'asc');
    const innerTh = nameHeader?.shadowRoot?.querySelector('th[part="cell"]');
    expect(innerTh?.getAttribute('aria-sort')).to.equal('ascending');
  });

  it('inner <table> carries aria-label from host label', async () => {
    const el = mount<FoundryTable>(`
      <foundry-table label="Sales by region"></foundry-table>
    `);
    await raf();
    const inner = el.shadowRoot?.querySelector('table[part="table"]');
    expect(inner?.getAttribute('aria-label')).to.equal('Sales by region');
  });

  it('cycles direction asc → desc on a second click of the same header', async () => {
    const el = mount<FoundryTable>(sampleTable);
    await raf();
    const directions: string[] = [];
    el.addEventListener('sort', (e) => {
      directions.push((e as CustomEvent<{ direction: string }>).detail.direction);
    });
    const nameHeader = el.querySelector<FoundryTh>('[data-testid="th-name"]');
    const button = nameHeader?.shadowRoot?.querySelector<HTMLButtonElement>('button[part="button"]');
    button?.click();
    nameHeader?.setAttribute('direction', 'asc');
    button?.click();
    expect(directions).to.deep.equal(['asc', 'desc']);
  });
});
