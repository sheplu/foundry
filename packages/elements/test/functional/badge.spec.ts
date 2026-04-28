import { expect } from '@open-wc/testing';
import { FoundryBadge } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryBadge.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-badge> functional', () => {
  afterEach(() => cleanup());

  it('defaults to variant="neutral" when none is set', async () => {
    const el = mount<FoundryBadge>('<foundry-badge>new</foundry-badge>');
    await raf();

    expect(el.getAttribute('variant')).to.equal('neutral');
  });

  it('reflects an explicit variant', async () => {
    const el = mount<FoundryBadge>(
      '<foundry-badge variant="success">done</foundry-badge>',
    );
    await raf();

    expect(el.getAttribute('variant')).to.equal('success');
  });

  it('passes axe-core WCAG 2.2 AA for each intent variant', async () => {
    for (const variant of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
      const el = mount<FoundryBadge>(
        `<foundry-badge variant="${variant}">status text</foundry-badge>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('renders slotted text content', async () => {
    const el = mount<FoundryBadge>('<foundry-badge>count: 3</foundry-badge>');
    await raf();
    expect(el.textContent?.trim()).to.equal('count: 3');
  });
});
