import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import {
  FoundryToastRegion,
  type ToastPosition,
} from './toast-region.ts';
import { FoundryButton } from '../button/button.ts';

FoundryToastRegion.define();
FoundryButton.define();

interface RegionArgs {
  position: ToastPosition;
  max: number;
}

const meta: Meta<RegionArgs> = {
  title: 'Feedback/ToastRegion',
  component: 'foundry-toast-region',
  argTypes: {
    position: {
      control: 'inline-radio',
      options: [
        'top-start', 'top-center', 'top-end',
        'bottom-start', 'bottom-center', 'bottom-end',
      ] satisfies ToastPosition[],
    },
    max: { control: { type: 'number', min: 1, max: 20, step: 1 } },
  },
  args: {
    position: 'bottom-end',
    max: 5,
  },
};

export default meta;

type Story = StoryObj<RegionArgs>;

let spawnCounter = 0;

function spawnFromButton(event: Event, variant: 'info' | 'success' | 'warning' | 'danger'): void {
  const button = event.currentTarget as HTMLElement;
  const region = button.closest('foundry-toast-region') as FoundryToastRegion | null;
  if (!region) return;
  spawnCounter += 1;
  region.add({
    variant,
    title: `${variant[0]?.toUpperCase()}${variant.slice(1)} #${spawnCounter}`,
    message: `Spawned at ${new Date().toLocaleTimeString()}.`,
    duration: 4000,
  });
}

export const Default: Story = {
  render: ({ position, max }) => html`
    <foundry-toast-region position=${position} max=${max}>
      <div style="padding:2rem; font-family:sans-serif;">
        <p style="margin:0 0 1rem;">Click a button to spawn a toast.</p>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <foundry-button @click=${(e: Event) => spawnFromButton(e, 'info')}>Info</foundry-button>
          <foundry-button variant="primary" @click=${(e: Event) => spawnFromButton(e, 'success')}>Success</foundry-button>
          <foundry-button variant="secondary" @click=${(e: Event) => spawnFromButton(e, 'warning')}>Warning</foundry-button>
          <foundry-button variant="danger" @click=${(e: Event) => spawnFromButton(e, 'danger')}>Error</foundry-button>
        </div>
      </div>
    </foundry-toast-region>
  `,
};

export const Positions: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem; font-family:sans-serif; max-inline-size:40rem;">
      <p style="margin:0 0 1rem;">Six regions with pre-rendered declarative toasts — one per position.</p>
      ${(
        ['top-start', 'top-center', 'top-end',
          'bottom-start', 'bottom-center', 'bottom-end'] as ToastPosition[]
      ).map((position) => html`
        <foundry-toast-region position=${position}>
          <foundry-toast slot="items" duration="0" variant="info" style="--foundry-toast-min-inline-size:12rem;">
            <span slot="title">${position}</span>
            Toast in ${position}.
          </foundry-toast>
        </foundry-toast-region>
      `)}
    </div>
  `,
};

export const MaxStack: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <foundry-toast-region max="3">
      <div style="padding:2rem; font-family:sans-serif;">
        <p style="margin:0 0 1rem;">max="3" — the oldest auto-dismisses when a fourth arrives.</p>
        <foundry-button
          @click=${(e: Event) => {
            const button = e.currentTarget as HTMLElement;
            const region = button.closest('foundry-toast-region') as FoundryToastRegion;
            for (let i = 0; i < 5; i += 1) {
              setTimeout(() => {
                region.add({
                  variant: 'info',
                  title: `Toast ${i + 1}`,
                  message: `Spawned at ${new Date().toLocaleTimeString()}.`,
                  duration: 0,
                });
              }, i * 200);
            }
          }}
        >
          Spawn 5 toasts
        </foundry-button>
      </div>
    </foundry-toast-region>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.75rem;">${theme}</p>
    <foundry-toast-region position="bottom-end">
      <foundry-toast slot="items" variant="success" duration="0" style="--foundry-toast-min-inline-size:14rem;">
        <span slot="title">Themed</span>
        Success notification.
      </foundry-toast>
    </foundry-toast-region>
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
