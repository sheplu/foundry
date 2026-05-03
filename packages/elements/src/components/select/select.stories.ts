import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryIcon, chevronDown } from '@foundry/icons';
import { FoundrySelect } from './select.ts';

FoundrySelect.define();
FoundryIcon.register({ 'chevron-down': chevronDown });
FoundryIcon.define();

interface SelectArgs {
  placeholder: string;
  value: string;
  required: boolean;
  disabled: boolean;
  label: string;
}

const meta: Meta<SelectArgs> = {
  title: 'Forms/Select',
  component: 'foundry-select',
  argTypes: {
    placeholder: { control: 'text' },
    value: { control: 'text' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    placeholder: 'Select a timezone',
    value: '',
    required: false,
    disabled: false,
    label: 'Timezone',
  },
};

export default meta;

type Story = StoryObj<SelectArgs>;

export const Default: Story = {
  render: ({ placeholder, value, required, disabled, label }) => html`
    <foundry-select
      name="timezone"
      value=${value}
      placeholder=${placeholder}
      ?required=${required}
      ?disabled=${disabled}
      style="max-width:320px;"
    >
      <span slot="label">${label}</span>
      <foundry-option value="utc">UTC</foundry-option>
      <foundry-option value="est">Eastern (EST)</foundry-option>
      <foundry-option value="pst">Pacific (PST)</foundry-option>
      <foundry-option value="cet">Central European (CET)</foundry-option>
    </foundry-select>
  `,
};

export const WithPlaceholder: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-select placeholder="Pick one" style="max-width:320px;">
      <span slot="label">Timezone</span>
      <foundry-option value="utc">UTC</foundry-option>
      <foundry-option value="est">EST</foundry-option>
    </foundry-select>
  `,
};

export const Preselected: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-select value="pst" style="max-width:320px;">
      <span slot="label">Timezone</span>
      <foundry-option value="utc">UTC</foundry-option>
      <foundry-option value="pst">Pacific Standard</foundry-option>
    </foundry-select>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-select
      name="timezone"
      placeholder="Select a timezone"
      required
      style="max-width:320px;"
    >
      <span slot="label">Timezone</span>
      <span slot="error">Please select a timezone.</span>
      <foundry-option value="utc">UTC</foundry-option>
      <foundry-option value="est">EST</foundry-option>
    </foundry-select>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-select
      placeholder="Not available"
      value="utc"
      disabled
      style="max-width:320px;"
    >
      <span slot="label">Timezone</span>
      <foundry-option value="utc">UTC</foundry-option>
      <foundry-option value="est">EST</foundry-option>
    </foundry-select>
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
      <foundry-select name="timezone" placeholder="Select a timezone" required>
        <span slot="label">Timezone</span>
        <foundry-option value="utc">UTC</foundry-option>
        <foundry-option value="est">Eastern (EST)</foundry-option>
        <foundry-option value="pst">Pacific (PST)</foundry-option>
        <foundry-option value="cet">Central European (CET)</foundry-option>
      </foundry-select>
      <button type="submit">Save</button>
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
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      <foundry-select placeholder="Empty" style="max-width:240px;">
        <span slot="label">Empty</span>
        <foundry-option value="a">A</foundry-option>
        <foundry-option value="b">B</foundry-option>
      </foundry-select>
      <foundry-select value="a" style="max-width:240px;">
        <span slot="label">Selected</span>
        <foundry-option value="a">A</foundry-option>
        <foundry-option value="b">B</foundry-option>
      </foundry-select>
      <foundry-select placeholder="Pick" required invalid style="max-width:240px;">
        <span slot="label">Invalid</span>
        <span slot="error">Required</span>
        <foundry-option value="a">A</foundry-option>
      </foundry-select>
      <foundry-select placeholder="Off" disabled style="max-width:240px;">
        <span slot="label">Disabled</span>
        <foundry-option value="a">A</foundry-option>
      </foundry-select>
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
