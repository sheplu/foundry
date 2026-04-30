import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryCheckbox } from './checkbox.ts';

FoundryCheckbox.define();

interface CheckboxArgs {
  label: string;
  checked: boolean;
  required: boolean;
  disabled: boolean;
  value: string;
}

const meta: Meta<CheckboxArgs> = {
  title: 'Forms/Checkbox',
  component: 'foundry-checkbox',
  argTypes: {
    label: { control: 'text' },
    checked: { control: 'boolean' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
  },
  args: {
    label: 'Send me weekly updates',
    checked: false,
    required: false,
    disabled: false,
    value: 'on',
  },
};

export default meta;

type Story = StoryObj<CheckboxArgs>;

export const Default: Story = {
  render: ({ label, checked, required, disabled, value }) => html`
    <foundry-checkbox
      value=${value}
      ?checked=${checked}
      ?required=${required}
      ?disabled=${disabled}
    >
      <span slot="label">${label}</span>
    </foundry-checkbox>
  `,
};

export const Checked: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-checkbox checked name="terms" value="accepted">
      <span slot="label">I accept the terms</span>
    </foundry-checkbox>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-checkbox required name="terms" value="accepted">
      <span slot="label">I accept the terms <em>*</em></span>
    </foundry-checkbox>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      <foundry-checkbox disabled>
        <span slot="label">Disabled + unchecked</span>
      </foundry-checkbox>
      <foundry-checkbox disabled checked>
        <span slot="label">Disabled + checked</span>
      </foundry-checkbox>
    </div>
  `,
};

export const InForm: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <form
      style="display:flex; flex-direction:column; gap:0.75rem; max-width:320px; font-family:sans-serif;"
      @submit=${(e: Event) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = new FormData(form);
        const record: Record<string, string> = {};
        for (const [k, v] of data.entries()) record[k] = String(v);
        const out = form.parentElement?.querySelector('pre');
        if (out) out.textContent = JSON.stringify(record, null, 2);
      }}
    >
      <foundry-checkbox name="newsletter" value="weekly">
        <span slot="label">Weekly newsletter</span>
      </foundry-checkbox>
      <foundry-checkbox name="promotions" value="yes" checked>
        <span slot="label">Promotional emails</span>
      </foundry-checkbox>
      <button type="submit">Save preferences</button>
    </form>
    <pre
      style="margin-block-start:0.75rem; padding:0.5rem; background:var(--foundry-color-surface-subtle); border-radius:var(--foundry-radius-sm); font-family:ui-monospace, monospace; font-size:0.8125rem;"
    ></pre>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-checkbox>
        <span slot="label">Unchecked</span>
      </foundry-checkbox>
      <foundry-checkbox checked>
        <span slot="label">Checked</span>
      </foundry-checkbox>
      <foundry-checkbox required invalid>
        <span slot="label">Invalid</span>
      </foundry-checkbox>
      <foundry-checkbox disabled>
        <span slot="label">Disabled</span>
      </foundry-checkbox>
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
