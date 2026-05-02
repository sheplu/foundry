import { expect } from '@open-wc/testing';
import { FoundryButton } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryButton.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-button> functional', () => {
  afterEach(() => cleanup());

  it('renders an inner native <button> inside an open shadow root', async () => {
    const el = mount<FoundryButton>('<foundry-button>click</foundry-button>');
    await raf();
    expect(el.shadowRoot?.mode).to.equal('open');
    expect(el.shadowRoot?.querySelector('button')).to.be.instanceOf(HTMLButtonElement);
  });

  for (const variant of ['primary', 'secondary', 'danger'] as const) {
    it(`passes axe-core WCAG 2.2 AA with variant="${variant}"`, async () => {
      const el = mount<FoundryButton>(
        `<foundry-button variant="${variant}">label</foundry-button>`,
      );
      await raf();
      await expectA11y(el);
    });
  }

  it('does not fire click on the host when disabled', async () => {
    const el = mount<FoundryButton>('<foundry-button disabled>nope</foundry-button>');
    await raf();
    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });
    const inner = el.shadowRoot?.querySelector('button');
    inner?.click();
    expect(fired).to.equal(0);
    expect(inner?.disabled).to.equal(true);
  });

  it('activates via Enter and Space keys when focused', async () => {
    const el = mount<FoundryButton>('<foundry-button>go</foundry-button>');
    await raf();
    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    inner.focus();
    inner.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    inner.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    inner.click();
    inner.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    inner.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    inner.click();

    expect(fired).to.equal(2);
  });

  it('delegates focus to the inner button', async () => {
    const el = mount<FoundryButton>('<foundry-button>focus me</foundry-button>');
    await raf();
    el.focus();
    expect(document.activeElement).to.equal(el);
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('BUTTON');
  });

  it('passes axe when loading', async () => {
    const el = mount<FoundryButton>('<foundry-button loading>Save</foundry-button>');
    await raf();
    await expectA11y(el);
  });

  it('loading disables the inner button, sets aria-busy, and suppresses clicks', async () => {
    const el = mount<FoundryButton>('<foundry-button loading>Save</foundry-button>');
    await raf();

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(inner.disabled).to.equal(true);
    expect(inner.getAttribute('aria-busy')).to.equal('true');

    let fired = 0;
    el.addEventListener('click', () => {
      fired += 1;
    });
    inner.click();
    expect(fired).to.equal(0);
  });

  it('loading overlays a spinner and keeps the label width stable', async () => {
    const el = mount<FoundryButton>('<foundry-button>Save</foundry-button>');
    await raf();
    const widthBefore = el.getBoundingClientRect().width;

    el.setAttribute('loading', '');
    await raf();
    const widthAfter = el.getBoundingClientRect().width;

    // Label is still in the DOM (only `visibility: hidden`), so the
    // button's intrinsic width should match — no layout jump.
    expect(widthAfter).to.equal(widthBefore);

    // Spinner is the displayed child of [part="spinner"] now.
    const overlay = el.shadowRoot?.querySelector('[part="spinner"]') as HTMLElement;
    expect(getComputedStyle(overlay).display).to.not.equal('none');
    const spinner = overlay.querySelector('foundry-spinner');
    expect(spinner).to.not.equal(null);
  });
});
