import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryCluster } from '../cluster/cluster.ts';
import { FoundryDivider, type DividerOrientation } from './divider.ts';

FoundryDivider.define();
FoundryCluster.define();

interface DividerArgs {
  orientation: DividerOrientation;
}

const meta: Meta<DividerArgs> = {
  title: 'Layout/Divider',
  component: 'foundry-divider',
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
  args: {
    orientation: 'horizontal',
  },
};

export default meta;

type Story = StoryObj<DividerArgs>;

export const Default: Story = {
  render: ({ orientation }) => html`
    <div style="width:280px; padding:0.75rem; border:1px dashed var(--foundry-color-border, #ccc);">
      <foundry-divider orientation=${orientation}></foundry-divider>
    </div>
  `,
};

export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="width:360px; font-family:sans-serif;">
      <p style="margin:0 0 0.75rem;">Section A — some sample copy above the rule.</p>
      <foundry-divider></foundry-divider>
      <p style="margin:0.75rem 0 0;">Section B — some sample copy below the rule.</p>
    </div>
  `,
};

const chip = (label: string) => html`
  <span
    style="padding:0.25rem 0.625rem; background:var(--foundry-color-surface-raised, #eef); border-radius:var(--foundry-radius-sm); font-family:sans-serif; font-size:0.875rem;"
  >
    ${label}
  </span>
`;

export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-cluster space="sm">
      ${chip('alpha')}
      <foundry-divider orientation="vertical"></foundry-divider>
      ${chip('beta')}
      <foundry-divider orientation="vertical"></foundry-divider>
      ${chip('gamma')}
    </foundry-cluster>
  `,
};

export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
      <div
        data-theme="light"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p style="margin:0 0 0.5rem; font-family:sans-serif;">Light</p>
        <foundry-divider></foundry-divider>
        <p style="margin:0.5rem 0 0; font-family:sans-serif;">after the rule</p>
      </div>
      <div
        data-theme="dark"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p style="margin:0 0 0.5rem; font-family:sans-serif;">Dark</p>
        <foundry-divider></foundry-divider>
        <p style="margin:0.5rem 0 0; font-family:sans-serif;">after the rule</p>
      </div>
    </div>
  `,
};
