import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryDatePicker } from './date-picker.ts';

FoundryDatePicker.define();

interface DatePickerArgs {
  placeholder: string;
  value: string;
  min: string;
  max: string;
  required: boolean;
  disabled: boolean;
  label: string;
}

const meta: Meta<DatePickerArgs> = {
  title: 'Forms/DatePicker',
  component: 'foundry-date-picker',
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    placeholder: 'YYYY-MM-DD',
    value: '',
    min: '',
    max: '',
    required: false,
    disabled: false,
    label: 'Date of birth',
  },
};

export default meta;

type Story = StoryObj<DatePickerArgs>;

export const Default: Story = {
  render: ({ placeholder, value, min, max, required, disabled, label }) => html`
    <foundry-date-picker
      name="dob"
      value=${value}
      placeholder=${placeholder}
      min=${min}
      max=${max}
      ?required=${required}
      ?disabled=${disabled}
      style="max-width:320px;"
    >
      <span slot="label">${label}</span>
      <span slot="helper">Format: YYYY-MM-DD.</span>
    </foundry-date-picker>
  `,
};

export const WithValue: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-date-picker name="dob" value="2026-05-19" style="max-width:320px;">
      <span slot="label">Date of birth</span>
      <span slot="helper">Format: YYYY-MM-DD.</span>
    </foundry-date-picker>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-date-picker name="dob" required style="max-width:320px;">
      <span slot="label">Date of birth</span>
      <span slot="error">Please pick a date.</span>
    </foundry-date-picker>
  `,
};

export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-date-picker name="dob" required invalid style="max-width:320px;">
      <span slot="label">Date of birth</span>
      <span slot="error">This field is required.</span>
    </foundry-date-picker>
  `,
};

export const WithMinMax: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-date-picker
      name="dob"
      value="2026-05-19"
      min="2026-05-10"
      max="2026-05-25"
      style="max-width:320px;"
    >
      <span slot="label">Date of birth</span>
      <span slot="helper">Allowed range: 2026-05-10 → 2026-05-25.</span>
    </foundry-date-picker>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-date-picker name="dob" value="2026-05-19" disabled style="max-width:320px;">
      <span slot="label">Date of birth</span>
    </foundry-date-picker>
  `,
};
