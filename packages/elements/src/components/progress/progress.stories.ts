import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryProgress, type ProgressVariant } from './progress.ts';

FoundryProgress.define();

interface ProgressArgs {
  value: number;
  max: number;
  variant: ProgressVariant;
  label: string;
}

const meta: Meta<ProgressArgs> = {
  title: 'Feedback/Progress',
  component: 'foundry-progress',
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    max: { control: { type: 'number', min: 1 } },
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'success', 'warning', 'danger'] satisfies ProgressVariant[],
    },
    label: { control: 'text' },
  },
  args: {
    value: 40,
    max: 100,
    variant: 'neutral',
    label: '',
  },
};

export default meta;

type Story = StoryObj<ProgressArgs>;

export const Default: Story = {
  render: ({ value, max, variant, label }) => html`
    <foundry-progress
      value=${value}
      max=${max}
      variant=${variant}
      label=${label || ''}
    ></foundry-progress>
  `,
};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem; max-width:24rem;">
      <foundry-progress value="30"></foundry-progress>
      <foundry-progress variant="success" value="80"></foundry-progress>
      <foundry-progress variant="warning" value="60"></foundry-progress>
      <foundry-progress variant="danger" value="95"></foundry-progress>
    </div>
  `,
};

export const Scale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem; max-width:24rem;">
      <foundry-progress value="0"></foundry-progress>
      <foundry-progress value="25"></foundry-progress>
      <foundry-progress value="50"></foundry-progress>
      <foundry-progress value="75"></foundry-progress>
      <foundry-progress value="100"></foundry-progress>
    </div>
  `,
};

export const WithCustomMax: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap:0.5rem; max-width:24rem; font-family:sans-serif;"
    >
      <foundry-progress
        value="3"
        max="10"
        variant="success"
        label="Checklist"
      ></foundry-progress>
      <p style="margin:0; color:var(--foundry-color-text-muted); font-size:0.875rem;">
        3 of 10 items done.
      </p>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-progress value="25"></foundry-progress>
      <foundry-progress variant="success" value="70"></foundry-progress>
      <foundry-progress variant="danger" value="95"></foundry-progress>
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
