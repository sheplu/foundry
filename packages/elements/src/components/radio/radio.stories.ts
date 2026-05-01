import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryRadio } from './radio.ts';

FoundryRadio.define();

interface RadioArgs {
  label: string;
  checked: boolean;
  required: boolean;
  disabled: boolean;
  value: string;
}

const meta: Meta<RadioArgs> = {
  title: 'Forms/Radio',
  component: 'foundry-radio',
  argTypes: {
    label: { control: 'text' },
    checked: { control: 'boolean' },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
  },
  args: {
    label: 'Option',
    checked: false,
    required: false,
    disabled: false,
    value: 'on',
  },
};

export default meta;

type Story = StoryObj<RadioArgs>;

export const Default: Story = {
  render: ({ label, checked, required, disabled, value }) => html`
    <foundry-radio
      name="stories-default"
      value=${value}
      ?checked=${checked}
      ?required=${required}
      ?disabled=${disabled}
    >
      <span slot="label">${label}</span>
    </foundry-radio>
  `,
};

export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-radio name="stories-group" value="free" checked>
        <span slot="label">Free</span>
      </foundry-radio>
      <foundry-radio name="stories-group" value="pro">
        <span slot="label">Pro</span>
      </foundry-radio>
      <foundry-radio name="stories-group" value="enterprise">
        <span slot="label">Enterprise</span>
      </foundry-radio>
    </div>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-radio name="stories-disabled" value="a" disabled>
        <span slot="label">Disabled + unchecked</span>
      </foundry-radio>
      <foundry-radio name="stories-disabled" value="b" disabled checked>
        <span slot="label">Disabled + checked</span>
      </foundry-radio>
      <foundry-radio name="stories-disabled-mixed" value="c">
        <span slot="label">Enabled</span>
      </foundry-radio>
      <foundry-radio name="stories-disabled-mixed" value="d" disabled>
        <span slot="label">Disabled in mixed group</span>
      </foundry-radio>
    </div>
  `,
};

export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-radio name="stories-required" value="x" required>
        <span slot="label">Required (unchecked — invalid)</span>
      </foundry-radio>
      <foundry-radio name="stories-required" value="y" required>
        <span slot="label">Required alt</span>
      </foundry-radio>
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
      <fieldset style="border:1px solid var(--foundry-color-border); border-radius:var(--foundry-radius-md); padding:0.75rem;">
        <legend>Plan</legend>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <foundry-radio name="plan" value="free" checked>
            <span slot="label">Free</span>
          </foundry-radio>
          <foundry-radio name="plan" value="pro">
            <span slot="label">Pro</span>
          </foundry-radio>
          <foundry-radio name="plan" value="enterprise">
            <span slot="label">Enterprise</span>
          </foundry-radio>
        </div>
      </fieldset>
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
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-radio name="theming-${theme}" value="a" checked>
        <span slot="label">Checked</span>
      </foundry-radio>
      <foundry-radio name="theming-${theme}" value="b">
        <span slot="label">Unchecked</span>
      </foundry-radio>
      <foundry-radio name="theming-${theme}-required" value="x" required invalid>
        <span slot="label">Invalid</span>
      </foundry-radio>
      <foundry-radio name="theming-${theme}-disabled" value="y" disabled>
        <span slot="label">Disabled</span>
      </foundry-radio>
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
