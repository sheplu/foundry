import { expect } from '@open-wc/testing';
import { FoundryPopover } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryPopover.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-popover> functional', () => {
  afterEach(() => cleanup());

  it('passes axe when closed', async () => {
    const el = mount<FoundryPopover>(`
      <foundry-popover>
        <button>Open</button>
        <div slot="content">Content</div>
      </foundry-popover>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when open', async () => {
    const el = mount<FoundryPopover>(`
      <foundry-popover>
        <button>Open</button>
        <div slot="content">Content</div>
      </foundry-popover>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;
    trigger.click();
    await raf();
    // axe's color-contrast rule can't follow slotted text through the
    // shadow root into the top-layer surface (same limitation as tooltip).
    await expectA11y(el, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
  });

  it('surface has role="dialog" and popover="auto"', async () => {
    const el = mount<FoundryPopover>(`
      <foundry-popover>
        <button>Open</button>
        <div slot="content">Content</div>
      </foundry-popover>
    `);
    await raf();
    const surface = el.shadowRoot?.querySelector('[part="surface"]');
    expect(surface?.getAttribute('role')).to.equal('dialog');
    expect(surface?.getAttribute('popover')).to.equal('auto');
  });

  it('trigger has full ARIA wiring', async () => {
    const el = mount<FoundryPopover>(`
      <foundry-popover>
        <button>Open</button>
        <div slot="content">Content</div>
      </foundry-popover>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;
    const surfaceId = el.shadowRoot?.querySelector('[part="surface"]')?.id;
    expect(trigger.getAttribute('aria-haspopup')).to.equal('dialog');
    expect(trigger.getAttribute('aria-controls')).to.equal(surfaceId);
    expect(trigger.getAttribute('aria-expanded')).to.equal('false');
  });

  it('clicking the trigger opens the popover + flips aria-expanded', async () => {
    const el = mount<FoundryPopover>(`
      <foundry-popover>
        <button>Open</button>
        <div slot="content">Content</div>
      </foundry-popover>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;

    trigger.click();
    await raf();
    expect(el.hasAttribute('open')).to.equal(true);
    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
  });

  // NOTE: Escape-to-dismiss + click-while-open-closes are exercised in
  // the real-browser E2E suite (three canaries). Light-dismiss requires
  // trusted pointer/keyboard events that synthetic DOM dispatches can't
  // produce reliably in web-test-runner.

  it('CSS includes the prefers-reduced-motion transition halt', async () => {
    const el = mount<FoundryPopover>(`
      <foundry-popover>
        <button>Open</button>
        <div slot="content">Content</div>
      </foundry-popover>
    `);
    await raf();
    const sheets = el.shadowRoot?.adoptedStyleSheets ?? [];
    const hasRule = sheets.some((sheet) => {
      for (const rule of Array.from(sheet.cssRules)) {
        if (
          rule instanceof CSSMediaRule
          && rule.conditionText.includes('prefers-reduced-motion')
        ) return true;
      }
      return false;
    });
    expect(hasRule).to.equal(true);
  });
});
