import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryButton } from '../button/button.ts';
import { FoundryLink } from '../link/link.ts';
import { FoundryNavbar, type NavbarVariant } from './navbar.ts';

FoundryNavbar.define();
FoundryButton.define();
FoundryLink.define();

interface NavbarArgs {
  variant: NavbarVariant;
  sticky: boolean;
  label: string;
}

const meta: Meta<NavbarArgs> = {
  title: 'Navigation/Navbar',
  component: 'foundry-navbar',
  argTypes: {
    variant: {
      control: { type: 'inline-radio' },
      options: ['flat', 'outlined', 'elevated'],
    },
    sticky: { control: { type: 'boolean' } },
    label: { control: { type: 'text' } },
  },
  args: {
    variant: 'outlined',
    sticky: false,
    label: 'Main navigation',
  },
};

export default meta;

type Story = StoryObj<NavbarArgs>;

export const Default: Story = {
  render: ({ variant, sticky, label }) => html`
    <foundry-navbar variant=${variant} ?sticky=${sticky} label=${label}>
      <strong slot="brand">Acme</strong>
      <foundry-link href="#overview">Overview</foundry-link>
      <foundry-link href="#pricing">Pricing</foundry-link>
      <foundry-link href="#docs">Docs</foundry-link>
      <foundry-button slot="actions">Sign in</foundry-button>
    </foundry-navbar>
  `,
};

export const BrandOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-navbar>
      <strong slot="brand">Acme</strong>
    </foundry-navbar>
  `,
};

export const WithActions: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-navbar>
      <strong slot="brand">Acme</strong>
      <foundry-button slot="actions" variant="secondary">Sign in</foundry-button>
      <foundry-button slot="actions">Sign up</foundry-button>
    </foundry-navbar>
  `,
};

export const Flat: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-navbar variant="flat">
      <strong slot="brand">Acme</strong>
      <foundry-link href="#home">Home</foundry-link>
      <foundry-link href="#about">About</foundry-link>
    </foundry-navbar>
  `,
};

export const Elevated: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-navbar variant="elevated">
      <strong slot="brand">Acme</strong>
      <foundry-link href="#home">Home</foundry-link>
      <foundry-link href="#about">About</foundry-link>
      <foundry-button slot="actions">Sign in</foundry-button>
    </foundry-navbar>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-navbar>
      <strong slot="brand">Acme</strong>
      <foundry-link href="#home">Home</foundry-link>
      <foundry-link href="#about">About</foundry-link>
      <foundry-button slot="actions">Sign in</foundry-button>
    </foundry-navbar>
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
