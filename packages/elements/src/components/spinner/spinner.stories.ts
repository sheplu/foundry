import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundrySpinner, type SpinnerSize } from './spinner.ts';

FoundrySpinner.define();

interface SpinnerArgs {
  size: SpinnerSize;
  label: string;
}

const meta: Meta<SpinnerArgs> = {
  title: 'Feedback/Spinner',
  component: 'foundry-spinner',
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'] satisfies SpinnerSize[],
    },
    label: { control: 'text' },
  },
  args: {
    size: 'md',
    label: '',
  },
};

export default meta;

type Story = StoryObj<SpinnerArgs>;

export const Default: Story = {
  render: ({ size, label }) => html`
    <foundry-spinner size=${size} label=${label || ''}></foundry-spinner>
  `,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:1rem; align-items:center;">
      <foundry-spinner size="sm"></foundry-spinner>
      <foundry-spinner size="md"></foundry-spinner>
      <foundry-spinner size="lg"></foundry-spinner>
    </div>
  `,
};

export const WithLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:inline-flex; gap:0.5rem; align-items:center; font-family:sans-serif;"
    >
      <foundry-spinner label="Loading"></foundry-spinner>
      <span>Loading…</span>
    </div>
  `,
};

export const ColoredContext: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:1rem; align-items:center;">
      <span style="color:var(--foundry-color-action-primary);">
        <foundry-spinner></foundry-spinner>
      </span>
      <span style="color:var(--foundry-color-intent-danger-foreground);">
        <foundry-spinner></foundry-spinner>
      </span>
      <span style="color:var(--foundry-color-text-muted);">
        <foundry-spinner size="lg"></foundry-spinner>
      </span>
    </div>
  `,
};

export const ReducedMotion: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap:0.75rem; font-family:sans-serif; max-width:40ch;"
    >
      <div style="display:flex; gap:1rem; align-items:center;">
        <foundry-spinner size="sm"></foundry-spinner>
        <foundry-spinner size="md"></foundry-spinner>
        <foundry-spinner size="lg"></foundry-spinner>
      </div>
      <p style="margin:0; color:var(--foundry-color-text-muted); font-size:0.875rem;">
        Under <code>prefers-reduced-motion: reduce</code> the rotation stops;
        the arc still renders so the loading state is still visible.
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
    <div style="display:flex; gap:1rem; align-items:center;">
      <foundry-spinner size="sm"></foundry-spinner>
      <foundry-spinner size="md"></foundry-spinner>
      <foundry-spinner size="lg"></foundry-spinner>
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
