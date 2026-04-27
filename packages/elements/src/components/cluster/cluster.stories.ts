import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryCluster, type ClusterSpace } from './cluster.ts';

FoundryCluster.define();

interface ClusterArgs {
  space: ClusterSpace;
}

const meta: Meta<ClusterArgs> = {
  title: 'Layout/Cluster',
  component: 'foundry-cluster',
  argTypes: {
    space: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
  },
  args: {
    space: 'md',
  },
};

export default meta;

type Story = StoryObj<ClusterArgs>;

const chip = (label: string) => html`
  <span
    style="padding:0.25rem 0.625rem; background:var(--foundry-color-surface-raised, #eef); border-radius:var(--foundry-radius-sm); font-family:sans-serif; font-size:0.875rem;"
  >
    ${label}
  </span>
`;

export const Default: Story = {
  render: ({ space }) => html`
    <foundry-cluster space=${space}>
      ${chip('alpha')}
      ${chip('beta')}
      ${chip('gamma')}
    </foundry-cluster>
  `,
};

const spaces: ClusterSpace[] = ['xs', 'sm', 'md', 'lg'];

export const SpaceScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:1rem;">
      ${spaces.map((s) => html`
        <div>
          <p style="font-family:sans-serif; font-size:0.75rem; margin:0 0 0.25rem;">space=${s}</p>
          <foundry-cluster space=${s}>
            ${chip('a')}
            ${chip('b')}
            ${chip('c')}
          </foundry-cluster>
        </div>
      `)}
    </div>
  `,
};

export const Wrapping: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="max-width:320px; padding:0.5rem; border:1px dashed var(--foundry-color-border, #ccc);">
      <foundry-cluster space="sm">
        ${chip('one')}
        ${chip('two')}
        ${chip('three')}
        ${chip('four')}
        ${chip('five')}
        ${chip('six')}
        ${chip('seven')}
        ${chip('eight')}
        ${chip('nine')}
        ${chip('ten')}
      </foundry-cluster>
    </div>
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
        <p>Light</p>
        <foundry-cluster space="md">
          ${chip('alpha')}
          ${chip('beta')}
          ${chip('gamma')}
        </foundry-cluster>
      </div>
      <div
        data-theme="dark"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p>Dark</p>
        <foundry-cluster space="md">
          ${chip('alpha')}
          ${chip('beta')}
          ${chip('gamma')}
        </foundry-cluster>
      </div>
    </div>
  `,
};
