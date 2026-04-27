import { expect } from '@open-wc/testing';
import { FoundryDivider } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryDivider.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-divider> functional', () => {
  afterEach(() => cleanup());

  it('exposes role="separator" without aria-orientation when horizontal', async () => {
    const el = mount<FoundryDivider>('<foundry-divider></foundry-divider>');
    await raf();

    expect(el.getAttribute('role')).to.equal('separator');
    expect(el.hasAttribute('aria-orientation')).to.equal(false);
  });

  it('sets aria-orientation="vertical" when orientation is vertical', async () => {
    const el = mount<FoundryDivider>(
      '<foundry-divider orientation="vertical"></foundry-divider>',
    );
    await raf();

    expect(el.getAttribute('role')).to.equal('separator');
    expect(el.getAttribute('aria-orientation')).to.equal('vertical');
  });

  it('passes axe-core WCAG 2.2 AA for each orientation', async () => {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      const el = mount<FoundryDivider>(
        `<foundry-divider orientation="${orientation}"></foundry-divider>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });
});
