import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryField } from './field.ts';

FoundryField.define();

interface FieldArgs {
  label: string;
  helper: string;
  error: string;
  required: boolean;
  invalid: boolean;
}

const meta: Meta<FieldArgs> = {
  title: 'Forms/Field',
  component: 'foundry-field',
  argTypes: {
    label: { control: 'text' },
    helper: { control: 'text' },
    error: { control: 'text' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: {
    label: 'Email',
    helper: '',
    error: '',
    required: false,
    invalid: false,
  },
};

export default meta;

type Story = StoryObj<FieldArgs>;

export const Default: Story = {
  render: ({ label, helper, error, required, invalid }) => html`
    <foundry-field ?required=${required} ?invalid=${invalid}>
      <span slot="label">${label}</span>
      <input type="text" placeholder="you@example.com" />
      ${helper ? html`<span slot="helper">${helper}</span>` : null}
      ${error ? html`<span slot="error">${error}</span>` : null}
    </foundry-field>
  `,
};

export const WithHelper: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-field>
      <span slot="label">Email</span>
      <input type="email" placeholder="you@example.com" />
      <span slot="helper">We never share your email.</span>
    </foundry-field>
  `,
};

export const WithError: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-field invalid>
      <span slot="label">Email</span>
      <input type="email" value="not-an-email" />
      <span slot="error">Please enter a valid email address.</span>
    </foundry-field>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-field required>
      <span slot="label">Full name</span>
      <input type="text" required />
      <span slot="helper">As it appears on your ID.</span>
    </foundry-field>
  `,
};

export const WrappingNativeDate: Story = {
  parameters: { controls: { disable: true } },
  name: 'Wrapping native date input',
  render: () => html`
    <foundry-field>
      <span slot="label">Birthday</span>
      <input type="date" />
      <span slot="helper">Native date pickers vary by browser.</span>
    </foundry-field>
  `,
};

export const WrappingTextarea: Story = {
  parameters: { controls: { disable: true } },
  name: 'Wrapping a native textarea',
  render: () => html`
    <foundry-field>
      <span slot="label">Comments</span>
      <textarea rows="3"></textarea>
      <span slot="helper">Tell us what you think.</span>
    </foundry-field>
  `,
};
