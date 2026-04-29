import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryTextField, type TextFieldType } from './text-field.ts';

FoundryTextField.define();

interface TextFieldArgs {
  type: TextFieldType;
  label: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  hint: string;
}

const meta: Meta<TextFieldArgs> = {
  title: 'Forms/TextField',
  component: 'foundry-text-field',
  argTypes: {
    type: {
      control: 'inline-radio',
      options: ['text', 'email', 'url', 'tel', 'password', 'number', 'search'],
    },
    label: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    hint: { control: 'text' },
  },
  args: {
    type: 'text',
    label: 'Email',
    placeholder: 'you@example.com',
    required: false,
    disabled: false,
    readonly: false,
    hint: '',
  },
};

export default meta;

type Story = StoryObj<TextFieldArgs>;

export const Default: Story = {
  render: ({ type, label, placeholder, required, disabled, readonly, hint }) => html`
    <foundry-text-field
      type=${type}
      placeholder=${placeholder}
      ?required=${required}
      ?disabled=${disabled}
      ?readonly=${readonly}
    >
      <span slot="label">${label}</span>
      ${hint ? html`<span slot="hint">${hint}</span>` : null}
    </foundry-text-field>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-text-field name="email" type="email" required>
      <span slot="label">Email <em>*</em></span>
      <span slot="hint">We never share your email.</span>
      <span slot="error">Please enter a valid email address.</span>
    </foundry-text-field>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-text-field value="can't edit me" disabled>
      <span slot="label">Read-only state (disabled)</span>
    </foundry-text-field>
  `,
};

export const Readonly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-text-field value="displayed only" readonly>
      <span slot="label">Readonly</span>
    </foundry-text-field>
  `,
};

export const WithHint: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-text-field name="username" minlength="3">
      <span slot="label">Username</span>
      <span slot="hint">3 characters or more, letters and numbers only.</span>
    </foundry-text-field>
  `,
};

export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-text-field name="email" type="email" required invalid>
      <span slot="label">Email</span>
      <span slot="error">Please enter a valid email address.</span>
    </foundry-text-field>
  `,
};

const typeExamples: { type: TextFieldType; label: string; placeholder: string }[] = [
  { type: 'email', label: 'Email', placeholder: 'you@example.com' },
  { type: 'url', label: 'Website', placeholder: 'https://example.com' },
  { type: 'tel', label: 'Phone', placeholder: '+1 555 0100' },
  { type: 'number', label: 'Amount', placeholder: '0' },
  { type: 'password', label: 'Password', placeholder: '••••••••' },
  { type: 'search', label: 'Search', placeholder: 'Search…' },
];

export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:1rem; max-width:420px;">
      ${typeExamples.map(({ type, label, placeholder }) => html`
        <foundry-text-field type=${type} placeholder=${placeholder}>
          <span slot="label">${label}</span>
        </foundry-text-field>
      `)}
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      <foundry-text-field placeholder="Type something">
        <span slot="label">Default</span>
      </foundry-text-field>
      <foundry-text-field required invalid>
        <span slot="label">Invalid</span>
        <span slot="error">This field is required.</span>
      </foundry-text-field>
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
