import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryTooltip, type TooltipPlacement } from './tooltip.ts';
import { FoundryButton } from '../button/button.ts';

FoundryTooltip.define();
FoundryButton.define();

interface TooltipArgs {
  placement: TooltipPlacement;
  triggerLabel: string;
  content: string;
  delayShow: number;
}

const meta: Meta<TooltipArgs> = {
  title: 'Feedback/Tooltip',
  component: 'foundry-tooltip',
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'] satisfies TooltipPlacement[],
    },
    triggerLabel: { control: 'text' },
    content: { control: 'text' },
    delayShow: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
  },
  args: {
    placement: 'top',
    triggerLabel: 'Hover me',
    content: 'Helpful hint',
    delayShow: 300,
  },
};

export default meta;

type Story = StoryObj<TooltipArgs>;

export const Default: Story = {
  render: ({ placement, triggerLabel, content, delayShow }) => html`
    <div style="padding:4rem;">
      <foundry-tooltip placement=${placement} delay-show=${delayShow}>
        <foundry-button>${triggerLabel}</foundry-button>
        <span slot="content">${content}</span>
      </foundry-tooltip>
    </div>
  `,
};

export const Placements: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:grid; grid-template-columns:repeat(2, max-content); gap:3rem; padding:4rem; justify-content:center; align-items:center;"
    >
      <foundry-tooltip placement="top">
        <foundry-button>Top</foundry-button>
        <span slot="content">Top tooltip</span>
      </foundry-tooltip>
      <foundry-tooltip placement="bottom">
        <foundry-button>Bottom</foundry-button>
        <span slot="content">Bottom tooltip</span>
      </foundry-tooltip>
      <foundry-tooltip placement="left">
        <foundry-button>Left</foundry-button>
        <span slot="content">Left tooltip</span>
      </foundry-tooltip>
      <foundry-tooltip placement="right">
        <foundry-button>Right</foundry-button>
        <span slot="content">Right tooltip</span>
      </foundry-tooltip>
    </div>
  `,
};

export const LongContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:4rem;">
      <foundry-tooltip placement="bottom">
        <foundry-button>Hover for details</foundry-button>
        <span slot="content">
          A longer tooltip that demonstrates the max-inline-size wrap.
          Consumers can override via --foundry-tooltip-max-inline-size.
        </span>
      </foundry-tooltip>
    </div>
  `,
};

export const ReducedMotion: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap:0.75rem; padding:4rem; font-family:sans-serif; max-width:40ch;"
    >
      <foundry-tooltip placement="bottom">
        <foundry-button>Motion-reduced</foundry-button>
        <span slot="content">Fade stops under reduced motion.</span>
      </foundry-tooltip>
      <p style="margin:0; color:var(--foundry-color-text-muted); font-size:0.875rem;">
        Under <code>prefers-reduced-motion: reduce</code> the fade transition
        halts; the tooltip still shows and hides — just without a crossfade.
      </p>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:3rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-tooltip placement="bottom">
      <foundry-button>Hover</foundry-button>
      <span slot="content">Tooltip copy</span>
    </foundry-tooltip>
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
