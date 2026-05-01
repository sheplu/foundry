import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryBreadcrumb } from './breadcrumb.ts';
import { FoundryBreadcrumbs } from '../breadcrumbs/breadcrumbs.ts';
import { FoundryLink } from '../link/link.ts';

FoundryBreadcrumb.define();
FoundryBreadcrumbs.define();
FoundryLink.define();

const meta: Meta = {
  title: 'Navigation/Breadcrumb',
  component: 'foundry-breadcrumb',
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => html`
    <foundry-breadcrumbs>
      <foundry-breadcrumb>
        <foundry-link href="/docs">Docs</foundry-link>
      </foundry-breadcrumb>
      <foundry-breadcrumb current>Detail</foundry-breadcrumb>
    </foundry-breadcrumbs>
  `,
};

export const Current: Story = {
  render: () => html`
    <foundry-breadcrumbs>
      <foundry-breadcrumb current>Current page</foundry-breadcrumb>
    </foundry-breadcrumbs>
  `,
};

export const CustomSeparator: Story = {
  render: () => html`
    <foundry-breadcrumbs>
      <foundry-breadcrumb>
        <foundry-link href="/">Home</foundry-link>
        <span slot="separator" aria-hidden="true">›</span>
      </foundry-breadcrumb>
      <foundry-breadcrumb current>Detail</foundry-breadcrumb>
    </foundry-breadcrumbs>
  `,
};
