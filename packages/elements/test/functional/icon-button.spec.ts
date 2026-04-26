import { expect } from '@open-wc/testing';
import { FoundryIconButton, FoundryIcon, check, close } from '@foundry/icons';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryIcon.register({ check, close });
FoundryIconButton.define();
FoundryIcon.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-icon-button> functional', () => {
  afterEach(() => cleanup());

  it('renders a native <button> with a <foundry-icon> inside its shadow root', async () => {
    const el = mount<FoundryIconButton>(
      '<foundry-icon-button name="check" label="Confirm"></foundry-icon-button>',
    );
    await raf();
    const btn = el.shadowRoot?.querySelector('button');
    const icon = el.shadowRoot?.querySelector('foundry-icon');
    expect(btn).to.be.instanceOf(HTMLButtonElement);
    expect(icon).to.not.equal(null);
  });

  it('passes axe-core WCAG 2.2 AA (label becomes aria-label on inner button)', async () => {
    const el = mount<FoundryIconButton>(
      '<foundry-icon-button name="close" label="Close dialog"></foundry-icon-button>',
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for each variant', async () => {
    for (const variant of ['primary', 'secondary', 'danger'] as const) {
      const el = mount<FoundryIconButton>(
        `<foundry-icon-button name="check" label="Confirm" variant="${variant}"></foundry-icon-button>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('does not fire click on the host when disabled', async () => {
    const el = mount<FoundryIconButton>(
      '<foundry-icon-button name="close" label="Close" disabled></foundry-icon-button>',
    );
    await raf();

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    inner.click();

    expect(fired).to.equal(0);
  });
});
