import { expect } from '@open-wc/testing';
import { FoundryTag } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryTag.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getClose(host: HTMLElement): HTMLButtonElement {
  const btn = host.shadowRoot?.querySelector('button[part="close"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('inner close button missing');
  return btn;
}

describe('<foundry-tag> functional', () => {
  afterEach(() => cleanup());

  it('passes axe as a plain (non-removable) tag', async () => {
    const el = mount<FoundryTag>('<foundry-tag>design</foundry-tag>');
    await raf();
    await expectA11y(el);
  });

  it('passes axe for each intent variant (removable)', async () => {
    for (const variant of ['neutral', 'info', 'success', 'warning', 'danger'] as const) {
      const el = mount<FoundryTag>(
        `<foundry-tag variant="${variant}" removable>${variant}</foundry-tag>`,
      );
      await raf();
      await expectA11y(el);
      cleanup();
    }
  });

  it('passes axe for a disabled removable tag', async () => {
    const el = mount<FoundryTag>(
      '<foundry-tag removable disabled>locked</foundry-tag>',
    );
    await raf();
    await expectA11y(el);
  });

  it('close button is focusable only when removable', async () => {
    const el = mount<FoundryTag>('<foundry-tag>design</foundry-tag>');
    await raf();
    expect(getClose(el).tabIndex).to.equal(-1);

    el.setAttribute('removable', '');
    await raf();
    expect(getClose(el).tabIndex).to.equal(0);
  });

  it('clicking close dispatches "remove" with the correct detail and removes from the DOM', async () => {
    const container = document.createElement('div');
    container.innerHTML = `<foundry-tag removable value="design">design</foundry-tag>`;
    document.body.appendChild(container);
    const el = container.querySelector('foundry-tag') as FoundryTag;
    await raf();

    let detail: { value: string } | undefined;
    container.addEventListener('remove', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });

    getClose(el).click();
    await raf();

    expect(detail?.value).to.equal('design');
    expect(container.querySelector('foundry-tag')).to.equal(null);
    container.remove();
  });

  it('preventDefault() on the remove listener keeps the tag in the DOM', async () => {
    const container = document.createElement('div');
    container.innerHTML = `<foundry-tag removable>design</foundry-tag>`;
    document.body.appendChild(container);
    const el = container.querySelector('foundry-tag') as FoundryTag;
    await raf();

    container.addEventListener('remove', (e) => e.preventDefault());
    getClose(el).click();
    await raf();

    expect(container.contains(el)).to.equal(true);
    container.remove();
  });

  it('Enter and Space on the close button both dispatch remove', async () => {
    const el1 = mount<FoundryTag>('<foundry-tag removable>x</foundry-tag>');
    await raf();
    let fired1 = 0;
    el1.addEventListener('remove', (e) => {
      e.preventDefault();
      fired1 += 1;
    });
    getClose(el1).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fired1).to.equal(1);

    cleanup();
    const el2 = mount<FoundryTag>('<foundry-tag removable>y</foundry-tag>');
    await raf();
    let fired2 = 0;
    el2.addEventListener('remove', (e) => {
      e.preventDefault();
      fired2 += 1;
    });
    getClose(el2).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(fired2).to.equal(1);
  });

  it('disabled removable tag does not dispatch remove on click', async () => {
    const container = document.createElement('div');
    container.innerHTML = `<foundry-tag removable disabled>locked</foundry-tag>`;
    document.body.appendChild(container);
    const el = container.querySelector('foundry-tag') as FoundryTag;
    await raf();

    let fired = 0;
    el.addEventListener('remove', () => {
      fired += 1;
    });
    getClose(el).click();
    await raf();

    expect(fired).to.equal(0);
    expect(container.contains(el)).to.equal(true);
    container.remove();
  });
});
