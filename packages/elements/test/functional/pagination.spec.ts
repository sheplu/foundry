import { expect } from '@open-wc/testing';
import { FoundryPagination } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryPagination.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function pageButtons(host: HTMLElement): HTMLButtonElement[] {
  return Array.from(
    host.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[part^="page"]') ?? [],
  );
}

function prevButton(host: HTMLElement): HTMLButtonElement {
  const btn = host.shadowRoot?.querySelector('button[part="prev"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('no prev');
  return btn;
}

function nextButton(host: HTMLElement): HTMLButtonElement {
  const btn = host.shadowRoot?.querySelector('button[part="next"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('no next');
  return btn;
}

describe('<foundry-pagination> functional', () => {
  afterEach(() => cleanup());

  it('passes axe at default state (total=5, page=1)', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="1"></foundry-pagination>',
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe with truncated pagination (page=10 of 20)', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="20" page="10"></foundry-pagination>',
    );
    await raf();
    await expectA11y(el);
  });

  it('clicking a page button fires change with detail.page', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="2"></foundry-pagination>',
    );
    await raf();
    let detail: { page: number } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ page: number }>).detail;
    });
    const target = pageButtons(el).find((b) => b.textContent === '4');
    target?.click();
    expect(detail?.page).to.equal(4);
  });

  it('clicking next advances the page', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="2"></foundry-pagination>',
    );
    await raf();
    let detail: { page: number } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ page: number }>).detail;
    });
    nextButton(el).click();
    expect(detail?.page).to.equal(3);
  });

  it('clicking prev decrements the page', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="3"></foundry-pagination>',
    );
    await raf();
    let detail: { page: number } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ page: number }>).detail;
    });
    prevButton(el).click();
    expect(detail?.page).to.equal(2);
  });

  it('prev is disabled at page=1; next disabled at page=total', async () => {
    const first = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="1"></foundry-pagination>',
    );
    await raf();
    expect(prevButton(first).hasAttribute('disabled')).to.equal(true);
    expect(nextButton(first).hasAttribute('disabled')).to.equal(false);
    cleanup();

    const last = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="5"></foundry-pagination>',
    );
    await raf();
    expect(prevButton(last).hasAttribute('disabled')).to.equal(false);
    expect(nextButton(last).hasAttribute('disabled')).to.equal(true);
  });

  it('ArrowRight moves focus to the next enabled button', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="3"></foundry-pagination>',
    );
    await raf();
    const buttons = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );
    buttons[0]?.focus();
    buttons[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(el.shadowRoot?.activeElement).to.equal(buttons[1]);
  });

  it('Home / End jump to first / last', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="3"></foundry-pagination>',
    );
    await raf();
    const buttons = Array.from(
      el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [],
    );
    buttons[2]?.focus();
    buttons[2]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    expect(el.shadowRoot?.activeElement).to.equal(buttons[buttons.length - 1]);
  });

  it('current page carries aria-current="page"', async () => {
    const el = mount<FoundryPagination>(
      '<foundry-pagination total="5" page="3"></foundry-pagination>',
    );
    await raf();
    const current = el.shadowRoot?.querySelector('button[aria-current="page"]');
    expect(current?.textContent).to.equal('3');
  });
});
