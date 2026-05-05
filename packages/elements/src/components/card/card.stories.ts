import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryCard, type CardVariant } from './card.ts';
import { FoundryButton } from '../button/button.ts';
import { FoundryHeading } from '../heading/heading.ts';
import { FoundryText } from '../text/text.ts';

FoundryCard.define();
FoundryButton.define();
FoundryHeading.define();
FoundryText.define();

interface CardArgs {
  variant: CardVariant;
  headerText: string;
  bodyText: string;
}

const meta: Meta<CardArgs> = {
  title: 'Layout/Card',
  component: 'foundry-card',
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['outlined', 'elevated'] satisfies CardVariant[],
    },
    headerText: { control: 'text' },
    bodyText: { control: 'text' },
  },
  args: {
    variant: 'outlined',
    headerText: 'Project Alpha',
    bodyText: 'A short description of what this card contains. Cards group related content and actions.',
  },
};

export default meta;

type Story = StoryObj<CardArgs>;

export const Default: Story = {
  render: ({ variant, headerText, bodyText }) => html`
    <foundry-card variant=${variant} style="max-inline-size:24rem;">
      <foundry-heading slot="header" level="3" size="sm">${headerText}</foundry-heading>
      <foundry-text>${bodyText}</foundry-text>
      <div slot="footer" style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <foundry-button variant="secondary">Cancel</foundry-button>
        <foundry-button variant="primary">Confirm</foundry-button>
      </div>
    </foundry-card>
  `,
};

export const Outlined: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-card style="max-inline-size:24rem;">
      <foundry-heading slot="header" level="3" size="sm">Outlined card</foundry-heading>
      <foundry-text>Subtle border, no shadow. The default variant.</foundry-text>
    </foundry-card>
  `,
};

export const Elevated: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-card variant="elevated" style="max-inline-size:24rem;">
      <foundry-heading slot="header" level="3" size="sm">Elevated card</foundry-heading>
      <foundry-text>Drop shadow, no border. Draws the eye for surface-level callouts.</foundry-text>
    </foundry-card>
  `,
};

export const WithMedia: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-card variant="elevated" style="max-inline-size:24rem;">
      <div
        slot="media"
        style="block-size:8rem; background:linear-gradient(135deg, #6366f1, #ec4899);"
        aria-hidden="true"
      ></div>
      <foundry-heading slot="header" level="3" size="sm">With media</foundry-heading>
      <foundry-text>
        The media slot sits edge-to-edge above the header, clipped by the card's rounded corners.
      </foundry-text>
      <div slot="footer" style="display:flex; justify-content:flex-end;">
        <foundry-button variant="primary">View</foundry-button>
      </div>
    </foundry-card>
  `,
};

export const BodyOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-card style="max-inline-size:24rem;">
      <foundry-text>
        A minimal card — just the default slot. Header, media, and footer all
        collapse when empty so the card stays compact.
      </foundry-text>
    </foundry-card>
  `,
};

export const Grid: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:grid; grid-template-columns:repeat(3, minmax(16rem, 1fr)); gap:1rem; max-inline-size:64rem;"
    >
      <foundry-card>
        <foundry-heading slot="header" level="3" size="sm">Outlined</foundry-heading>
        <foundry-text>Card A — the default variant.</foundry-text>
      </foundry-card>
      <foundry-card variant="elevated">
        <foundry-heading slot="header" level="3" size="sm">Elevated</foundry-heading>
        <foundry-text>Card B — elevated with a drop shadow.</foundry-text>
      </foundry-card>
      <foundry-card>
        <foundry-heading slot="header" level="3" size="sm">With footer</foundry-heading>
        <foundry-text>Card C — outlined plus a footer row.</foundry-text>
        <div slot="footer" style="display:flex; justify-content:flex-end;">
          <foundry-button variant="primary">Open</foundry-button>
        </div>
      </foundry-card>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface-subtle); border-radius:var(--foundry-radius-md); font-family:sans-serif; display:flex; flex-direction:column; gap:0.75rem;"
  >
    <p style="margin:0;">${theme}</p>
    <foundry-card>
      <foundry-heading slot="header" level="3" size="sm">Outlined</foundry-heading>
      <foundry-text>Themed card surface.</foundry-text>
    </foundry-card>
    <foundry-card variant="elevated">
      <foundry-heading slot="header" level="3" size="sm">Elevated</foundry-heading>
      <foundry-text>Themed card surface with drop shadow.</foundry-text>
    </foundry-card>
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
