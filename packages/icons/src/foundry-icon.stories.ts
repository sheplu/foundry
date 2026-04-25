import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryIcon } from './foundry-icon.ts';
import { check, chevronDown, close } from './icons.ts';

FoundryIcon.register({ check, 'chevron-down': chevronDown, close });
FoundryIcon.define();

interface IconArgs {
  name: 'check' | 'chevron-down' | 'close';
  label: string;
}

const meta: Meta<IconArgs> = {
  title: 'Foundation/Icon',
  component: 'foundry-icon',
  argTypes: {
    name: { control: 'inline-radio', options: ['check', 'chevron-down', 'close'] },
    label: { control: 'text' },
  },
  args: {
    name: 'check',
    label: '',
  },
};

export default meta;

type Story = StoryObj<IconArgs>;

export const Default: Story = {
  render: ({ name, label }) => html`
    <foundry-icon
      name=${name}
      label=${label || ''}
      style="font-size: 2rem; color: var(--foundry-color-text-body);"
    ></foundry-icon>
  `,
};

const registered = ['check', 'chevron-down', 'close'] as const;

export const Gallery: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:1.5rem; color:var(--foundry-color-text-body);"
    >
      ${registered.map((n) => html`
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem;">
          <foundry-icon name=${n} label=${n} style="font-size: 2rem;"></foundry-icon>
          <code style="font-size: 0.875rem; color: var(--foundry-color-text-muted);">${n}</code>
        </div>
      `)}
    </div>
  `,
};

export const SizedAndColored: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:repeat(3, auto); gap:2rem; align-items:center;">
      <foundry-icon name="check" style="font-size: 1rem;"></foundry-icon>
      <foundry-icon name="check" style="font-size: 2rem;"></foundry-icon>
      <foundry-icon name="check" style="font-size: 3rem;"></foundry-icon>
      <foundry-icon
        name="close"
        style="font-size: 2rem; color: var(--foundry-color-action-primary);"
      ></foundry-icon>
      <foundry-icon
        name="close"
        style="font-size: 2rem; color: var(--foundry-color-action-danger);"
      ></foundry-icon>
      <foundry-icon
        name="close"
        style="font-size: 2rem; color: var(--foundry-color-text-muted);"
      ></foundry-icon>
    </div>
  `,
};
