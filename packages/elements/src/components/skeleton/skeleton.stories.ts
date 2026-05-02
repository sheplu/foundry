import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundrySkeleton, type SkeletonShape } from './skeleton.ts';

FoundrySkeleton.define();

interface SkeletonArgs {
  shape: SkeletonShape;
  label: string;
  width: string;
}

const meta: Meta<SkeletonArgs> = {
  title: 'Feedback/Skeleton',
  component: 'foundry-skeleton',
  argTypes: {
    shape: {
      control: 'inline-radio',
      options: ['text', 'circle', 'rect'] satisfies SkeletonShape[],
    },
    label: { control: 'text' },
    width: { control: 'text' },
  },
  args: {
    shape: 'text',
    label: '',
    width: '',
  },
};

export default meta;

type Story = StoryObj<SkeletonArgs>;

export const Default: Story = {
  render: ({ shape, label, width }) => html`
    <foundry-skeleton
      shape=${shape}
      label=${label || ''}
      style=${width ? `--foundry-skeleton-width: ${width};` : ''}
    ></foundry-skeleton>
  `,
};

export const Shapes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; gap:1rem; align-items:center;">
      <foundry-skeleton style="--foundry-skeleton-width: 8rem;"></foundry-skeleton>
      <foundry-skeleton shape="circle"></foundry-skeleton>
      <foundry-skeleton shape="rect" style="--foundry-skeleton-width: 8rem;"></foundry-skeleton>
    </div>
  `,
};

export const Paragraph: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="display:flex; flex-direction:column; gap:0.5rem; max-width:32rem;">
      <foundry-skeleton></foundry-skeleton>
      <foundry-skeleton style="--foundry-skeleton-width: 85%;"></foundry-skeleton>
      <foundry-skeleton style="--foundry-skeleton-width: 60%;"></foundry-skeleton>
    </div>
  `,
};

export const Card: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap:0.75rem; padding:1rem; border-radius:var(--foundry-radius-md); background:var(--foundry-color-surface); max-width:24rem;"
    >
      <div style="display:flex; gap:0.75rem; align-items:center;">
        <foundry-skeleton shape="circle"></foundry-skeleton>
        <div style="display:flex; flex-direction:column; gap:0.25rem; flex:1;">
          <foundry-skeleton style="--foundry-skeleton-width: 60%;"></foundry-skeleton>
          <foundry-skeleton style="--foundry-skeleton-width: 40%;"></foundry-skeleton>
        </div>
      </div>
      <foundry-skeleton
        shape="rect"
        style="--foundry-skeleton-block-size: 8rem;"
      ></foundry-skeleton>
    </div>
  `,
};

export const ReducedMotion: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div
      style="display:flex; flex-direction:column; gap:0.75rem; font-family:sans-serif; max-width:40ch;"
    >
      <div style="display:flex; gap:1rem; align-items:center;">
        <foundry-skeleton style="--foundry-skeleton-width: 8rem;"></foundry-skeleton>
        <foundry-skeleton shape="circle"></foundry-skeleton>
      </div>
      <p style="margin:0; color:var(--foundry-color-text-muted); font-size:0.875rem;">
        Under <code>prefers-reduced-motion: reduce</code> the pulse stops;
        the placeholder still shows at the same size.
      </p>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      <foundry-skeleton></foundry-skeleton>
      <foundry-skeleton style="--foundry-skeleton-width: 85%;"></foundry-skeleton>
      <foundry-skeleton shape="rect" style="--foundry-skeleton-block-size: 3rem;"></foundry-skeleton>
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
