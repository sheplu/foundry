import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryText, type TextVariant } from './text.ts';

FoundryText.define();

interface TextArgs {
  variant: TextVariant;
  label: string;
}

const meta: Meta<TextArgs> = {
  title: 'Typography/Text',
  component: 'foundry-text',
  argTypes: {
    variant: { control: 'inline-radio', options: ['body', 'body-sm', 'caption', 'emphasis'] },
    label: { control: 'text' },
  },
  args: {
    variant: 'body',
    label: 'The quick brown fox jumps over the lazy dog',
  },
};

export default meta;

type Story = StoryObj<TextArgs>;

export const Default: Story = {
  render: ({ variant, label }) => html`
    <foundry-text variant=${variant}>${label}</foundry-text>
  `,
};

const variants: TextVariant[] = ['body', 'body-sm', 'caption', 'emphasis'];

export const VariantScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      ${variants.map((v) => html`
        <div>
          <foundry-text variant=${v}>variant=${v} · The quick brown fox</foundry-text>
        </div>
      `)}
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
        <div><foundry-text>body copy</foundry-text></div>
        <div><foundry-text variant="body-sm">body-sm copy</foundry-text></div>
        <div><foundry-text variant="caption">caption copy</foundry-text></div>
        <div><foundry-text variant="emphasis">emphasis copy</foundry-text></div>
      </div>
      <div
        data-theme="dark"
        style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md);"
      >
        <p>Dark</p>
        <div><foundry-text>body copy</foundry-text></div>
        <div><foundry-text variant="body-sm">body-sm copy</foundry-text></div>
        <div><foundry-text variant="caption">caption copy</foundry-text></div>
        <div><foundry-text variant="emphasis">emphasis copy</foundry-text></div>
      </div>
    </div>
  `,
};
