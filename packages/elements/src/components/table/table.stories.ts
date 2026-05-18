import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryTable, type TableVariant } from './table.ts';
import { FoundryThead } from '../thead/thead.ts';
import { FoundryTbody } from '../tbody/tbody.ts';
import { FoundryTr } from '../tr/tr.ts';
import { FoundryTh } from '../th/th.ts';
import { FoundryTd } from '../td/td.ts';

FoundryTable.define();
FoundryThead.define();
FoundryTbody.define();
FoundryTr.define();
FoundryTh.define();
FoundryTd.define();

interface TableArgs {
  variant: TableVariant;
  bordered: boolean;
  compact: boolean;
  label: string;
}

const meta: Meta<TableArgs> = {
  title: 'Data/Table',
  component: 'foundry-table',
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'striped'],
    },
    bordered: { control: { type: 'boolean' } },
    compact: { control: { type: 'boolean' } },
    label: { control: { type: 'text' } },
  },
  args: {
    variant: 'default',
    bordered: false,
    compact: false,
    label: 'Users',
  },
};

export default meta;

type Story = StoryObj<TableArgs>;

const sample = [
  { name: 'Alice', age: 32, city: 'Paris' },
  { name: 'Bob', age: 28, city: 'New York' },
  { name: 'Chen', age: 45, city: 'Singapore' },
  { name: 'Dahlia', age: 29, city: 'Lagos' },
  { name: 'Esteban', age: 51, city: 'Madrid' },
];

const renderRows = (data: typeof sample) => data.map((row) => html`
  <foundry-tr>
    <foundry-td>${row.name}</foundry-td>
    <foundry-td>${row.age}</foundry-td>
    <foundry-td>${row.city}</foundry-td>
  </foundry-tr>
`);

export const Default: Story = {
  render: ({ variant, bordered, compact, label }) => html`
    <foundry-table
      variant=${variant}
      ?bordered=${bordered}
      ?compact=${compact}
      label=${label}
    >
      <foundry-thead>
        <foundry-tr>
          <foundry-th>Name</foundry-th>
          <foundry-th>Age</foundry-th>
          <foundry-th>City</foundry-th>
        </foundry-tr>
      </foundry-thead>
      <foundry-tbody>${renderRows(sample)}</foundry-tbody>
    </foundry-table>
  `,
};

export const Striped: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table variant="striped" label="Users (striped)">
      <foundry-thead>
        <foundry-tr>
          <foundry-th>Name</foundry-th>
          <foundry-th>Age</foundry-th>
          <foundry-th>City</foundry-th>
        </foundry-tr>
      </foundry-thead>
      <foundry-tbody>${renderRows(sample)}</foundry-tbody>
    </foundry-table>
  `,
};

export const Bordered: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table bordered label="Users (bordered)">
      <foundry-thead>
        <foundry-tr>
          <foundry-th>Name</foundry-th>
          <foundry-th>Age</foundry-th>
          <foundry-th>City</foundry-th>
        </foundry-tr>
      </foundry-thead>
      <foundry-tbody>${renderRows(sample)}</foundry-tbody>
    </foundry-table>
  `,
};

export const Compact: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table compact label="Users (compact)">
      <foundry-thead>
        <foundry-tr>
          <foundry-th>Name</foundry-th>
          <foundry-th>Age</foundry-th>
          <foundry-th>City</foundry-th>
        </foundry-tr>
      </foundry-thead>
      <foundry-tbody>${renderRows(sample)}</foundry-tbody>
    </foundry-table>
  `,
};

function bindSort(event: Event): void {
  // Storybook stories aren't expected to mutate Lit state without a wrapper
  // — for the demo it's enough to write the new direction back onto the
  // clicked cell so the chevron flips. The parent <foundry-table> clears
  // sibling directions automatically on sort.
  const target = event.target as Element;
  const detail = (event as CustomEvent<{ direction: 'asc' | 'desc' }>).detail;
  target.setAttribute('direction', detail.direction);
}

export const Sortable: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table label="Users (sortable)" @sort=${bindSort}>
      <foundry-thead>
        <foundry-tr>
          <foundry-th sortable>Name</foundry-th>
          <foundry-th sortable>Age</foundry-th>
          <foundry-th>City</foundry-th>
        </foundry-tr>
      </foundry-thead>
      <foundry-tbody>${renderRows(sample)}</foundry-tbody>
    </foundry-table>
  `,
};

export const Combined: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-table
      variant="striped"
      bordered
      compact
      label="Users (combined)"
      @sort=${bindSort}
    >
      <foundry-thead>
        <foundry-tr>
          <foundry-th sortable>Name</foundry-th>
          <foundry-th sortable>Age</foundry-th>
          <foundry-th>City</foundry-th>
        </foundry-tr>
      </foundry-thead>
      <foundry-tbody>${renderRows(sample)}</foundry-tbody>
    </foundry-table>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-table variant="striped" bordered label="Users">
      <foundry-thead>
        <foundry-tr>
          <foundry-th>Name</foundry-th>
          <foundry-th>Age</foundry-th>
        </foundry-tr>
      </foundry-thead>
      <foundry-tbody>
        <foundry-tr>
          <foundry-td>Alice</foundry-td>
          <foundry-td>32</foundry-td>
        </foundry-tr>
        <foundry-tr>
          <foundry-td>Bob</foundry-td>
          <foundry-td>28</foundry-td>
        </foundry-tr>
      </foundry-tbody>
    </foundry-table>
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
