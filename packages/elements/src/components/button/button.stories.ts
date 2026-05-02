import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryButton, type ButtonType, type ButtonVariant } from './button.ts';

FoundryButton.define();

interface ButtonArgs {
  variant: ButtonVariant;
  disabled: boolean;
  loading: boolean;
  type: ButtonType;
  label: string;
}

const meta: Meta<ButtonArgs> = {
  title: 'Actions/Button',
  component: 'foundry-button',
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'danger'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    type: { control: 'inline-radio', options: ['button', 'submit', 'reset'] },
    label: { control: 'text' },
  },
  args: {
    variant: 'primary',
    disabled: false,
    loading: false,
    type: 'button',
    label: 'Button',
  },
};

export default meta;

type Story = StoryObj<ButtonArgs>;

export const Default: Story = {
  render: ({ variant, disabled, loading, type, label }) => html`
    <foundry-button
      variant=${variant}
      ?disabled=${disabled}
      ?loading=${loading}
      type=${type}
    >${label}</foundry-button>
  `,
};

const variants = ['primary', 'secondary', 'danger'] as const;

export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:repeat(2, auto); gap:1rem; align-items:start;">
      ${variants.flatMap((v) => [
        html`<foundry-button variant=${v}>${v}</foundry-button>`,
        html`<foundry-button variant=${v} disabled>${v} disabled</foundry-button>`,
      ])}
    </div>
  `,
};

export const Loading: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      ${variants.map((v) => html`<foundry-button variant=${v} loading>${v}</foundry-button>`)}
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
          ${variants.map((v) => html`<foundry-button variant=${v}>${v}</foundry-button>`)}
        </div>
      </div>
      <div
        data-theme="dark"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p>Dark</p>
        <div style="display:flex; gap:0.5rem;">
          ${variants.map((v) => html`<foundry-button variant=${v}>${v}</foundry-button>`)}
        </div>
      </div>
    </div>
  `,
};
