import { expect } from '@open-wc/testing';
import { FoundryText } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryText.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-text> functional', () => {
  afterEach(() => cleanup());

  it('defaults to variant="body" when none is set', async () => {
    const el = mount<FoundryText>('<foundry-text>Body copy</foundry-text>');
    await raf();

    expect(el.getAttribute('variant')).to.equal('body');
  });

  it('reflects an explicit variant', async () => {
    const el = mount<FoundryText>('<foundry-text variant="caption">Caption</foundry-text>');
    await raf();

    expect(el.getAttribute('variant')).to.equal('caption');
  });

  it('passes axe-core WCAG 2.2 AA for each variant', async () => {
    for (const variant of ['body', 'body-sm', 'caption', 'emphasis'] as const) {
      const el = mount<FoundryText>(
        `<foundry-text variant="${variant}">Readable ${variant} text</foundry-text>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('renders slotted text content', async () => {
    const el = mount<FoundryText>('<foundry-text>Hello world</foundry-text>');
    await raf();
    expect(el.textContent?.trim()).to.equal('Hello world');
  });
});
