import { expect } from '@open-wc/testing';
import { FoundryIcon, check, chevronDown, close } from '@foundry/icons';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryIcon.register({ check, 'chevron-down': chevronDown, close });
FoundryIcon.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-icon> functional', () => {
  afterEach(() => cleanup());

  it('renders an <svg> inside the inner ref in an open shadow root', async () => {
    const el = mount<FoundryIcon>('<foundry-icon name="check"></foundry-icon>');
    await raf();
    expect(el.shadowRoot?.mode).to.equal('open');
    const inner = el.shadowRoot?.querySelector('[data-ref="inner"]');
    expect(inner?.querySelector('svg')).to.not.equal(null);
  });

  it('is decorative by default and passes axe-core WCAG 2.2 AA', async () => {
    const el = mount<FoundryIcon>('<foundry-icon name="check"></foundry-icon>');
    await raf();
    expect(el.getAttribute('aria-hidden')).to.equal('true');
    expect(el.hasAttribute('role')).to.equal(false);
    await expectA11y(el);
  });

  it('becomes role=img with aria-label when label is set, and stays axe-clean', async () => {
    const el = mount<FoundryIcon>('<foundry-icon name="close" label="Close dialog"></foundry-icon>');
    await raf();
    expect(el.getAttribute('role')).to.equal('img');
    expect(el.getAttribute('aria-label')).to.equal('Close dialog');
    expect(el.hasAttribute('aria-hidden')).to.equal(false);
    await expectA11y(el);
  });
});
