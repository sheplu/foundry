import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryToast, type ToastVariant } from './toast.ts';

FoundryToast.define();

interface ToastArgs {
  variant: ToastVariant;
  duration: number;
  closeable: boolean;
  title: string;
  body: string;
}

const meta: Meta<ToastArgs> = {
  title: 'Feedback/Toast',
  component: 'foundry-toast',
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'info', 'success', 'warning', 'danger'] satisfies ToastVariant[],
    },
    duration: { control: { type: 'number', min: 0, max: 20000, step: 500 } },
    closeable: { control: 'boolean' },
    title: { control: 'text' },
    body: { control: 'text' },
  },
  args: {
    variant: 'info',
    duration: 0, // disabled in stories so the component stays visible
    closeable: true,
    title: 'Saved',
    body: 'Your changes have been saved successfully.',
  },
};

export default meta;

type Story = StoryObj<ToastArgs>;

export const Default: Story = {
  render: ({ variant, duration, closeable, title, body }) => html`
    <foundry-toast
      variant=${variant}
      duration=${duration}
      ?closeable=${closeable}
      style="max-inline-size:24rem;"
    >
      <span slot="title">${title}</span>
      ${body}
    </foundry-toast>
  `,
};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem; max-inline-size:28rem;">
      <foundry-toast variant="neutral" duration="0">
        <span slot="title">Neutral</span>
        A neutral notification.
      </foundry-toast>
      <foundry-toast variant="info" duration="0">
        <span slot="title">Info</span>
        An informational notification.
      </foundry-toast>
      <foundry-toast variant="success" duration="0">
        <span slot="title">Success</span>
        Your changes were saved.
      </foundry-toast>
      <foundry-toast variant="warning" duration="0">
        <span slot="title">Warning</span>
        Check your network connection.
      </foundry-toast>
      <foundry-toast variant="danger" duration="0">
        <span slot="title">Error</span>
        Something went wrong.
      </foundry-toast>
    </div>
  `,
};

export const WithTitle: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-toast duration="0" style="max-inline-size:24rem;">
      <span slot="title">Invite sent</span>
      Alice will receive an email with the invite shortly.
    </foundry-toast>
  `,
};

export const LongBody: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-toast variant="warning" duration="0" style="max-inline-size:28rem;">
      <span slot="title">Heads up</span>
      We detected unusual activity on your account. If this wasn't you,
      please reset your password and review your recent sessions.
    </foundry-toast>
  `,
};

export const Manual: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-toast duration="0" style="max-inline-size:24rem;">
      <span slot="title">Manual close</span>
      duration="0" disables auto-dismiss. Use the × to close.
    </foundry-toast>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif; display:flex; flex-direction:column; gap:0.5rem;"
  >
    <p style="margin:0;">${theme}</p>
    <foundry-toast variant="info" duration="0">
      <span slot="title">Info</span>
      Themed notification.
    </foundry-toast>
    <foundry-toast variant="success" duration="0">
      <span slot="title">Success</span>
      Themed notification.
    </foundry-toast>
    <foundry-toast variant="danger" duration="0">
      <span slot="title">Error</span>
      Themed notification.
    </foundry-toast>
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
