import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundrySlider } from './slider.ts';

FoundrySlider.define();

interface SliderArgs {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  valueLabel: string;
  disabled: boolean;
}

const meta: Meta<SliderArgs> = {
  title: 'Forms/Slider',
  component: 'foundry-slider',
  argTypes: {
    value: { control: { type: 'number' } },
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number', min: 0.01 } },
    label: { control: { type: 'text' } },
    valueLabel: { control: { type: 'text' } },
    disabled: { control: { type: 'boolean' } },
  },
  args: {
    value: 40,
    min: 0,
    max: 100,
    step: 1,
    label: 'Volume',
    valueLabel: 'Volume',
    disabled: false,
  },
};

export default meta;

type Story = StoryObj<SliderArgs>;

function bindValue(event: Event): void {
  const host = event.currentTarget as HTMLElement & { value: number };
  const target = event.target as HTMLInputElement | null;
  const v = target?.value ?? '';
  host.setAttribute('value', v);
}

export const Default: Story = {
  render: ({ value, min, max, step, label, valueLabel, disabled }) => html`
    <foundry-slider
      value=${value}
      min=${min}
      max=${max}
      step=${step}
      label=${label}
      value-label=${valueLabel}
      ?disabled=${disabled}
      @input=${bindValue}
    ></foundry-slider>
  `,
};

export const SmallStep: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-slider
      value="2.5"
      min="0"
      max="5"
      step="0.1"
      label="Fine"
      @input=${bindValue}
    ></foundry-slider>
  `,
};

export const LargeRange: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-slider
      value="0"
      min="-50"
      max="50"
      step="1"
      label="Balance"
      @input=${bindValue}
    ></foundry-slider>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-slider
      value="60"
      label="Locked"
      disabled
      @input=${bindValue}
    ></foundry-slider>
  `,
};

export const WithValueLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-slider
      value="35"
      label="Volume"
      value-label="Volume"
      @input=${bindValue}
    ></foundry-slider>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-slider value="40" label="Volume" @input=${bindValue}></foundry-slider>
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
