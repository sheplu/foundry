import { expect } from '@open-wc/testing';
import { FoundryCard } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryCard.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-card> functional', () => {
  afterEach(() => cleanup());

  it('passes axe for an outlined card with header / body / footer', async () => {
    const el = mount<FoundryCard>(`
      <foundry-card>
        <span slot="header">Header text</span>
        <p>Body content</p>
        <div slot="footer">Footer actions</div>
      </foundry-card>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe for an elevated card', async () => {
    const el = mount<FoundryCard>(`
      <foundry-card variant="elevated">
        <p>Body content</p>
      </foundry-card>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe for a card with media', async () => {
    const el = mount<FoundryCard>(`
      <foundry-card>
        <div slot="media" aria-hidden="true" style="block-size:4rem; background:#ccc;"></div>
        <span slot="header">Header</span>
        <p>Body</p>
      </foundry-card>
    `);
    await raf();
    await expectA11y(el);
  });

  it('header / body / footer regions render in DOM order', async () => {
    const el = mount<FoundryCard>(`
      <foundry-card>
        <span slot="header">H</span>
        <p>Body</p>
        <div slot="footer">F</div>
      </foundry-card>
    `);
    await raf();
    const root = el.shadowRoot;
    const parts = Array.from(root?.querySelectorAll('[part]') ?? [])
      .map((node) => node.getAttribute('part'))
      .filter((part): part is string => part !== null);
    // Expected order: card, media, header, body, footer.
    expect(parts.indexOf('media')).to.be.lessThan(parts.indexOf('header'));
    expect(parts.indexOf('header')).to.be.lessThan(parts.indexOf('body'));
    expect(parts.indexOf('body')).to.be.lessThan(parts.indexOf('footer'));
  });

  it('variant="outlined" card has a visible border; no shadow', async () => {
    const el = mount<FoundryCard>(`
      <foundry-card><p>Body</p></foundry-card>
    `);
    await raf();
    const card = el.shadowRoot?.querySelector('[part="card"]') as HTMLElement;
    const style = getComputedStyle(card);
    // Border should be visible (> 0px); box-shadow should be 'none'.
    expect(parseFloat(style.borderTopWidth)).to.be.greaterThan(0);
    expect(style.boxShadow).to.equal('none');
  });

  it('variant="elevated" card has a drop shadow; no border', async () => {
    const el = mount<FoundryCard>(`
      <foundry-card variant="elevated"><p>Body</p></foundry-card>
    `);
    await raf();
    const card = el.shadowRoot?.querySelector('[part="card"]') as HTMLElement;
    const style = getComputedStyle(card);
    expect(style.boxShadow).to.not.equal('none');
    expect(parseFloat(style.borderTopWidth)).to.equal(0);
  });

  it('hides regions when their slots are empty', async () => {
    const el = mount<FoundryCard>(`
      <foundry-card><p>Body only</p></foundry-card>
    `);
    await raf();
    const root = el.shadowRoot;
    const header = root?.querySelector('[part="header"]') as HTMLElement;
    const media = root?.querySelector('[part="media"]') as HTMLElement;
    const footer = root?.querySelector('[part="footer"]') as HTMLElement;
    expect(getComputedStyle(header).display).to.equal('none');
    expect(getComputedStyle(media).display).to.equal('none');
    expect(getComputedStyle(footer).display).to.equal('none');
  });
});
