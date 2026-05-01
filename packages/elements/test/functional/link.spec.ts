import { expect } from '@open-wc/testing';
import { FoundryLink } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryLink.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerAnchor(host: HTMLElement): HTMLAnchorElement {
  const a = host.shadowRoot?.querySelector('a');
  if (!(a instanceof HTMLAnchorElement)) throw new Error('inner anchor missing');
  return a;
}

describe('<foundry-link> functional', () => {
  afterEach(() => cleanup());

  it('passes axe as an inline link', async () => {
    const el = mount<FoundryLink>(
      `<foundry-link href="/docs">Read the docs</foundry-link>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe as a standalone link', async () => {
    const el = mount<FoundryLink>(
      `<foundry-link variant="standalone" href="/docs">Docs</foundry-link>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for an external link with target=_blank', async () => {
    const el = mount<FoundryLink>(
      `<foundry-link href="https://example.com" target="_blank">Example</foundry-link>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('auto-adds rel="noopener" when target="_blank" and no explicit rel', async () => {
    const el = mount<FoundryLink>(
      `<foundry-link href="https://example.com" target="_blank">Example</foundry-link>`,
    );
    await raf();
    expect(innerAnchor(el).getAttribute('rel')).to.equal('noopener');
  });

  it('honors an explicit rel (no auto-noopener injection)', async () => {
    const el = mount<FoundryLink>(
      `<foundry-link href="https://example.com" target="_blank" rel="external">E</foundry-link>`,
    );
    await raf();
    expect(innerAnchor(el).getAttribute('rel')).to.equal('external');
  });

  it('focusing the host delegates to the inner anchor', async () => {
    const el = mount<FoundryLink>(
      `<foundry-link href="/x">F</foundry-link>`,
    );
    await raf();
    el.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('A');
  });

  it('slotted content is the only visible text content', async () => {
    const el = mount<FoundryLink>(
      `<foundry-link href="/x">click me</foundry-link>`,
    );
    await raf();
    // Accessible name comes from slotted text via the native <a>.
    expect(el.textContent?.trim()).to.equal('click me');
  });
});
