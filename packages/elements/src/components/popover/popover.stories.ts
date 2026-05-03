import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryPopover } from './popover.ts';
import { FoundryButton } from '../button/button.ts';
import type { PopoverPlacement } from '../../core/position.ts';

FoundryPopover.define();
FoundryButton.define();

interface PopoverArgs {
  placement: PopoverPlacement;
  triggerLabel: string;
  content: string;
}

const meta: Meta<PopoverArgs> = {
  title: 'Feedback/Popover',
  component: 'foundry-popover',
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'] satisfies PopoverPlacement[],
    },
    triggerLabel: { control: 'text' },
    content: { control: 'text' },
  },
  args: {
    placement: 'bottom',
    triggerLabel: 'Open popover',
    content: 'Popover content',
  },
};

export default meta;

type Story = StoryObj<PopoverArgs>;

export const Default: Story = {
  render: ({ placement, triggerLabel, content }) => html`
    <div style="padding:5rem;">
      <foundry-popover placement=${placement}>
        <foundry-button>${triggerLabel}</foundry-button>
        <div slot="content">${content}</div>
      </foundry-popover>
    </div>
  `,
};

export const Placements: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:grid; grid-template-columns:repeat(2, max-content); gap:4rem; padding:6rem; justify-content:center; align-items:center;"
    >
      <foundry-popover placement="top">
        <foundry-button>Top</foundry-button>
        <div slot="content">Top popover</div>
      </foundry-popover>
      <foundry-popover placement="bottom">
        <foundry-button>Bottom</foundry-button>
        <div slot="content">Bottom popover</div>
      </foundry-popover>
      <foundry-popover placement="left">
        <foundry-button>Left</foundry-button>
        <div slot="content">Left popover</div>
      </foundry-popover>
      <foundry-popover placement="right">
        <foundry-button>Right</foundry-button>
        <div slot="content">Right popover</div>
      </foundry-popover>
    </div>
  `,
};

export const RichContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:4rem;">
      <foundry-popover placement="bottom">
        <foundry-button>Edit profile</foundry-button>
        <div
          slot="content"
          style="display:flex; flex-direction:column; gap:0.5rem; font-family:sans-serif;"
        >
          <strong>Edit profile</strong>
          <p style="margin:0; color:var(--foundry-color-text-muted); font-size:0.875rem;">
            Make changes and confirm to save.
          </p>
          <foundry-button variant="primary">Save</foundry-button>
        </div>
      </foundry-popover>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:4rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 1rem;">${theme}</p>
    <foundry-popover placement="bottom">
      <foundry-button>Open</foundry-button>
      <div slot="content">Popover body</div>
    </foundry-popover>
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
