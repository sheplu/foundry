import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryTabs, type TabsOrientation } from './tabs.ts';

FoundryTabs.define();

interface TabsArgs {
  orientation: TabsOrientation;
  value: string;
}

const meta: Meta<TabsArgs> = {
  title: 'Layout/Tabs',
  component: 'foundry-tabs',
  argTypes: {
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'] satisfies TabsOrientation[],
    },
    value: { control: 'text' },
  },
  args: {
    orientation: 'horizontal',
    value: '',
  },
};

export default meta;

type Story = StoryObj<TabsArgs>;

export const Default: Story = {
  render: ({ orientation, value }) => html`
    <foundry-tabs orientation=${orientation} value=${value} style="max-inline-size:40rem;">
      <foundry-tab slot="tab" value="overview">Overview</foundry-tab>
      <foundry-tab slot="tab" value="activity">Activity</foundry-tab>
      <foundry-tab slot="tab" value="settings">Settings</foundry-tab>
      <foundry-panel>
        <p style="margin:0;">High-level summary of the project.</p>
      </foundry-panel>
      <foundry-panel>
        <p style="margin:0;">Recent events in chronological order.</p>
      </foundry-panel>
      <foundry-panel>
        <p style="margin:0;">Configuration options for the workspace.</p>
      </foundry-panel>
    </foundry-tabs>
  `,
};

export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-tabs orientation="vertical" style="max-inline-size:40rem;">
      <foundry-tab slot="tab" value="profile">Profile</foundry-tab>
      <foundry-tab slot="tab" value="billing">Billing</foundry-tab>
      <foundry-tab slot="tab" value="security">Security</foundry-tab>
      <foundry-panel>
        <p style="margin:0;">Profile settings panel.</p>
      </foundry-panel>
      <foundry-panel>
        <p style="margin:0;">Billing details panel.</p>
      </foundry-panel>
      <foundry-panel>
        <p style="margin:0;">Security and access panel.</p>
      </foundry-panel>
    </foundry-tabs>
  `,
};

export const Overflow: Story = {
  parameters: { controls: { disable: true } },
  render: () => {
    const labels = [
      'Overview', 'Activity', 'Settings', 'Billing', 'Integrations',
      'API keys', 'Webhooks', 'Audit log', 'Notifications', 'Members',
      'Permissions', 'Archive',
    ];
    return html`
      <foundry-tabs style="max-inline-size:32rem;">
        ${labels.map((label) => html`
          <foundry-tab slot="tab" value=${label.toLowerCase().replace(/\s+/g, '-')}>
            ${label}
          </foundry-tab>
        `)}
        ${labels.map((label) => html`
          <foundry-panel>
            <p style="margin:0;">${label} panel content.</p>
          </foundry-panel>
        `)}
      </foundry-tabs>
    `;
  },
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-tabs style="max-inline-size:32rem;">
      <foundry-tab slot="tab" value="ok">Active</foundry-tab>
      <foundry-tab slot="tab" value="wip" disabled>Coming soon</foundry-tab>
      <foundry-tab slot="tab" value="done">Complete</foundry-tab>
      <foundry-panel><p style="margin:0;">Active panel.</p></foundry-panel>
      <foundry-panel><p style="margin:0;">Disabled panel.</p></foundry-panel>
      <foundry-panel><p style="margin:0;">Complete panel.</p></foundry-panel>
    </foundry-tabs>
  `,
};

export const Preselected: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-tabs value="activity" style="max-inline-size:32rem;">
      <foundry-tab slot="tab" value="overview">Overview</foundry-tab>
      <foundry-tab slot="tab" value="activity">Activity</foundry-tab>
      <foundry-tab slot="tab" value="settings">Settings</foundry-tab>
      <foundry-panel><p style="margin:0;">Overview panel.</p></foundry-panel>
      <foundry-panel><p style="margin:0;">Activity panel (preselected).</p></foundry-panel>
      <foundry-panel><p style="margin:0;">Settings panel.</p></foundry-panel>
    </foundry-tabs>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-tabs>
      <foundry-tab slot="tab" value="a">Alpha</foundry-tab>
      <foundry-tab slot="tab" value="b">Beta</foundry-tab>
      <foundry-tab slot="tab" value="c" disabled>Gamma</foundry-tab>
      <foundry-panel><p style="margin:0;">Alpha panel.</p></foundry-panel>
      <foundry-panel><p style="margin:0;">Beta panel.</p></foundry-panel>
      <foundry-panel><p style="margin:0;">Gamma panel.</p></foundry-panel>
    </foundry-tabs>
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
