import { expect } from '@open-wc/testing';
import { FoundryProgress } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryProgress.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getBar(host: HTMLElement): HTMLElement {
  const bar = host.shadowRoot?.querySelector('[part="bar"]');
  if (!(bar instanceof HTMLElement)) throw new Error('inner bar missing');
  return bar;
}

describe('<foundry-progress> functional', () => {
  afterEach(() => cleanup());

  it('passes axe at 0%, mid, and 100%', async () => {
    for (const value of [0, 40, 100]) {
      const el = mount<FoundryProgress>(
        `<foundry-progress value="${value}"></foundry-progress>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('passes axe for each intent variant', async () => {
    for (const variant of ['neutral', 'success', 'warning', 'danger'] as const) {
      const el = mount<FoundryProgress>(
        `<foundry-progress variant="${variant}" value="50"></foundry-progress>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('exposes role="progressbar" + aria values on the host', async () => {
    const el = mount<FoundryProgress>(
      '<foundry-progress value="40"></foundry-progress>',
    );
    await raf();
    expect(el.getAttribute('role')).to.equal('progressbar');
    expect(el.getAttribute('aria-valuemin')).to.equal('0');
    expect(el.getAttribute('aria-valuemax')).to.equal('100');
    expect(el.getAttribute('aria-valuenow')).to.equal('40');
  });

  it('uses the default "Progress" aria-label when none is provided', async () => {
    const el = mount<FoundryProgress>('<foundry-progress></foundry-progress>');
    await raf();
    expect(el.getAttribute('aria-label')).to.equal('Progress');
  });

  it('honors a custom label as aria-label', async () => {
    const el = mount<FoundryProgress>(
      '<foundry-progress label="Uploading photo"></foundry-progress>',
    );
    await raf();
    expect(el.getAttribute('aria-label')).to.equal('Uploading photo');
  });

  it('bar fills proportionally to value / max', async () => {
    const el = mount<FoundryProgress>(
      '<foundry-progress value="30"></foundry-progress>',
    );
    await raf();
    const bar = getBar(el);
    // Track width is 100% of the host; bar inline-size comes from --_bar-size.
    const ratio = bar.getBoundingClientRect().width / el.getBoundingClientRect().width;
    expect(ratio).to.be.closeTo(0.3, 0.02);
  });

  it('halts the bar transition under prefers-reduced-motion (CSS rule present)', async () => {
    const el = mount<FoundryProgress>('<foundry-progress></foundry-progress>');
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
