import { expect } from '@open-wc/testing';
import { FoundryBreadcrumbs, FoundryBreadcrumb, FoundryLink } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryBreadcrumbs.define();
FoundryBreadcrumb.define();
FoundryLink.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-breadcrumbs> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a three-item trail (last is current)', async () => {
    const el = mount<FoundryBreadcrumbs>(`
      <foundry-breadcrumbs>
        <foundry-breadcrumb>
          <foundry-link href="/">Home</foundry-link>
        </foundry-breadcrumb>
        <foundry-breadcrumb>
          <foundry-link href="/docs">Docs</foundry-link>
        </foundry-breadcrumb>
        <foundry-breadcrumb current>Breadcrumbs</foundry-breadcrumb>
      </foundry-breadcrumbs>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with a custom separator glyph', async () => {
    const el = mount<FoundryBreadcrumbs>(`
      <foundry-breadcrumbs>
        <foundry-breadcrumb>
          <foundry-link href="/">Home</foundry-link>
          <span slot="separator" aria-hidden="true">›</span>
        </foundry-breadcrumb>
        <foundry-breadcrumb current>Here</foundry-breadcrumb>
      </foundry-breadcrumbs>
    `);
    await raf();
    await expectA11y(el);
  });

  it('wrapper <nav> has aria-label="Breadcrumb"', async () => {
    const el = mount<FoundryBreadcrumbs>(`
      <foundry-breadcrumbs>
        <foundry-breadcrumb current>Here</foundry-breadcrumb>
      </foundry-breadcrumbs>
    `);
    await raf();
    const nav = el.shadowRoot?.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).to.equal('Breadcrumb');
  });

  it('current item reflects aria-current="page" on its host', async () => {
    const el = mount<FoundryBreadcrumbs>(`
      <foundry-breadcrumbs>
        <foundry-breadcrumb>
          <foundry-link href="/">Home</foundry-link>
        </foundry-breadcrumb>
        <foundry-breadcrumb current data-testid="bc-current">Current</foundry-breadcrumb>
      </foundry-breadcrumbs>
    `);
    await raf();
    const current = el.querySelector('[data-testid="bc-current"]') as FoundryBreadcrumb;
    expect(current.getAttribute('aria-current')).to.equal('page');
  });

  it('last item hides its separator visually', async () => {
    const el = mount<FoundryBreadcrumbs>(`
      <foundry-breadcrumbs>
        <foundry-breadcrumb>
          <foundry-link href="/">Home</foundry-link>
        </foundry-breadcrumb>
        <foundry-breadcrumb current data-testid="bc-current">Current</foundry-breadcrumb>
      </foundry-breadcrumbs>
    `);
    await raf();
    const current = el.querySelector('[data-testid="bc-current"]') as FoundryBreadcrumb;
    const separator = current.shadowRoot?.querySelector('[part="separator"]') as HTMLElement;
    expect(getComputedStyle(separator).display).to.equal('none');
  });

  it('nested <foundry-link> is focusable', async () => {
    const el = mount<FoundryBreadcrumbs>(`
      <foundry-breadcrumbs>
        <foundry-breadcrumb data-testid="bc-first">
          <foundry-link href="/">Home</foundry-link>
        </foundry-breadcrumb>
        <foundry-breadcrumb current>Here</foundry-breadcrumb>
      </foundry-breadcrumbs>
    `);
    await raf();
    const link = el.querySelector('foundry-link') as FoundryLink;
    link.focus();
    // Focus should land on the inner anchor inside the link.
    const active = link.shadowRoot?.activeElement;
    expect(active?.tagName).to.equal('A');
  });
});
