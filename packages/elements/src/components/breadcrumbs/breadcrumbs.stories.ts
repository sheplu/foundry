import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryBreadcrumbs } from './breadcrumbs.ts';
import { FoundryBreadcrumb } from '../breadcrumb/breadcrumb.ts';
import { FoundryLink } from '../link/link.ts';

FoundryBreadcrumbs.define();
FoundryBreadcrumb.define();
FoundryLink.define();

const meta: Meta = {
  title: 'Navigation/Breadcrumbs',
  component: 'foundry-breadcrumbs',
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <foundry-breadcrumbs>
      <foundry-breadcrumb>
        <foundry-link href="/">Home</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb>
        <foundry-link href="/docs">Docs</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb current>Breadcrumbs</foundry-breadcrumb>
    </foundry-breadcrumbs>
  `,
};

export const WithCustomSeparator: Story = {
  render: () => html`
    <foundry-breadcrumbs>
      <foundry-breadcrumb>
        <foundry-link href="/">Home</foundry-link>
        <span slot="separator" aria-hidden="true">›</span>
      </foundry-breadcrumb>
      <foundry-breadcrumb>
        <foundry-link href="/docs">Docs</foundry-link>
        <span slot="separator" aria-hidden="true">›</span>
      </foundry-breadcrumb>
      <foundry-breadcrumb current>Breadcrumbs</foundry-breadcrumb>
    </foundry-breadcrumbs>
  `,
};

export const LongTrail: Story = {
  render: () => html`
    <foundry-breadcrumbs>
      <foundry-breadcrumb>
        <foundry-link href="/">Home</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb>
        <foundry-link href="/products">Products</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb>
        <foundry-link href="/products/widgets">Widgets</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb>
        <foundry-link href="/products/widgets/sprockets">Sprockets</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb current>Model Seven</foundry-breadcrumb>
    </foundry-breadcrumbs>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-breadcrumbs>
      <foundry-breadcrumb>
        <foundry-link href="/">Home</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb>
        <foundry-link href="/docs">Docs</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb current>Breadcrumbs</foundry-breadcrumb>
    </foundry-breadcrumbs>
  </div>
`;

export const Theming: Story = {
  render: () => html`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
      ${panel('light')}
      ${panel('dark')}
    </div>
  `,
};
