import { expect } from '@open-wc/testing';
import { FoundryAlert } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryAlert.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-alert> functional', () => {
  afterEach(() => cleanup());

  it('defaults to role="status" when no variant is set (info → polite)', async () => {
    const el = mount<FoundryAlert>('<foundry-alert>body</foundry-alert>');
    await raf();

    expect(el.getAttribute('variant')).to.equal('info');
    expect(el.getAttribute('role')).to.equal('status');
  });

  it('sets role="alert" for assertive intents', async () => {
    for (const variant of ['warning', 'danger'] as const) {
      const el = mount<FoundryAlert>(
        `<foundry-alert variant="${variant}">body</foundry-alert>`,
      );
      await raf();
      expect(el.getAttribute('role')).to.equal('alert');
      cleanup();
    }
  });

  it('sets role="status" for polite intents', async () => {
    for (const variant of ['neutral', 'info', 'success'] as const) {
      const el = mount<FoundryAlert>(
        `<foundry-alert variant="${variant}">body</foundry-alert>`,
      );
      await raf();
      expect(el.getAttribute('role')).to.equal('status');
      cleanup();
    }
  });

  it('passes axe-core WCAG 2.2 AA for each intent variant', async () => {
    for (const variant of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
      const el = mount<FoundryAlert>(
        `<foundry-alert variant="${variant}">
          <span slot="title">${variant} title</span>
          Body sentence for the ${variant} alert.
        </foundry-alert>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('reflects has-title based on the title slot content', async () => {
    const withTitle = mount<FoundryAlert>(
      '<foundry-alert><span slot="title">Heads up</span>body</foundry-alert>',
    );
    await raf();
    expect(withTitle.hasAttribute('has-title')).to.equal(true);
    cleanup();

    const bodyOnly = mount<FoundryAlert>('<foundry-alert>body only</foundry-alert>');
    await raf();
    expect(bodyOnly.hasAttribute('has-title')).to.equal(false);
  });

  it('renders both title and body slot content', async () => {
    const el = mount<FoundryAlert>(
      '<foundry-alert><span slot="title">Title</span>Body text</foundry-alert>',
    );
    await raf();

    const titleSlot = el.shadowRoot?.querySelector('slot[name="title"]') as HTMLSlotElement | null;
    const bodySlot = el.shadowRoot?.querySelector('slot:not([name])') as HTMLSlotElement | null;
    expect(titleSlot?.assignedElements()[0]?.textContent).to.equal('Title');
    expect(bodySlot?.assignedNodes()[0]?.textContent).to.equal('Body text');
  });
});
