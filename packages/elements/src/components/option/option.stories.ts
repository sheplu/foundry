import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryOption } from './option.ts';

FoundryOption.define();

const meta: Meta = {
  title: 'Forms/Option',
  component: 'foundry-option',
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => html`<foundry-option value="utc">UTC</foundry-option>`,
};

export const Disabled: Story = {
  render: () => html`<foundry-option value="cet" disabled>CET</foundry-option>`,
};

export const ValueFromTextContent: Story = {
  render: () => html`<foundry-option>Pacific Standard</foundry-option>`,
};
