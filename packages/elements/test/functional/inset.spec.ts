import { expect } from '@open-wc/testing';
import { FoundryInset } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryInset.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-inset> functional', () => {
  afterEach(() => cleanup());

  it('defaults to space="md" when none is set', async () => {
    const el = mount<FoundryInset>('<foundry-inset><span>content</span></foundry-inset>');
    await raf();

    expect(el.getAttribute('space')).to.equal('md');
  });

  it('reflects an explicit space', async () => {
    const el = mount<FoundryInset>(
      '<foundry-inset space="lg"><span>content</span></foundry-inset>',
    );
    await raf();

    expect(el.getAttribute('space')).to.equal('lg');
  });

  it('passes axe-core WCAG 2.2 AA for each space', async () => {
    for (const space of ['sm', 'md', 'lg'] as const) {
      const el = mount<FoundryInset>(
        `<foundry-inset space="${space}"><p>padded text</p></foundry-inset>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('renders slotted children', async () => {
    const el = mount<FoundryInset>(
      '<foundry-inset><p>inside</p></foundry-inset>',
    );
    await raf();

    const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const assigned = slot?.assignedElements() as HTMLElement[];
    expect(assigned?.[0]?.textContent).to.equal('inside');
  });
});
