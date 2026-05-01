import { expect } from '@open-wc/testing';
import { FoundryAvatar } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryAvatar.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerImg(host: HTMLElement): HTMLImageElement {
  const img = host.shadowRoot?.querySelector('img');
  if (!(img instanceof HTMLImageElement)) throw new Error('inner img missing');
  return img;
}

// A 1×1 transparent PNG — loads reliably in any browser.
const TINY_PNG
  = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('<foundry-avatar> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a name fallback (initials)', async () => {
    const el = mount<FoundryAvatar>(`<foundry-avatar name="Ada Lovelace"></foundry-avatar>`);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when decorative (no name / label)', async () => {
    const el = mount<FoundryAvatar>(`<foundry-avatar></foundry-avatar>`);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with an explicit label override', async () => {
    const el = mount<FoundryAvatar>(
      `<foundry-avatar name="Ada Lovelace" label="Profile photo"></foundry-avatar>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe with a status dot + name', async () => {
    const el = mount<FoundryAvatar>(
      `<foundry-avatar name="Ada Lovelace" status="online"></foundry-avatar>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('derives initials from name when no slot is provided', async () => {
    const el = mount<FoundryAvatar>(`<foundry-avatar name="Ada Lovelace"></foundry-avatar>`);
    await raf();
    const initials = el.shadowRoot?.querySelector('[part="initials"]') as HTMLElement;
    expect(initials.textContent?.trim()).to.equal('AL');
  });

  it('sets has-image once the inner <img> loads the provided src', async () => {
    const el = mount<FoundryAvatar>(
      `<foundry-avatar name="T" src="${TINY_PNG}"></foundry-avatar>`,
    );
    // Wait for image load (real browser, so native load event fires).
    await new Promise<void>((resolve) => {
      const img = innerImg(el);
      if (img.complete && img.naturalWidth > 0) resolve();
      else img.addEventListener('load', () => resolve(), { once: true });
    });
    expect(el.hasAttribute('has-image')).to.equal(true);
  });

  it('keeps has-image=false when the inner <img> fires error', async () => {
    const el = mount<FoundryAvatar>(
      `<foundry-avatar name="T" src="data:image/png;base64,NOT_VALID"></foundry-avatar>`,
    );
    // Wait for error event.
    await new Promise<void>((resolve) => {
      const img = innerImg(el);
      if (img.complete && img.naturalWidth === 0) resolve();
      else img.addEventListener('error', () => resolve(), { once: true });
    });
    expect(el.hasAttribute('has-image')).to.equal(false);
  });

  it('renders the status dot only when status is set', async () => {
    const el = mount<FoundryAvatar>(`<foundry-avatar name="T"></foundry-avatar>`);
    await raf();
    const dot = el.shadowRoot?.querySelector('[part="status"]') as HTMLElement;
    expect(getComputedStyle(dot).display).to.equal('none');

    el.setAttribute('status', 'online');
    await raf();
    expect(getComputedStyle(dot).display).to.not.equal('none');
  });
});
