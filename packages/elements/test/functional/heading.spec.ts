import { expect } from '@open-wc/testing';
import { FoundryHeading } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryHeading.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-heading> functional', () => {
  afterEach(() => cleanup());

  it('exposes role=heading with the requested aria-level', async () => {
    const el = mount<FoundryHeading>(
      '<foundry-heading level="3">Section title</foundry-heading>',
    );
    await raf();

    expect(el.getAttribute('role')).to.equal('heading');
    expect(el.getAttribute('aria-level')).to.equal('3');
  });

  it('passes axe-core WCAG 2.2 AA', async () => {
    const el = mount<FoundryHeading>(
      '<foundry-heading level="2">Readable heading</foundry-heading>',
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for each size variant at level 2', async () => {
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      const el = mount<FoundryHeading>(
        `<foundry-heading level="2" size="${size}">Heading ${size}</foundry-heading>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('renders slotted text content', async () => {
    const el = mount<FoundryHeading>(
      '<foundry-heading level="1">Page title</foundry-heading>',
    );
    await raf();
    expect(el.textContent?.trim()).to.equal('Page title');
  });
});
