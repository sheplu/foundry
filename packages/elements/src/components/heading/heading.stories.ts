import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryHeading, type HeadingLevel, type HeadingSize } from './heading.ts';

FoundryHeading.define();

interface HeadingArgs {
  level: HeadingLevel;
  size: HeadingSize | '';
  label: string;
}

const meta: Meta<HeadingArgs> = {
  title: 'Typography/Heading',
  component: 'foundry-heading',
  argTypes: {
    level: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
    size: { control: 'inline-radio', options: ['', 'sm', 'md', 'lg', 'xl'] },
    label: { control: 'text' },
  },
  args: {
    level: 2,
    size: '',
    label: 'The quick brown fox jumps over the lazy dog',
  },
};

export default meta;

type Story = StoryObj<HeadingArgs>;

export const Default: Story = {
  render: ({ level, size, label }) => html`
    <foundry-heading level=${level} size=${size || ''}>${label}</foundry-heading>
  `,
};

const levels: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

export const LevelScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      ${levels.map((l) => html`
        <foundry-heading level=${l}>
          level=${l} (default size)
        </foundry-heading>
      `)}
    </div>
  `,
};

export const SizeDecoupled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      <foundry-heading level="2" size="xl">level=2 · size=xl (display, still h2)</foundry-heading>
      <foundry-heading level="2" size="lg">level=2 · size=lg (default)</foundry-heading>
      <foundry-heading level="2" size="md">level=2 · size=md</foundry-heading>
      <foundry-heading level="2" size="sm">level=2 · size=sm</foundry-heading>
    </div>
  `,
};

export const Theming: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem;">
      <div
        data-theme="light"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p>Light</p>
        <foundry-heading level="2" size="lg">Heading lg</foundry-heading>
        <foundry-heading level="3" size="md">Heading md</foundry-heading>
      </div>
      <div
        data-theme="dark"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p>Dark</p>
        <foundry-heading level="2" size="lg">Heading lg</foundry-heading>
        <foundry-heading level="3" size="md">Heading md</foundry-heading>
      </div>
    </div>
  `,
};
