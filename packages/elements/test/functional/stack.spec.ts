import { expect } from '@open-wc/testing';
import { FoundryStack } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryStack.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-stack> functional', () => {
  afterEach(() => cleanup());

  it('defaults to space="md" when none is set', async () => {
    const el = mount<FoundryStack>('<foundry-stack><div>a</div><div>b</div></foundry-stack>');
    await raf();

    expect(el.getAttribute('space')).to.equal('md');
  });

  it('reflects an explicit space', async () => {
    const el = mount<FoundryStack>(
      '<foundry-stack space="lg"><div>a</div><div>b</div></foundry-stack>',
    );
    await raf();

    expect(el.getAttribute('space')).to.equal('lg');
  });

  it('passes axe-core WCAG 2.2 AA for each space', async () => {
    for (const space of ['xs', 'sm', 'md', 'lg'] as const) {
      const el = mount<FoundryStack>(
        `<foundry-stack space="${space}"><p>first</p><p>second</p></foundry-stack>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('renders slotted children in order', async () => {
    const el = mount<FoundryStack>(
      '<foundry-stack><p>one</p><p>two</p><p>three</p></foundry-stack>',
    );
    await raf();

    const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    const assigned = slot?.assignedElements() as HTMLElement[];
    expect(assigned?.map((n) => n.textContent)).to.deep.equal(['one', 'two', 'three']);
  });
});
