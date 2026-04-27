import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryStack, type StackSpace } from './stack.ts';

FoundryStack.define();

interface StackArgs {
  space: StackSpace;
}

const meta: Meta<StackArgs> = {
  title: 'Layout/Stack',
  component: 'foundry-stack',
  argTypes: {
    space: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
  },
  args: {
    space: 'md',
  },
};

export default meta;

type Story = StoryObj<StackArgs>;

const box = (label: string) => html`
  <div
    style="padding:0.5rem 0.75rem; background:var(--foundry-color-surface-raised, #eef); border-radius:var(--foundry-radius-sm); font-family:sans-serif;"
  >
    ${label}
  </div>
`;

export const Default: Story = {
  render: ({ space }) => html`
    <foundry-stack space=${space}>
      ${box('item one')}
      ${box('item two')}
      ${box('item three')}
    </foundry-stack>
  `,
};

const spaces: StackSpace[] = ['xs', 'sm', 'md', 'lg'];

export const SpaceScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1.5rem;">
      ${spaces.map((s) => html`
        <div>
          <p style="font-family:sans-serif; font-size:0.75rem; margin:0 0 0.5rem;">space=${s}</p>
          <foundry-stack space=${s}>
            ${box('a')}
            ${box('b')}
            ${box('c')}
          </foundry-stack>
        </div>
      `)}
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
        <foundry-stack space="md">
          ${box('item one')}
          ${box('item two')}
          ${box('item three')}
        </foundry-stack>
      </div>
      <div
        data-theme="dark"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p>Dark</p>
        <foundry-stack space="md">
          ${box('item one')}
          ${box('item two')}
          ${box('item three')}
        </foundry-stack>
      </div>
    </div>
  `,
};
