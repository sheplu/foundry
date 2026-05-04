import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryDetails } from './details.ts';

FoundryDetails.define();

interface DetailsArgs {
  open: boolean;
  disabled: boolean;
  summary: string;
}

const meta: Meta<DetailsArgs> = {
  title: 'Layout/Details',
  component: 'foundry-details',
  argTypes: {
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
    summary: { control: 'text' },
  },
  args: {
    open: false,
    disabled: false,
    summary: 'Show advanced options',
  },
};

export default meta;

type Story = StoryObj<DetailsArgs>;

export const Default: Story = {
  render: ({ open, disabled, summary }) => html`
    <foundry-details ?open=${open} ?disabled=${disabled} style="max-inline-size:32rem;">
      <span slot="summary">${summary}</span>
      <p style="margin:0;">
        Disclosure body content. Reveal additional context only when the user
        needs it.
      </p>
    </foundry-details>
  `,
};

export const Preopened: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-details open style="max-inline-size:32rem;">
      <span slot="summary">Shipping details</span>
      <p style="margin:0;">Pre-opened via the <code>open</code> attribute.</p>
    </foundry-details>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-details disabled style="max-inline-size:32rem;">
      <span slot="summary">Coming soon</span>
      <p style="margin:0;">This panel is disabled; its summary won't toggle.</p>
    </foundry-details>
  `,
};

export const LongContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-details open style="max-inline-size:32rem;">
      <span slot="summary">Full policy</span>
      ${Array.from({ length: 8 }).map((_, i) => html`
        <p style="margin:0 0 0.75rem;">
          Paragraph ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
          sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      `)}
    </foundry-details>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-details>
      <span slot="summary">Themed disclosure</span>
      <p style="margin:0;">Picks up surface + text tokens.</p>
    </foundry-details>
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
