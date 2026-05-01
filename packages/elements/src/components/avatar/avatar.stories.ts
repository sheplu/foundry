import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryAvatar, type AvatarShape, type AvatarSize, type AvatarStatus } from './avatar.ts';

FoundryAvatar.define();

interface AvatarArgs {
  name: string;
  label: string;
  src: string;
  size: AvatarSize;
  shape: AvatarShape;
  status: AvatarStatus | '';
}

const meta: Meta<AvatarArgs> = {
  title: 'Media/Avatar',
  component: 'foundry-avatar',
  argTypes: {
    name: { control: 'text' },
    label: { control: 'text' },
    src: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] satisfies AvatarSize[] },
    shape: { control: 'inline-radio', options: ['circle', 'square'] satisfies AvatarShape[] },
    status: {
      control: 'inline-radio',
      options: ['', 'online', 'offline', 'away', 'busy'],
    },
  },
  args: {
    name: 'Ada Lovelace',
    label: '',
    src: '',
    size: 'md',
    shape: 'circle',
    status: '',
  },
};

export default meta;

type Story = StoryObj<AvatarArgs>;

export const Default: Story = {
  render: ({ name, label, src, size, shape, status }) => html`
    <foundry-avatar
      name=${name}
      label=${label || ''}
      src=${src || ''}
      size=${size}
      shape=${shape}
      status=${status || ''}
    ></foundry-avatar>
  `,
};

export const InitialsFallback: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.75rem; align-items:center;">
      <foundry-avatar name="Ada Lovelace"></foundry-avatar>
      <foundry-avatar name="Grace Hopper"></foundry-avatar>
      <foundry-avatar name="Margaret Hamilton"></foundry-avatar>
    </div>
  `,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.75rem; align-items:center;">
      <foundry-avatar size="sm" name="Ada Lovelace"></foundry-avatar>
      <foundry-avatar size="md" name="Ada Lovelace"></foundry-avatar>
      <foundry-avatar size="lg" name="Ada Lovelace"></foundry-avatar>
    </div>
  `,
};

export const Square: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.75rem; align-items:center;">
      <foundry-avatar shape="square" name="Ada Lovelace"></foundry-avatar>
      <foundry-avatar shape="square" size="lg" name="Grace Hopper"></foundry-avatar>
    </div>
  `,
};

export const WithStatus: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.75rem; align-items:center;">
      <foundry-avatar name="Ada Lovelace" status="online"></foundry-avatar>
      <foundry-avatar name="Grace Hopper" status="away"></foundry-avatar>
      <foundry-avatar name="Margaret Hamilton" status="busy"></foundry-avatar>
      <foundry-avatar name="Katherine Johnson" status="offline"></foundry-avatar>
    </div>
  `,
};

export const CustomSlottedInitials: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.75rem; align-items:center;">
      <foundry-avatar label="愛 profile">愛</foundry-avatar>
      <foundry-avatar label="Δ profile">Δ</foundry-avatar>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <div style="display:flex; gap:0.75rem; align-items:center;">
      <foundry-avatar name="Ada Lovelace"></foundry-avatar>
      <foundry-avatar name="Grace Hopper" status="online"></foundry-avatar>
      <foundry-avatar shape="square" name="Margaret Hamilton"></foundry-avatar>
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
