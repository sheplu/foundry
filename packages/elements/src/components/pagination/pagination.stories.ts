import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryPagination } from './pagination.ts';

FoundryPagination.define();

interface PaginationArgs {
  page: number;
  total: number;
  siblingCount: number;
}

const meta: Meta<PaginationArgs> = {
  title: 'Navigation/Pagination',
  component: 'foundry-pagination',
  argTypes: {
    page: { control: { type: 'number', min: 1, max: 50 } },
    total: { control: { type: 'number', min: 1, max: 50 } },
    siblingCount: { control: { type: 'number', min: 0, max: 3 } },
  },
  args: {
    page: 3,
    total: 12,
    siblingCount: 1,
  },
};

export default meta;

type Story = StoryObj<PaginationArgs>;

function bindPage(event: Event): void {
  const detail = (event as CustomEvent<{ page: number }>).detail;
  (event.currentTarget as Element).setAttribute('page', String(detail.page));
}

export const Default: Story = {
  render: ({ page, total, siblingCount }) => html`
    <foundry-pagination
      page=${page}
      total=${total}
      sibling-count=${siblingCount}
      @change=${bindPage}
    ></foundry-pagination>
  `,
};

export const FewPages: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-pagination page="2" total="3" @change=${bindPage}></foundry-pagination>
  `,
};

export const ManyPages: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-pagination page="25" total="50" @change=${bindPage}></foundry-pagination>
  `,
};

export const NearStart: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-pagination page="1" total="20" @change=${bindPage}></foundry-pagination>
  `,
};

export const NearEnd: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-pagination page="20" total="20" @change=${bindPage}></foundry-pagination>
  `,
};

export const LargeSiblingCount: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-pagination
      page="10"
      total="20"
      sibling-count="3"
      @change=${bindPage}
    ></foundry-pagination>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-pagination page="4" total="10" @change=${bindPage}></foundry-pagination>
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
