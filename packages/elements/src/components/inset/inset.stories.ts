import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryCluster } from '../cluster/cluster.ts';
import { FoundryStack } from '../stack/stack.ts';
import { FoundryInset, type InsetSpace } from './inset.ts';

FoundryInset.define();
FoundryCluster.define();
FoundryStack.define();

interface InsetArgs {
  space: InsetSpace;
}

const meta: Meta<InsetArgs> = {
  title: 'Layout/Inset',
  component: 'foundry-inset',
  argTypes: {
    space: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    space: 'md',
  },
};

export default meta;

type Story = StoryObj<InsetArgs>;

const surface = (content: ReturnType<typeof html>) => html`
  <div
    style="background:var(--foundry-color-surface-raised, #eef); border-radius:var(--foundry-radius-sm);"
  >
    ${content}
  </div>
`;

export const Default: Story = {
  render: ({ space }) => surface(html`
    <foundry-inset space=${space}>
      <span style="font-family:sans-serif;">padded content</span>
    </foundry-inset>
  `),
};

const spaces: InsetSpace[] = ['sm', 'md', 'lg'];

export const SpaceScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:1rem;">
      ${spaces.map((s) => html`
        <div>
          <p style="font-family:sans-serif; font-size:0.75rem; margin:0 0 0.25rem;">space=${s}</p>
          ${surface(html`
            <foundry-inset space=${s}>
              <span style="font-family:sans-serif;">padded content</span>
            </foundry-inset>
          `)}
        </div>
      `)}
    </div>
  `,
};

const chip = (label: string) => html`
  <span
    style="padding:0.25rem 0.625rem; background:var(--foundry-color-surface, #fff); border-radius:var(--foundry-radius-sm); font-family:sans-serif; font-size:0.875rem;"
  >
    ${label}
  </span>
`;

export const Nested: Story = {
  parameters: { controls: { disable: true } },
  render: () => surface(html`
    <foundry-inset space="md">
      <foundry-stack space="sm">
        <span style="font-family:sans-serif; font-weight:600;">Nested composition</span>
        <foundry-cluster space="sm">
          ${chip('alpha')}
          ${chip('beta')}
          ${chip('gamma')}
        </foundry-cluster>
      </foundry-stack>
    </foundry-inset>
  `),
};

export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
      <div
        data-theme="light"
        style="background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <foundry-inset space="md">
          <p style="margin:0 0 0.5rem; font-family:sans-serif;">Light</p>
          <span style="font-family:sans-serif;">padded surface</span>
        </foundry-inset>
      </div>
      <div
        data-theme="dark"
        style="background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <foundry-inset space="md">
          <p style="margin:0 0 0.5rem; font-family:sans-serif;">Dark</p>
          <span style="font-family:sans-serif;">padded surface</span>
        </foundry-inset>
      </div>
    </div>
  `,
};
