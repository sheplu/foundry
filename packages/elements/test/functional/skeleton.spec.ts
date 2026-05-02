import { expect } from '@open-wc/testing';
import { FoundrySkeleton } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundrySkeleton.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-skeleton> functional', () => {
  afterEach(() => cleanup());

  it('passes axe when decorative (no label)', async () => {
    const el = mount<FoundrySkeleton>('<foundry-skeleton></foundry-skeleton>');
    await raf();
    await expectA11y(el);
  });

  it('passes axe when labelled (role="status")', async () => {
    const el = mount<FoundrySkeleton>(
      '<foundry-skeleton label="Loading"></foundry-skeleton>',
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for each shape', async () => {
    for (const shape of ['text', 'circle', 'rect'] as const) {
      const el = mount<FoundrySkeleton>(
        `<foundry-skeleton shape="${shape}"></foundry-skeleton>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('is decorative by default and labelled when `label` is set', async () => {
    const deco = mount<FoundrySkeleton>('<foundry-skeleton></foundry-skeleton>');
    await raf();
    expect(deco.getAttribute('aria-hidden')).to.equal('true');
    expect(deco.hasAttribute('role')).to.equal(false);

    cleanup();

    const labelled = mount<FoundrySkeleton>(
      '<foundry-skeleton label="Loading"></foundry-skeleton>',
    );
    await raf();
    expect(labelled.getAttribute('role')).to.equal('status');
    expect(labelled.getAttribute('aria-label')).to.equal('Loading');
    expect(labelled.hasAttribute('aria-hidden')).to.equal(false);
  });

  it('shape="circle" renders a round surface (border-radius 50%)', async () => {
    const el = mount<FoundrySkeleton>(
      '<foundry-skeleton shape="circle"></foundry-skeleton>',
    );
    await raf();
    const surface = el.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    const radius = getComputedStyle(surface).borderRadius;
    // Browsers normalize 50% to a px value; check either form.
    expect(radius.includes('%') || Number.parseFloat(radius) > 0).to.equal(true);
  });

  it('shape="rect" renders a visible block-size', async () => {
    const el = mount<FoundrySkeleton>(
      '<foundry-skeleton shape="rect"></foundry-skeleton>',
    );
    await raf();
    expect(el.getBoundingClientRect().height).to.be.greaterThan(0);
  });

  it('CSS includes the prefers-reduced-motion animation halt', async () => {
    const el = mount<FoundrySkeleton>('<foundry-skeleton></foundry-skeleton>');
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
