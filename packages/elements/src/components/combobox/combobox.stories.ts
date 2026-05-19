import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryCombobox } from './combobox.ts';

FoundryCombobox.define();

interface ComboboxArgs {
  placeholder: string;
  value: string;
  required: boolean;
  disabled: boolean;
  label: string;
}

const meta: Meta<ComboboxArgs> = {
  title: 'Forms/Combobox',
  component: 'foundry-combobox',
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    placeholder: 'Type a city',
    value: '',
    required: false,
    disabled: false,
    label: 'City',
  },
};

export default meta;

type Story = StoryObj<ComboboxArgs>;

export const Default: Story = {
  render: ({ placeholder, value, required, disabled, label }) => html`
    <foundry-combobox
      name="city"
      value=${value}
      placeholder=${placeholder}
      ?required=${required}
      ?disabled=${disabled}
      style="max-width:320px;"
    >
      <span slot="label">${label}</span>
      <span slot="helper">Suggestions; you can also type your own.</span>
      <foundry-option value="paris">Paris</foundry-option>
      <foundry-option value="london">London</foundry-option>
      <foundry-option value="tokyo">Tokyo</foundry-option>
      <foundry-option value="new-york">New York</foundry-option>
      <foundry-option value="sydney">Sydney</foundry-option>
    </foundry-combobox>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-combobox name="city" placeholder="Type a city" required style="max-width:320px;">
      <span slot="label">City</span>
      <span slot="error">Please enter a city.</span>
      <foundry-option value="paris">Paris</foundry-option>
      <foundry-option value="london">London</foundry-option>
      <foundry-option value="tokyo">Tokyo</foundry-option>
    </foundry-combobox>
  `,
};

export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-combobox
      name="city"
      placeholder="Type a city"
      required
      invalid
      style="max-width:320px;"
    >
      <span slot="label">City</span>
      <span slot="error">This field is required.</span>
      <foundry-option value="paris">Paris</foundry-option>
      <foundry-option value="london">London</foundry-option>
    </foundry-combobox>
  `,
};

export const FreeFormCommit: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-combobox
      name="city"
      value="My Custom City"
      placeholder="Type a city"
      style="max-width:320px;"
    >
      <span slot="label">City</span>
      <span slot="helper">Free-form input — pick a suggestion or type your own.</span>
      <foundry-option value="paris">Paris</foundry-option>
      <foundry-option value="london">London</foundry-option>
    </foundry-combobox>
  `,
};

export const NoMatchingOption: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-combobox
      name="city"
      value="zzz"
      placeholder="Type a city"
      open
      style="max-width:320px;"
    >
      <span slot="label">City</span>
      <foundry-option value="paris">Paris</foundry-option>
      <foundry-option value="london">London</foundry-option>
    </foundry-combobox>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-combobox
      name="city"
      placeholder="Type a city"
      value="Paris"
      disabled
      style="max-width:320px;"
    >
      <span slot="label">City</span>
      <foundry-option value="paris">Paris</foundry-option>
    </foundry-combobox>
  `,
};
