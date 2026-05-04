import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryAccordion, type AccordionMode } from './accordion.ts';

FoundryAccordion.define();

interface AccordionArgs {
  mode: AccordionMode;
}

const meta: Meta<AccordionArgs> = {
  title: 'Layout/Accordion',
  component: 'foundry-accordion',
  argTypes: {
    mode: {
      control: 'inline-radio',
      options: ['single', 'multiple'] satisfies AccordionMode[],
    },
  },
  args: {
    mode: 'single',
  },
};

export default meta;

type Story = StoryObj<AccordionArgs>;

export const Default: Story = {
  render: ({ mode }) => html`
    <foundry-accordion mode=${mode} style="max-inline-size:40rem;">
      <foundry-details value="profile">
        <span slot="summary">Profile</span>
        <p style="margin:0;">Personal details and avatar.</p>
      </foundry-details>
      <foundry-details value="billing">
        <span slot="summary">Billing</span>
        <p style="margin:0;">Payment methods and invoicing.</p>
      </foundry-details>
      <foundry-details value="security">
        <span slot="summary">Security</span>
        <p style="margin:0;">Passwords, 2FA, and sessions.</p>
      </foundry-details>
    </foundry-accordion>
  `,
};

export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-accordion mode="multiple" style="max-inline-size:40rem;">
      <foundry-details open value="shipping">
        <span slot="summary">Shipping</span>
        <p style="margin:0;">Opens independently — siblings stay put.</p>
      </foundry-details>
      <foundry-details open value="returns">
        <span slot="summary">Returns</span>
        <p style="margin:0;">30-day return window for most items.</p>
      </foundry-details>
      <foundry-details value="warranty">
        <span slot="summary">Warranty</span>
        <p style="margin:0;">Manufacturer warranty details.</p>
      </foundry-details>
    </foundry-accordion>
  `,
};

export const FAQ: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-accordion style="max-inline-size:40rem;">
      <foundry-details>
        <span slot="summary">How do I reset my password?</span>
        <p style="margin:0;">Use the "forgot password" link on the sign-in screen.</p>
      </foundry-details>
      <foundry-details>
        <span slot="summary">Can I export my data?</span>
        <p style="margin:0;">Yes, from the Privacy tab in account settings.</p>
      </foundry-details>
      <foundry-details>
        <span slot="summary">Is two-factor authentication required?</span>
        <p style="margin:0;">Strongly recommended; required for admin roles.</p>
      </foundry-details>
      <foundry-details>
        <span slot="summary">How do I cancel my subscription?</span>
        <p style="margin:0;">From Billing → Subscription, click "Cancel plan."</p>
      </foundry-details>
      <foundry-details>
        <span slot="summary">Where are your servers hosted?</span>
        <p style="margin:0;">US-east (primary) and EU-west (replica).</p>
      </foundry-details>
      <foundry-details>
        <span slot="summary">Can I use a custom domain?</span>
        <p style="margin:0;">Available on Pro and Enterprise plans.</p>
      </foundry-details>
    </foundry-accordion>
  `,
};

export const Preopened: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-accordion style="max-inline-size:40rem;">
      <foundry-details value="overview">
        <span slot="summary">Overview</span>
        <p style="margin:0;">General info.</p>
      </foundry-details>
      <foundry-details open value="details">
        <span slot="summary">Details (preopened)</span>
        <p style="margin:0;">This one was opened via the <code>open</code> attribute.</p>
      </foundry-details>
      <foundry-details value="archive">
        <span slot="summary">Archive</span>
        <p style="margin:0;">Older records.</p>
      </foundry-details>
    </foundry-accordion>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-accordion>
      <foundry-details>
        <span slot="summary">Section A</span>
        <p style="margin:0;">Body A.</p>
      </foundry-details>
      <foundry-details open>
        <span slot="summary">Section B (open)</span>
        <p style="margin:0;">Body B.</p>
      </foundry-details>
    </foundry-accordion>
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
