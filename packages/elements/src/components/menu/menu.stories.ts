import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryIcon, check, chevronDown, close } from '@foundry/icons';
import { FoundryMenu } from './menu.ts';
import { FoundryButton } from '../button/button.ts';
import { type PopoverPlacement } from '../../core/position.ts';

FoundryMenu.define();
FoundryButton.define();
FoundryIcon.register({ check, 'chevron-down': chevronDown, close });
FoundryIcon.define();

interface MenuArgs {
  placement: PopoverPlacement;
}

const meta: Meta<MenuArgs> = {
  title: 'Overlays/Menu',
  component: 'foundry-menu',
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'] satisfies PopoverPlacement[],
    },
  },
  args: {
    placement: 'bottom',
  },
};

export default meta;

type Story = StoryObj<MenuArgs>;

export const Default: Story = {
  render: ({ placement }) => html`
    <div style="padding:4rem;">
      <foundry-menu placement=${placement}>
        <foundry-button>Actions</foundry-button>
        <foundry-menuitem slot="items" value="edit">Edit</foundry-menuitem>
        <foundry-menuitem slot="items" value="duplicate">Duplicate</foundry-menuitem>
        <foundry-menuitem slot="items" value="archive">Archive</foundry-menuitem>
        <foundry-menuitem slot="items" value="delete" disabled>Delete</foundry-menuitem>
      </foundry-menu>
    </div>
  `,
};

export const WithIcons: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:4rem;">
      <foundry-menu>
        <foundry-button>Actions</foundry-button>
        <foundry-menuitem slot="items" value="edit">
          <foundry-icon slot="icon" name="check"></foundry-icon>
          Edit
        </foundry-menuitem>
        <foundry-menuitem slot="items" value="duplicate">
          <foundry-icon slot="icon" name="check"></foundry-icon>
          Duplicate
        </foundry-menuitem>
        <foundry-menuitem slot="items" value="delete">
          <foundry-icon slot="icon" name="close"></foundry-icon>
          Delete
        </foundry-menuitem>
      </foundry-menu>
    </div>
  `,
};

export const WithShortcuts: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:4rem;">
      <foundry-menu>
        <foundry-button>Actions</foundry-button>
        <foundry-menuitem slot="items" value="save">
          Save
          <span slot="shortcut">⌘S</span>
        </foundry-menuitem>
        <foundry-menuitem slot="items" value="duplicate">
          Duplicate
          <span slot="shortcut">⌘D</span>
        </foundry-menuitem>
        <foundry-menuitem slot="items" value="delete">
          Delete
          <span slot="shortcut">⌫</span>
        </foundry-menuitem>
      </foundry-menu>
    </div>
  `,
};

export const Mixed: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:4rem;">
      <foundry-menu>
        <foundry-button>Actions</foundry-button>
        <foundry-menuitem slot="items" value="save">
          <foundry-icon slot="icon" name="check"></foundry-icon>
          Save
          <span slot="shortcut">⌘S</span>
        </foundry-menuitem>
        <foundry-menuitem slot="items" value="archive">
          Archive
        </foundry-menuitem>
        <foundry-menuitem slot="items" value="rename">
          <foundry-icon slot="icon" name="check"></foundry-icon>
          Rename
        </foundry-menuitem>
        <foundry-menuitem slot="items" value="delete">
          Delete
          <span slot="shortcut">⌫</span>
        </foundry-menuitem>
      </foundry-menu>
    </div>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:4rem;">
      <foundry-menu>
        <foundry-button>Actions</foundry-button>
        <foundry-menuitem slot="items" value="edit">Edit</foundry-menuitem>
        <foundry-menuitem slot="items" value="archive" disabled>Archive (disabled)</foundry-menuitem>
        <foundry-menuitem slot="items" value="delete">Delete</foundry-menuitem>
      </foundry-menu>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:3rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-menu>
      <foundry-button>Actions</foundry-button>
      <foundry-menuitem slot="items" value="a">Alpha</foundry-menuitem>
      <foundry-menuitem slot="items" value="b">Beta</foundry-menuitem>
      <foundry-menuitem slot="items" value="c" disabled>Gamma</foundry-menuitem>
    </foundry-menu>
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
