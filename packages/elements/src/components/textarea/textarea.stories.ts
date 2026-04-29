import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryTextarea } from './textarea.ts';

FoundryTextarea.define();

interface TextareaArgs {
  label: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
  readonly: boolean;
  hint: string;
  rows: number;
}

const meta: Meta<TextareaArgs> = {
  title: 'Forms/Textarea',
  component: 'foundry-textarea',
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    hint: { control: 'text' },
    rows: { control: { type: 'number', min: 1, max: 20 } },
  },
  args: {
    label: 'Bio',
    placeholder: 'Tell us a little about yourself…',
    required: false,
    disabled: false,
    readonly: false,
    hint: '',
    rows: 3,
  },
};

export default meta;

type Story = StoryObj<TextareaArgs>;

export const Default: Story = {
  render: ({ label, placeholder, required, disabled, readonly, hint, rows }) => html`
    <foundry-textarea
      placeholder=${placeholder}
      rows=${rows}
      ?required=${required}
      ?disabled=${disabled}
      ?readonly=${readonly}
    >
      <span slot="label">${label}</span>
      ${hint ? html`<span slot="hint">${hint}</span>` : null}
    </foundry-textarea>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-textarea name="bio" required>
      <span slot="label">Bio <em>*</em></span>
      <span slot="hint">Required. Tell us about yourself.</span>
      <span slot="error">Bio is required.</span>
    </foundry-textarea>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-textarea value="You can't edit this." disabled>
      <span slot="label">Disabled state</span>
    </foundry-textarea>
  `,
};

export const Readonly: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-textarea value="Readonly content displayed verbatim." readonly>
      <span slot="label">Readonly</span>
    </foundry-textarea>
  `,
};

export const WithHint: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-textarea name="bio" maxlength="500">
      <span slot="label">Bio</span>
      <span slot="hint">Up to 500 characters. Plain text only.</span>
    </foundry-textarea>
  `,
};

export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-textarea name="bio" required invalid>
      <span slot="label">Bio</span>
      <span slot="error">Please write at least a sentence about yourself.</span>
    </foundry-textarea>
  `,
};

const rowExamples = [2, 5, 10];

export const Rows: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:1rem; max-width:420px;">
      ${rowExamples.map((n) => html`
        <foundry-textarea rows=${n} placeholder="rows=${n}">
          <span slot="label">rows=${n}</span>
        </foundry-textarea>
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
      <foundry-textarea placeholder="Type something">
        <span slot="label">Default</span>
      </foundry-textarea>
      <foundry-textarea required invalid>
        <span slot="label">Invalid</span>
        <span slot="error">This field is required.</span>
      </foundry-textarea>
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
