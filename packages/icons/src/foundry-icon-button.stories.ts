import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryIcon } from './foundry-icon.ts';
import { FoundryIconButton } from './foundry-icon-button.ts';
import { check, chevronDown, close } from './icons.ts';

FoundryIcon.register({ check, 'chevron-down': chevronDown, close });
FoundryIconButton.define();
FoundryIcon.define();

interface IconButtonArgs {
  name: 'check' | 'chevron-down' | 'close';
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  disabled: boolean;
}

const meta: Meta<IconButtonArgs> = {
  title: 'Actions/IconButton',
  component: 'foundry-icon-button',
  argTypes: {
    name: { control: 'inline-radio', options: ['check', 'chevron-down', 'close'] },
    label: { control: 'text' },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger'] },
    disabled: { control: 'boolean' },
  },
  args: {
    name: 'close',
    label: 'Close',
    variant: 'secondary',
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<IconButtonArgs>;

export const Default: Story = {
  render: ({ name, label, variant, disabled }) => html`
    <foundry-icon-button
      name=${name}
      label=${label}
      variant=${variant}
      ?disabled=${disabled}
    ></foundry-icon-button>
  `,
};

const variants = ['primary', 'secondary', 'danger'] as const;

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:repeat(3, auto); gap:1rem; align-items:center;">
      ${variants.flatMap((v) => [
        html`<foundry-icon-button name="check" label="Confirm ${v}" variant=${v}></foundry-icon-button>`,
        html`<foundry-icon-button name="close" label="Close ${v}" variant=${v} disabled></foundry-icon-button>`,
        html`<span></span>`,
      ])}
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
        <div style="display:flex; gap:0.5rem;">
          ${variants.map((v) => html`
            <foundry-icon-button name="check" label="Confirm ${v}" variant=${v}></foundry-icon-button>
          `)}
        </div>
      </div>
      <div
        data-theme="dark"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p>Dark</p>
        <div style="display:flex; gap:0.5rem;">
          ${variants.map((v) => html`
            <foundry-icon-button name="check" label="Confirm ${v}" variant=${v}></foundry-icon-button>
          `)}
        </div>
      </div>
    </div>
  `,
};
