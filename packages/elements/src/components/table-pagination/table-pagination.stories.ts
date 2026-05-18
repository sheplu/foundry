import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryTablePagination } from './table-pagination.ts';
import { FoundryTable } from '../table/table.ts';
import { FoundryThead } from '../thead/thead.ts';
import { FoundryTbody } from '../tbody/tbody.ts';
import { FoundryTr } from '../tr/tr.ts';
import { FoundryTh } from '../th/th.ts';
import { FoundryTd } from '../td/td.ts';

FoundryTablePagination.define();
FoundryTable.define();
FoundryThead.define();
FoundryTbody.define();
FoundryTr.define();
FoundryTh.define();
FoundryTd.define();

interface Args {
  page: number;
  pageSize: number;
  rowCount: number;
}

const meta: Meta<Args> = {
  title: 'Data/Table Pagination',
  component: 'foundry-table-pagination',
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    pageSize: { control: { type: 'number', min: 1, max: 100 } },
    rowCount: { control: { type: 'number', min: 0, max: 200 } },
  },
  args: {
    page: 1,
    pageSize: 10,
    rowCount: 25,
  },
};

export default meta;

type Story = StoryObj<Args>;

const generateRows = (count: number, sortable = false) => html`
  <foundry-table label="Users" variant="striped" bordered>
    <foundry-thead>
      <foundry-tr>
        <foundry-th ?sortable=${sortable}>Name</foundry-th>
        <foundry-th ?sortable=${sortable}>Email</foundry-th>
        <foundry-th>Role</foundry-th>
      </foundry-tr>
    </foundry-thead>
    <foundry-tbody>
      ${Array.from({ length: count }, (_, i) => html`
        <foundry-tr>
          <foundry-td>User ${i + 1}</foundry-td>
          <foundry-td>user${i + 1}@example.com</foundry-td>
          <foundry-td>${i % 3 === 0 ? 'Admin' : 'Member'}</foundry-td>
        </foundry-tr>
      `)}
    </foundry-tbody>
  </foundry-table>
`;

export const Default: Story = {
  render: ({ page, pageSize, rowCount }) => html`
    <foundry-table-pagination page=${page} page-size=${pageSize}>
      ${generateRows(rowCount)}
    </foundry-table-pagination>
  `,
};

export const LargeDataset: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table-pagination page-size="20">
      ${generateRows(100)}
    </foundry-table-pagination>
  `,
};

export const WithSort: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table-pagination
      page-size="10"
      @sort=${(e: Event) => {
        // Demo: write the new direction onto the originator so the chevron
        // flips. The wrapper resets to page 1 automatically.
        const target = e.target as Element;
        const detail = (e as CustomEvent<{ direction: 'asc' | 'desc' }>).detail;
        target.setAttribute('direction', detail.direction);
      }}
    >
      ${generateRows(25, true)}
    </foundry-table-pagination>
  `,
};

export const Localized: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table-pagination
      page-size="10"
      prev-label="Précédent"
      next-label="Suivant"
      page-label="Aller à la page"
      ellipsis-label="Plus de pages"
    >
      ${generateRows(25)}
    </foundry-table-pagination>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-table-pagination page-size="5">
      ${generateRows(15)}
    </foundry-table-pagination>
  </div>
`;

export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
      ${panel('light')}
      ${panel('dark')}
    </div>
  `,
};
