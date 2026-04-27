import { expect } from '@open-wc/testing';
import { FoundryCluster } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryCluster.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-cluster> functional', () => {
  afterEach(() => cleanup());

  it('defaults to space="md" when none is set', async () => {
    const el = mount<FoundryCluster>(
      '<foundry-cluster><span>a</span><span>b</span></foundry-cluster>',
    );
    await raf();

    expect(el.getAttribute('space')).to.equal('md');
  });

  it('reflects an explicit space', async () => {
    const el = mount<FoundryCluster>(
      '<foundry-cluster space="lg"><span>a</span><span>b</span></foundry-cluster>',
    );
    await raf();

    expect(el.getAttribute('space')).to.equal('lg');
  });

  it('passes axe-core WCAG 2.2 AA for each space', async () => {
    for (const space of ['xs', 'sm', 'md', 'lg'] as const) {
      const el = mount<FoundryCluster>(
        `<foundry-cluster space="${space}"><span>first</span><span>second</span></foundry-cluster>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('renders slotted children in order', async () => {
    const el = mount<FoundryCluster>(
      '<foundry-cluster><span>one</span><span>two</span><span>three</span></foundry-cluster>',
    );
    await raf();

    const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const assigned = slot?.assignedElements() as HTMLElement[];
    expect(assigned?.map((n) => n.textContent)).to.deep.equal(['one', 'two', 'three']);
  });
});
