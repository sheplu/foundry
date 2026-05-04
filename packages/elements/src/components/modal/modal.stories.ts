import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryModal, type ModalSize } from './modal.ts';
import { FoundryButton } from '../button/button.ts';

FoundryModal.define();
FoundryButton.define();

interface ModalArgs {
  size: ModalSize;
  dismissOnBackdrop: boolean;
  hideCloseButton: boolean;
}

const meta: Meta<ModalArgs> = {
  title: 'Overlays/Modal',
  component: 'foundry-modal',
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] satisfies ModalSize[] },
    dismissOnBackdrop: { control: 'boolean' },
    hideCloseButton: { control: 'boolean' },
  },
  args: {
    size: 'md',
    dismissOnBackdrop: true,
    hideCloseButton: false,
  },
};

export default meta;

type Story = StoryObj<ModalArgs>;

function openNearest(event: Event): void {
  const btn = event.currentTarget as HTMLElement;
  const modal = btn.parentElement?.querySelector('foundry-modal') as FoundryModal | null;
  modal?.show();
}

export const Default: Story = {
  render: ({ size, dismissOnBackdrop, hideCloseButton }) => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open modal</foundry-button>
      <foundry-modal
        size=${size}
        ?dismiss-on-backdrop=${dismissOnBackdrop}
        ?hide-close-button=${hideCloseButton}
      >
        <span slot="title">Profile updated</span>
        <span slot="description">Your changes have been saved successfully.</span>
        <p style="margin:0;">The modal surface hosts free-form content. Close via the X, Escape, or backdrop click.</p>
      </foundry-modal>
    </div>
  `,
};

export const WithFooter: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open with footer</foundry-button>
      <foundry-modal size="sm">
        <span slot="title">Save changes?</span>
        <span slot="description">Unsaved changes will be lost.</span>
        <p style="margin:0;">You have pending edits to your profile.</p>
        <form slot="footer" method="dialog" style="display:contents;">
          <foundry-button type="submit" value="cancel" variant="secondary">Cancel</foundry-button>
          <foundry-button type="submit" value="save" variant="primary">Save</foundry-button>
        </form>
      </foundry-modal>
    </div>
  `,
};

export const ConfirmDialog: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button
        @click=${(e: Event) => {
          const btn = e.currentTarget as HTMLElement;
          const modal = btn.parentElement?.querySelector('foundry-modal') as FoundryModal | null;
          modal?.show();
        }}
      >
        Delete account
      </foundry-button>
      <pre
        data-result
        style="margin-block-start:0.75rem; padding:0.5rem; background:var(--foundry-color-surface-subtle); border-radius:var(--foundry-radius-sm); font-family:ui-monospace, monospace; font-size:0.8125rem; min-height:1.5em;"
      ></pre>
      <foundry-modal
        size="sm"
        dismiss-on-backdrop
        @close=${(event: Event) => {
          const detail = (event as CustomEvent<{ returnValue: string }>).detail;
          const pre = (event.currentTarget as HTMLElement).parentElement?.querySelector('[data-result]');
          if (pre) pre.textContent = detail.returnValue || '(dismissed)';
        }}
      >
        <span slot="title">Delete account?</span>
        <span slot="description">This action cannot be undone.</span>
        <p style="margin:0;">All your projects and settings will be permanently removed.</p>
        <form slot="footer" method="dialog" style="display:contents;">
          <foundry-button type="submit" value="cancel" variant="secondary">Cancel</foundry-button>
          <foundry-button type="submit" value="confirm" variant="danger">Delete</foundry-button>
        </form>
      </foundry-modal>
    </div>
  `,
};

export const LongContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open long-content modal</foundry-button>
      <foundry-modal size="md">
        <span slot="title">Terms of service</span>
        <span slot="description">Please review the terms before continuing.</span>
        ${Array.from({ length: 20 }).map((_, i) => html`
          <p style="margin:0 0 0.75rem;">Section ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        `)}
        <form slot="footer" method="dialog" style="display:contents;">
          <foundry-button type="submit" value="accept" variant="primary">Accept</foundry-button>
        </form>
      </foundry-modal>
    </div>
  `,
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
      <foundry-button @click=${openNearest}>Small</foundry-button>
      <foundry-modal size="sm">
        <span slot="title">Small modal</span>
        <p style="margin:0;">Narrow width (24rem) for short confirmations.</p>
      </foundry-modal>
      <foundry-button @click=${openNearest}>Medium</foundry-button>
      <foundry-modal size="md">
        <span slot="title">Medium modal</span>
        <p style="margin:0;">Default width (32rem) for most dialogs.</p>
      </foundry-modal>
      <foundry-button @click=${openNearest}>Large</foundry-button>
      <foundry-modal size="lg">
        <span slot="title">Large modal</span>
        <p style="margin:0;">Wider (48rem) for detailed forms or rich content.</p>
      </foundry-modal>
    </div>
  `,
};

export const NonDismissible: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <div style="padding:1rem;">
      <foundry-button @click=${openNearest}>Open blocking modal</foundry-button>
      <foundry-modal
        size="sm"
        dismiss-on-backdrop="false"
        hide-close-button
        @close=${() => undefined}
      >
        <span slot="title">Action required</span>
        <span slot="description">Backdrop + Escape are disabled; you must pick an option.</span>
        <p style="margin:0;">This modal requires an explicit response.</p>
        <form slot="footer" method="dialog" style="display:contents;">
          <foundry-button type="submit" value="decline" variant="secondary">Decline</foundry-button>
          <foundry-button type="submit" value="accept" variant="primary">Accept</foundry-button>
        </form>
      </foundry-modal>
    </div>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <foundry-button @click=${openNearest}>Open (${theme})</foundry-button>
    <foundry-modal size="sm">
      <span slot="title">Themed modal</span>
      <span slot="description">Surface, border, and backdrop pick up the theme tokens.</span>
      <p style="margin:0;">Close via Escape, backdrop, or the X.</p>
    </foundry-modal>
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
