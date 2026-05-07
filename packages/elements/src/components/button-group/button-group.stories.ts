import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import {
  FoundryButtonGroup,
  type ButtonGroupMode,
  type ButtonGroupOrientation,
} from './button-group.ts';
import { FoundryButton } from '../button/button.ts';

FoundryButton.define();
FoundryButtonGroup.define();

interface GroupArgs {
  mode: ButtonGroupMode | '';
  orientation: ButtonGroupOrientation;
  disabled: boolean;
  label: string;
}

const meta: Meta<GroupArgs> = {
  title: 'Forms/Button group',
  component: 'foundry-button-group',
  argTypes: {
    mode: {
      control: { type: 'inline-radio' },
      options: ['', 'single', 'multiple'],
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
    },
    disabled: { control: { type: 'boolean' } },
    label: { control: { type: 'text' } },
  },
  args: {
    mode: 'single',
    orientation: 'horizontal',
    disabled: false,
    label: 'View mode',
  },
};

export default meta;

type Story = StoryObj<GroupArgs>;

function bindValue(event: Event): void {
  const detail = (event as CustomEvent<{ value: string | string[] }>).detail;
  const serialized = Array.isArray(detail.value) ? detail.value.join(',') : detail.value;
  (event.currentTarget as Element).setAttribute('value', serialized);
}

export const Presentation: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-button-group label="Actions">
      <foundry-button>Save</foundry-button>
      <foundry-button>Preview</foundry-button>
      <foundry-button>Publish</foundry-button>
    </foundry-button-group>
  `,
};

export const Single: Story = {
  render: ({ orientation, disabled, label }) => html`
    <foundry-button-group
      mode="single"
      value="grid"
      orientation=${orientation}
      ?disabled=${disabled}
      label=${label}
      @change=${bindValue}
    >
      <foundry-button value="list">List</foundry-button>
      <foundry-button value="grid">Grid</foundry-button>
      <foundry-button value="kanban">Kanban</foundry-button>
    </foundry-button-group>
  `,
};

export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-button-group
      mode="multiple"
      value="bold,italic"
      label="Text format"
      @change=${bindValue}
    >
      <foundry-button value="bold">Bold</foundry-button>
      <foundry-button value="italic">Italic</foundry-button>
      <foundry-button value="underline">Underline</foundry-button>
    </foundry-button-group>
  `,
};

export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-button-group
      mode="single"
      value="list"
      orientation="vertical"
      label="Layout"
      @change=${bindValue}
    >
      <foundry-button value="list">List</foundry-button>
      <foundry-button value="grid">Grid</foundry-button>
      <foundry-button value="kanban">Kanban</foundry-button>
    </foundry-button-group>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-button-group mode="single" value="grid" disabled label="View mode">
      <foundry-button value="list">List</foundry-button>
      <foundry-button value="grid">Grid</foundry-button>
      <foundry-button value="kanban">Kanban</foundry-button>
    </foundry-button-group>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-button-group mode="single" value="grid" label="View mode" @change=${bindValue}>
      <foundry-button value="list">List</foundry-button>
      <foundry-button value="grid">Grid</foundry-button>
      <foundry-button value="kanban">Kanban</foundry-button>
    </foundry-button-group>
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
