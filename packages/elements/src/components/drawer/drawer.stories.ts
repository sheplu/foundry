import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryDrawer, type DrawerPlacement } from './drawer.ts';
import { FoundryButton } from '../button/button.ts';

FoundryDrawer.define();
FoundryButton.define();

interface DrawerArgs {
  placement: DrawerPlacement;
  dismissOnBackdrop: boolean;
  hideCloseButton: boolean;
}

const meta: Meta<DrawerArgs> = {
  title: 'Overlays/Drawer',
  component: 'foundry-drawer',
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['start', 'end', 'top', 'bottom'] satisfies DrawerPlacement[],
    },
    dismissOnBackdrop: { control: 'boolean' },
    hideCloseButton: { control: 'boolean' },
  },
  args: {
    placement: 'end',
    dismissOnBackdrop: true,
    hideCloseButton: false,
  },
};

export default meta;

type Story = StoryObj<DrawerArgs>;

function openNearest(event: Event): void {
  const btn = event.currentTarget as HTMLElement;
  const drawer = btn.parentElement?.querySelector('foundry-drawer') as FoundryDrawer | null;
  drawer?.show();
}

export const Default: Story = {
  render: ({ placement, dismissOnBackdrop, hideCloseButton }) => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open drawer</foundry-button>
      <foundry-drawer
        placement=${placement}
        ?dismiss-on-backdrop=${dismissOnBackdrop}
        ?hide-close-button=${hideCloseButton}
      >
        <span slot="title">Filter results</span>
        <span slot="description">Narrow the list by applying filters below.</span>
        <p style="margin:0 0 0.5rem;">Drawers host side-panel navigation, filter pickers, or detail views without taking the user off the current screen.</p>
        <p style="margin:0;">Dismiss with the X, Escape, or a backdrop click.</p>
      </foundry-drawer>
    </div>
  `,
};

export const FromStart: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open from start</foundry-button>
      <foundry-drawer placement="start">
        <span slot="title">Navigation</span>
        <p style="margin:0;">A left-anchored drawer for app-shell navigation.</p>
      </foundry-drawer>
    </div>
  `,
};

export const FromTop: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open from top</foundry-button>
      <foundry-drawer placement="top">
        <span slot="title">Global banner</span>
        <p style="margin:0;">A top-anchored drawer for announcements or global actions.</p>
      </foundry-drawer>
    </div>
  `,
};

export const FromBottom: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open from bottom</foundry-button>
      <foundry-drawer placement="bottom">
        <span slot="title">Mobile sheet</span>
        <p style="margin:0;">A bottom-anchored drawer — the typical mobile sheet pattern.</p>
      </foundry-drawer>
    </div>
  `,
};

export const WithFooter: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open with footer</foundry-button>
      <foundry-drawer placement="end">
        <span slot="title">Edit profile</span>
        <span slot="description">Make changes to your account details.</span>
        <p style="margin:0;">Form content goes here.</p>
        <form slot="footer" method="dialog" style="display:contents;">
          <foundry-button type="submit" value="cancel" variant="secondary">Cancel</foundry-button>
          <foundry-button type="submit" value="save" variant="primary">Save</foundry-button>
        </form>
      </foundry-drawer>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-button @click=${openNearest}>Open drawer</foundry-button>
    <foundry-drawer placement="end">
      <span slot="title">Themed drawer</span>
      <p style="margin:0;">Surface inherits the active theme tokens.</p>
    </foundry-drawer>
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
