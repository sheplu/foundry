import { expect } from '@open-wc/testing';
import { FoundryNavbar } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryNavbar.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-navbar> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with brand + content + actions populated', async () => {
    const el = mount<FoundryNavbar>(`
      <foundry-navbar label="Main navigation">
        <strong slot="brand">Acme</strong>
        <a href="#home" style="padding:0.5rem 0.75rem;">Home</a>
        <a href="#docs" style="padding:0.5rem 0.75rem;">Docs</a>
        <button slot="actions" type="button" style="padding:0.5rem 0.75rem;">Sign in</button>
      </foundry-navbar>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with only brand populated', async () => {
    const el = mount<FoundryNavbar>(`
      <foundry-navbar>
        <strong slot="brand">Acme</strong>
      </foundry-navbar>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when elevated variant is used', async () => {
    const el = mount<FoundryNavbar>(`
      <foundry-navbar variant="elevated">
        <strong slot="brand">Acme</strong>
        <a href="#home" style="padding:0.5rem 0.75rem;">Home</a>
      </foundry-navbar>
    `);
    await raf();
    await expectA11y(el);
  });

  it('inner nav carries aria-label forwarded from the label attr', async () => {
    const el = mount<FoundryNavbar>(`
      <foundry-navbar label="Site chrome">
        <a href="#">Home</a>
      </foundry-navbar>
    `);
    await raf();
    const nav = el.shadowRoot?.querySelector('nav');
    expect(nav?.getAttribute('aria-label')).to.equal('Site chrome');
  });

  it('reflects has-brand / has-actions based on slotted content', async () => {
    const el = mount<FoundryNavbar>(`
      <foundry-navbar>
        <strong slot="brand">Acme</strong>
        <a href="#">Home</a>
      </foundry-navbar>
    `);
    await raf();
    expect(el.hasAttribute('has-brand')).to.equal(true);
    expect(el.hasAttribute('has-actions')).to.equal(false);
  });

  it('renders default slot content inline with the links', async () => {
    const el = mount<FoundryNavbar>(`
      <foundry-navbar>
        <a href="#home" data-testid="link-home" style="padding:0.5rem 0.75rem;">Home</a>
        <a href="#about" data-testid="link-about" style="padding:0.5rem 0.75rem;">About</a>
      </foundry-navbar>
    `);
    await raf();
    const home = el.querySelector('[data-testid="link-home"]');
    const about = el.querySelector('[data-testid="link-about"]');
    expect(home).to.not.equal(null);
    expect(about).to.not.equal(null);
  });
});
