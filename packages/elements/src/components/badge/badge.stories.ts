import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryIcon, check, close } from '@foundry/icons';
import { FoundryBadge, type BadgeVariant } from './badge.ts';

FoundryBadge.define();
FoundryIcon.register({ check, close });
FoundryIcon.define();

interface BadgeArgs {
  variant: BadgeVariant;
  label: string;
}

const meta: Meta<BadgeArgs> = {
  title: 'Data/Badge',
  component: 'foundry-badge',
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    label: { control: 'text' },
  },
  args: {
    variant: 'neutral',
    label: 'new',
  },
};

export default meta;

type Story = StoryObj<BadgeArgs>;

const variants: BadgeVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

export const Default: Story = {
  render: ({ variant, label }) => html`
    <foundry-badge variant=${variant}>${label}</foundry-badge>
  `,
};

export const VariantScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; font-family:sans-serif;">
      ${variants.map((v) => html`
        <foundry-badge variant=${v}>${v}</foundry-badge>
      `)}
    </div>
  `,
};

export const WithIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; font-family:sans-serif;">
      <foundry-badge variant="success">
        <foundry-icon name="check"></foundry-icon>
        verified
      </foundry-badge>
      <foundry-badge variant="danger">
        <foundry-icon name="close"></foundry-icon>
        rejected
      </foundry-badge>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
  >
    <p style="margin:0 0 0.5rem; font-family:sans-serif;">${theme}</p>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap; font-family:sans-serif;">
      ${variants.map((v) => html`<foundry-badge variant=${v}>${v}</foundry-badge>`)}
    </div>
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
