import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryNumberStepper } from './number-stepper.ts';

FoundryNumberStepper.define();

interface NumberStepperArgs {
  value: string;
  min: string;
  max: string;
  step: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  label: string;
}

const meta: Meta<NumberStepperArgs> = {
  title: 'Forms/NumberStepper',
  component: 'foundry-number-stepper',
  argTypes: {
    value: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    step: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    value: '1',
    min: '0',
    max: '10',
    step: '1',
    required: false,
    disabled: false,
    readonly: false,
    label: 'Quantity',
  },
};

export default meta;

type Story = StoryObj<NumberStepperArgs>;

export const Default: Story = {
  render: ({ value, min, max, step, required, disabled, readonly, label }) => html`
    <foundry-number-stepper
      name="qty"
      value=${value}
      min=${min}
      max=${max}
      step=${step}
      ?required=${required}
      ?disabled=${disabled}
      ?readonly=${readonly}
      style="max-width:240px;"
    >
      <span slot="label">${label}</span>
    </foundry-number-stepper>
  `,
};

export const WithValue: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-number-stepper
      name="qty"
      value="42"
      min="0"
      max="100"
      style="max-width:240px;"
    >
      <span slot="label">Quantity</span>
      <span slot="helper">Between 0 and 100.</span>
    </foundry-number-stepper>
  `,
};

export const WithStep: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-number-stepper
      name="ratio"
      value="0.5"
      min="0"
      max="1"
      step="0.1"
      style="max-width:240px;"
    >
      <span slot="label">Ratio</span>
      <span slot="helper">Step: 0.1.</span>
    </foundry-number-stepper>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-number-stepper name="qty" required style="max-width:240px;">
      <span slot="label">Quantity</span>
      <span slot="error">Please enter a value.</span>
    </foundry-number-stepper>
  `,
};

export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-number-stepper
      name="qty"
      value="42"
      min="0"
      max="10"
      invalid
      style="max-width:240px;"
    >
      <span slot="label">Quantity</span>
      <span slot="error">Value must be 10 or less.</span>
    </foundry-number-stepper>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-number-stepper
      name="qty"
      value="5"
      min="0"
      max="10"
      disabled
      style="max-width:240px;"
    >
      <span slot="label">Quantity</span>
    </foundry-number-stepper>
  `,
};
