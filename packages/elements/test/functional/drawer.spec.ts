import { expect } from '@open-wc/testing';
import { FoundryDrawer } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryDrawer.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerDialog(host: HTMLElement): HTMLDialogElement {
  const d = host.shadowRoot?.querySelector('dialog[part="dialog"]');
  if (!(d instanceof HTMLDialogElement)) throw new Error('inner dialog missing');
  return d;
}

describe('<foundry-drawer> functional', () => {
  afterEach(() => cleanup());

  it('passes axe when closed', async () => {
    const el = mount<FoundryDrawer>(`
      <foundry-drawer>
        <span slot="title">Hello</span>
        <p>Body.</p>
      </foundry-drawer>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when open with title + description + footer', async () => {
    const el = mount<FoundryDrawer>(`
      <foundry-drawer>
        <span slot="title">Filters</span>
        <span slot="description">Narrow the list below.</span>
        <p>Main body.</p>
        <form slot="footer" method="dialog">
          <button type="submit" value="cancel" style="padding:0.5rem 0.75rem;">Cancel</button>
          <button type="submit" value="apply" style="padding:0.5rem 0.75rem;">Apply</button>
        </form>
      </foundry-drawer>
    `);
    await raf();
    el.show();
    await raf();
    await expectA11y(el, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
  });

  it('show() opens the native dialog and flips host[open]', async () => {
    const el = mount<FoundryDrawer>(`
      <foundry-drawer><span slot="title">t</span><p>b</p></foundry-drawer>
    `);
    await raf();
    el.show();
    await raf();
    expect(innerDialog(el).open).to.equal(true);
    expect(el.hasAttribute('open')).to.equal(true);
  });

  it('close() closes the dialog and fires close event with returnValue', async () => {
    const el = mount<FoundryDrawer>(`
      <foundry-drawer><span slot="title">t</span><p>b</p></foundry-drawer>
    `);
    await raf();
    el.show();
    await raf();
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    el.close('applied');
    await raf();
    expect(detail?.returnValue).to.equal('applied');
    expect(el.hasAttribute('open')).to.equal(false);
  });

  it('submitting a slotted form method="dialog" closes with the submitter value', async () => {
    const el = mount<FoundryDrawer>(`
      <foundry-drawer>
        <span slot="title">t</span>
        <p>b</p>
        <form slot="footer" method="dialog">
          <button type="submit" value="ok" data-testid="submit-ok">OK</button>
        </form>
      </foundry-drawer>
    `);
    await raf();
    el.show();
    await raf();
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    const btn = el.querySelector<HTMLButtonElement>('[data-testid="submit-ok"]');
    btn?.click();
    await raf();
    expect(detail?.returnValue).to.equal('ok');
  });

  it('placement="start" reflects onto the host', async () => {
    const el = mount<FoundryDrawer>(`
      <foundry-drawer placement="start"><span slot="title">t</span><p>b</p></foundry-drawer>
    `);
    await raf();
    expect(el.getAttribute('placement')).to.equal('start');
  });

  it('clicking the built-in close button closes the drawer', async () => {
    const el = mount<FoundryDrawer>(`
      <foundry-drawer><span slot="title">t</span><p>b</p></foundry-drawer>
    `);
    await raf();
    el.show();
    await raf();
    const closeBtn = el.shadowRoot?.querySelector<HTMLButtonElement>('button[part="close-button"]');
    closeBtn?.click();
    await raf();
    expect(el.hasAttribute('open')).to.equal(false);
  });
});
