import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryAlert, type AlertVariant } from './alert.ts';

FoundryAlert.define();

interface AlertArgs {
  variant: AlertVariant;
  title: string;
  body: string;
}

const meta: Meta<AlertArgs> = {
  title: 'Feedback/Alert',
  component: 'foundry-alert',
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'info', 'success', 'warning', 'danger'],
    },
    title: { control: 'text' },
    body: { control: 'text' },
  },
  args: {
    variant: 'info',
    title: 'Heads up',
    body: 'Something noteworthy happened. Here is a short description.',
  },
};

export default meta;

type Story = StoryObj<AlertArgs>;

const variants: AlertVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

export const Default: Story = {
  render: ({ variant, title, body }) => html`
    <foundry-alert variant=${variant}>
      <span slot="title">${title}</span>
      ${body}
    </foundry-alert>
  `,
};

export const VariantScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem; font-family:sans-serif;">
      ${variants.map((v) => html`
        <foundry-alert variant=${v}>
          <span slot="title">${v}</span>
          This is a ${v} alert with a short body sentence.
        </foundry-alert>
      `)}
    </div>
  `,
};

export const TitleOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-alert variant="success">
      <span slot="title">Saved successfully</span>
    </foundry-alert>
  `,
};

export const BodyOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-alert variant="info">
      No title here — just a body message that renders without the bold title line.
    </foundry-alert>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-alert variant="info">
        <span slot="title">Info</span>
        Informational message.
      </foundry-alert>
      <foundry-alert variant="warning">
        <span slot="title">Warning</span>
        Something needs your attention.
      </foundry-alert>
      <foundry-alert variant="danger">
        <span slot="title">Error</span>
        Something went wrong.
      </foundry-alert>
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
