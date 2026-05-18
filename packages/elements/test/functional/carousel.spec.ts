import { expect } from '@open-wc/testing';
import { FoundryCarousel, FoundryCarouselSlide } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryCarousel.define();
FoundryCarouselSlide.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

const sample = `
  <foundry-carousel label="Test carousel">
    <foundry-carousel-slide value="one">
      <div style="block-size:100%;display:flex;align-items:center;justify-content:center;background:#3b82f6;color:white;">One</div>
    </foundry-carousel-slide>
    <foundry-carousel-slide value="two">
      <div style="block-size:100%;display:flex;align-items:center;justify-content:center;background:#10b981;color:white;">Two</div>
    </foundry-carousel-slide>
    <foundry-carousel-slide value="three">
      <div style="block-size:100%;display:flex;align-items:center;justify-content:center;background:#f59e0b;color:white;">Three</div>
    </foundry-carousel-slide>
  </foundry-carousel>
`;

describe('<foundry-carousel> functional', () => {
  afterEach(() => cleanup());

  it('passes axe at default state', async () => {
    const el = mount<FoundryCarousel>(sample);
    await raf();
    await expectA11y(el, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
  });

  it('clicking next dispatches change with detail.value', async () => {
    const el = mount<FoundryCarousel>(sample);
    await raf();
    let detail: { value: string } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    const next = el.shadowRoot?.querySelector('button[part="next"]') as HTMLButtonElement;
    next?.click();
    expect(detail?.value).to.equal('two');
  });

  it('clicking the last indicator selects the last slide', async () => {
    const el = mount<FoundryCarousel>(sample);
    await raf();
    const dots = el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[data-index]') ?? [];
    dots[2]?.click();
    await raf();
    expect(el.getAttribute('value')).to.equal('three');
  });

  it('ArrowRight on the focused region advances', async () => {
    const el = mount<FoundryCarousel>(sample);
    await raf();
    const region = el.shadowRoot?.querySelector('[part="region"]') as HTMLElement;
    region.focus();
    region.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(el.getAttribute('value')).to.equal('two');
  });

  it('region carries aria-roledescription="carousel" + aria-label', async () => {
    const el = mount<FoundryCarousel>(sample);
    await raf();
    const region = el.shadowRoot?.querySelector('[part="region"]');
    expect(region?.getAttribute('aria-roledescription')).to.equal('carousel');
    expect(region?.getAttribute('aria-label')).to.equal('Test carousel');
  });

  it('non-active slides carry aria-hidden="true"', async () => {
    const el = mount<FoundryCarousel>(sample);
    await raf();
    const slides = el.querySelectorAll('foundry-carousel-slide');
    expect(slides[0]?.hasAttribute('aria-hidden')).to.equal(false);
    expect(slides[1]?.getAttribute('aria-hidden')).to.equal('true');
    expect(slides[2]?.getAttribute('aria-hidden')).to.equal('true');
  });
});
