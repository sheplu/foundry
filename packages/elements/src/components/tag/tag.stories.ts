import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryTag, type TagVariant } from './tag.ts';

FoundryTag.define();

interface TagArgs {
  label: string;
  variant: TagVariant;
  removable: boolean;
  disabled: boolean;
  value: string;
}

const meta: Meta<TagArgs> = {
  title: 'Data/Tag',
  component: 'foundry-tag',
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'info', 'success', 'warning', 'danger'] satisfies TagVariant[],
    },
    removable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    value: { control: 'text' },
  },
  args: {
    label: 'design',
    variant: 'neutral',
    removable: true,
    disabled: false,
    value: '',
  },
};

export default meta;

type Story = StoryObj<TagArgs>;

export const Default: Story = {
  render: ({ label, variant, removable, disabled, value }) => html`
    <foundry-tag
      variant=${variant}
      value=${value || ''}
      ?removable=${removable}
      ?disabled=${disabled}
    >${label}</foundry-tag>
  `,
};

export const VariantScale: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <foundry-tag removable>neutral</foundry-tag>
      <foundry-tag variant="info" removable>info</foundry-tag>
      <foundry-tag variant="success" removable>success</foundry-tag>
      <foundry-tag variant="warning" removable>warning</foundry-tag>
      <foundry-tag variant="danger" removable>danger</foundry-tag>
    </div>
  `,
};

export const RemovableList: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem;">
      <div
        style="display:flex; gap:0.5rem; flex-wrap:wrap;"
        @remove=${(e: Event) => {
          const detail = (e as CustomEvent<{ value: string }>).detail;
          const log = (e.currentTarget as HTMLElement).parentElement?.querySelector('pre.log');
          if (log) log.textContent = `removed: ${detail.value}`;
        }}
      >
        <foundry-tag removable value="design">design</foundry-tag>
        <foundry-tag removable value="research">research</foundry-tag>
        <foundry-tag removable value="engineering">engineering</foundry-tag>
        <foundry-tag removable value="ops">ops</foundry-tag>
        <foundry-tag removable value="marketing">marketing</foundry-tag>
      </div>
      <pre
        class="log"
        style="margin:0; padding:0.5rem; background:var(--foundry-color-surface-subtle); border-radius:var(--foundry-radius-sm); font-family:ui-monospace, monospace; font-size:0.8125rem;"
      ></pre>
    </div>
  `,
};

export const ControlledRemove: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.75rem; max-width:320px;">
      <foundry-tag
        removable
        value="design"
        @remove=${(e: Event) => {
          e.preventDefault();
          const detail = (e as CustomEvent<{ value: string }>).detail;
          const log = (e.currentTarget as HTMLElement).parentElement?.querySelector('pre');
          if (log) log.textContent = `requested remove: ${detail.value}`;
        }}
      >design</foundry-tag>
      <pre
        style="margin:0; padding:0.5rem; background:var(--foundry-color-surface-subtle); border-radius:var(--foundry-radius-sm); font-family:ui-monospace, monospace; font-size:0.8125rem;"
      ></pre>
    </div>
  `,
};

export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <foundry-tag removable disabled>locked</foundry-tag>
      <foundry-tag variant="success" removable disabled>approved</foundry-tag>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
      <foundry-tag removable>neutral</foundry-tag>
      <foundry-tag variant="info" removable>info</foundry-tag>
      <foundry-tag variant="success" removable>success</foundry-tag>
      <foundry-tag variant="danger" removable>danger</foundry-tag>
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
