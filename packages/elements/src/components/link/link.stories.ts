import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import { FoundryLink, type LinkVariant } from './link.ts';

FoundryLink.define();

interface LinkArgs {
  label: string;
  href: string;
  variant: LinkVariant;
  target: '' | '_self' | '_blank';
}

const meta: Meta<LinkArgs> = {
  title: 'Navigation/Link',
  component: 'foundry-link',
  argTypes: {
    label: { control: 'text' },
    href: { control: 'text' },
    variant: { control: 'inline-radio', options: ['inline', 'standalone'] satisfies LinkVariant[] },
    target: { control: 'inline-radio', options: ['', '_self', '_blank'] },
  },
  args: {
    label: 'Read the docs',
    href: 'https://example.com/docs',
    variant: 'inline',
    target: '',
  },
};

export default meta;

type Story = StoryObj<LinkArgs>;

export const Default: Story = {
  render: ({ label, href, variant, target }) => html`
    <foundry-link
      variant=${variant}
      href=${href}
      target=${target || ''}
    >
      ${label}
    </foundry-link>
  `,
};

export const Inline: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <p style="max-width:40ch; font-family:sans-serif; line-height:1.6;">
      Foundry ships components as real
      <foundry-link href="https://developer.mozilla.org/docs/Web/Web_Components">web components</foundry-link>,
      so they work in any framework or none at all. Read the
      <foundry-link href="/docs">getting-started guide</foundry-link> to install them.
    </p>
  `,
};

export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <nav
      style="display:flex; flex-direction:column; gap:0.5rem; font-family:sans-serif;"
      aria-label="Docs"
    >
      <foundry-link variant="standalone" href="/docs">Overview</foundry-link>
      <foundry-link variant="standalone" href="/docs/install">Installation</foundry-link>
      <foundry-link variant="standalone" href="/docs/components">Components</foundry-link>
      <foundry-link variant="standalone" href="/docs/theming">Theming</foundry-link>
    </nav>
  `,
};

export const External: Story = {
  parameters: { controls: { disable: true } },
  render: () => html`
    <p style="font-family:sans-serif;">
      See the
      <foundry-link href="https://example.com/spec" target="_blank">
        specification
      </foundry-link>
      for details. (Opens in a new tab with <code>rel="noopener"</code>.)
    </p>
  `,
};

const panel = (theme: 'light' | 'dark') => html`
  <div
    data-theme=${theme}
    style="padding:1rem; background:var(--foundry-color-surface); color:var(--foundry-color-text-body); border-radius:var(--foundry-radius-md); font-family:sans-serif; max-width:40ch;"
  >
    <p style="margin:0 0 0.5rem;">${theme}</p>
    <p style="margin:0;">
      An <foundry-link href="/inline">inline link</foundry-link> sits in prose.
    </p>
    <div style="margin-block-start:0.75rem; display:flex; flex-direction:column; gap:0.25rem;">
      <foundry-link variant="standalone" href="/one">Standalone one</foundry-link>
      <foundry-link variant="standalone" href="/two">Standalone two</foundry-link>
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
