import { expect } from '@open-wc/testing';
import { FoundryTooltip } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryTooltip.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('<foundry-tooltip> functional', () => {
  afterEach(() => cleanup());

  it('passes axe when closed', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip>
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when open (focus trigger)', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip>
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;
    trigger.dispatchEvent(new Event('focusin', { bubbles: true }));
    await raf();
    // axe's `color-contrast` rule walks the *light* DOM to find the
    // background behind slotted text and doesn't follow the slotted
    // content into the shadow root's `[part="surface"]` where the
    // real background lives. That's a known limitation, not a real
    // contrast bug — the rendered tooltip has dark-surface + light-text.
    // We exclude just that one rule; the rest of wcag22aa still runs.
    await expectA11y(el, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
  });

  it('surface has role="tooltip" and popover="manual"', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip>
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
    `);
    await raf();
    const surface = el.shadowRoot?.querySelector('[part="surface"]');
    expect(surface?.getAttribute('role')).to.equal('tooltip');
    expect(surface?.getAttribute('popover')).to.equal('manual');
  });

  it('focusin shows immediately + wires aria-describedby; focusout clears it', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip>
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;
    const surface = el.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;

    trigger.dispatchEvent(new Event('focusin', { bubbles: true }));
    await raf();
    expect(el.hasAttribute('open')).to.equal(true);
    expect(trigger.getAttribute('aria-describedby')).to.equal(surface.id);

    trigger.dispatchEvent(new Event('focusout', { bubbles: true }));
    expect(el.hasAttribute('open')).to.equal(false);
    expect(trigger.hasAttribute('aria-describedby')).to.equal(false);
  });

  it('pointerenter shows after delay-show; pointerleave cancels pending show', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip delay-show="50">
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;

    trigger.dispatchEvent(new Event('pointerenter'));
    await wait(20);
    // Not yet visible.
    expect(el.hasAttribute('open')).to.equal(false);

    trigger.dispatchEvent(new Event('pointerleave'));
    await wait(80);
    // Never became visible because leave cancelled the pending show.
    expect(el.hasAttribute('open')).to.equal(false);
  });

  it('pointerenter waits delay-show then shows', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip delay-show="30">
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;

    trigger.dispatchEvent(new Event('pointerenter'));
    await wait(60);
    expect(el.hasAttribute('open')).to.equal(true);
  });

  it('placement="bottom" positions the tooltip below the anchor', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip placement="bottom">
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;
    trigger.dispatchEvent(new Event('focusin', { bubbles: true }));
    await raf();

    const anchor = trigger.getBoundingClientRect();
    const surface = el.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    const popover = surface.getBoundingClientRect();
    expect(popover.top).to.be.greaterThan(anchor.bottom);
  });

  it('CSS includes the prefers-reduced-motion transition halt', async () => {
    const el = mount<FoundryTooltip>(`
      <foundry-tooltip>
        <button>trigger</button>
        <span slot="content">tip</span>
      </foundry-tooltip>
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
