import { expect } from '@open-wc/testing';
import { FoundrySpinner } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundrySpinner.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-spinner> functional', () => {
  afterEach(() => cleanup());

  it('passes axe when decorative (no label)', async () => {
    const el = mount<FoundrySpinner>('<foundry-spinner></foundry-spinner>');
    await raf();
    await expectA11y(el);
  });

  it('passes axe when labelled (role="status")', async () => {
    const el = mount<FoundrySpinner>('<foundry-spinner label="Loading"></foundry-spinner>');
    await raf();
    await expectA11y(el);
  });

  it('is decorative by default (aria-hidden, no role)', async () => {
    const el = mount<FoundrySpinner>('<foundry-spinner></foundry-spinner>');
    await raf();
    expect(el.getAttribute('aria-hidden')).to.equal('true');
    expect(el.hasAttribute('role')).to.equal(false);
  });

  it('exposes role="status" + aria-label when label is set', async () => {
    const el = mount<FoundrySpinner>('<foundry-spinner label="Loading"></foundry-spinner>');
    await raf();
    expect(el.getAttribute('role')).to.equal('status');
    expect(el.getAttribute('aria-label')).to.equal('Loading');
    expect(el.hasAttribute('aria-hidden')).to.equal(false);
  });

  it('size=sm renders smaller than size=lg (computed layout)', async () => {
    const sm = mount<FoundrySpinner>('<foundry-spinner size="sm"></foundry-spinner>');
    await raf();
    const smWidth = sm.getBoundingClientRect().width;
    cleanup();

    const lg = mount<FoundrySpinner>('<foundry-spinner size="lg"></foundry-spinner>');
    await raf();
    const lgWidth = lg.getBoundingClientRect().width;

    expect(lgWidth).to.be.greaterThan(smWidth);
  });

  it('CSS includes the prefers-reduced-motion animation halt', async () => {
    // Verify the stylesheet source contains the reduced-motion rule. We can't
    // easily emulate `prefers-reduced-motion: reduce` from within the test
    // runner, so this is a belt-and-suspenders check that the rule exists.
    const el = mount<FoundrySpinner>('<foundry-spinner></foundry-spinner>');
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
