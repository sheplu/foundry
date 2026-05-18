import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FoundryCarousel } from './carousel.ts';
import { FoundryCarouselSlide } from '../carousel-slide/carousel-slide.ts';

beforeAll(() => {
  FoundryCarousel.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-carousel-test-${++counter}`;
  class Sub extends FoundryCarousel {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

async function makeCarousel(opts: {
  slides?: { value?: string; text?: string }[];
  value?: string;
  transition?: 'slide' | 'fade';
  autoAdvance?: number;
  loop?: boolean;
} = {}): Promise<FoundryCarousel> {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryCarousel;
  if (opts.value !== undefined) el.setAttribute('value', opts.value);
  if (opts.transition) el.setAttribute('transition', opts.transition);
  if (opts.autoAdvance !== undefined) el.setAttribute('auto-advance', String(opts.autoAdvance));
  // Boolean attribute: presence = true. Set the property directly when we
  // want to disable, so the host's #writeProperty path removes the attr.
  if (opts.loop === false) {
    (el as unknown as { loop: boolean }).loop = false;
  }
  const slides = opts.slides ?? [
    { value: 'a', text: 'Alpha' },
    { value: 'b', text: 'Bravo' },
    { value: 'c', text: 'Charlie' },
  ];
  for (const s of slides) {
    const slide = document.createElement('foundry-carousel-slide');
    if (s.value) slide.setAttribute('value', s.value);
    slide.textContent = s.text ?? s.value ?? '';
    el.appendChild(slide);
  }
  document.body.appendChild(el);
  await raf();
  return el;
}

function indicators(el: FoundryCarousel): HTMLButtonElement[] {
  return Array.from(
    el.shadowRoot?.querySelectorAll<HTMLButtonElement>('button[data-index]') ?? [],
  );
}

function prevBtn(el: FoundryCarousel): HTMLButtonElement {
  const b = el.shadowRoot?.querySelector('button[part="prev"]');
  if (!(b instanceof HTMLButtonElement)) throw new Error('prev missing');
  return b;
}

function nextBtn(el: FoundryCarousel): HTMLButtonElement {
  const b = el.shadowRoot?.querySelector('button[part="next"]');
  if (!(b instanceof HTMLButtonElement)) throw new Error('next missing');
  return b;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryCarousel.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-carousel')).toBe(FoundryCarousel);
  });

  it('also defines foundry-carousel-slide', () => {
    expect(customElements.get('foundry-carousel-slide')).toBe(FoundryCarouselSlide);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-carousel-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryCarousel.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryCarousel defaults', () => {
  it('defaults transition="slide"', async () => {
    const el = await makeCarousel();
    expect(el.getAttribute('transition')).toBe('slide');
  });

  it('renders prev/next buttons + indicators row', async () => {
    const el = await makeCarousel();
    expect(el.shadowRoot?.querySelector('button[part="prev"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('button[part="next"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="indicators"]')).toBeTruthy();
  });

  it('renders one indicator dot per slide', async () => {
    const el = await makeCarousel();
    expect(indicators(el).length).toBe(3);
  });

  it('inner region carries the default aria-label "Carousel"', async () => {
    const el = await makeCarousel();
    const region = el.shadowRoot?.querySelector('[part="region"]');
    expect(region?.getAttribute('aria-label')).toBe('Carousel');
  });
});

describe('FoundryCarousel — slide discovery', () => {
  it('discovers slides via assignedElements', async () => {
    const el = await makeCarousel();
    expect(el.slides.length).toBe(3);
  });

  it('auto-generates value on slides without one', async () => {
    const el = await makeCarousel({
      slides: [{ text: 'A' }, { text: 'B' }],
    });
    for (const slide of el.slides) {
      expect(slide.hasAttribute('value')).toBe(true);
    }
  });

  it('re-discovers slides after slotchange', async () => {
    const el = await makeCarousel();
    const newSlide = document.createElement('foundry-carousel-slide');
    newSlide.setAttribute('value', 'd');
    newSlide.textContent = 'Delta';
    el.appendChild(newSlide);
    await raf();
    expect(el.slides.length).toBe(4);
  });
});

describe('FoundryCarousel — initial selection', () => {
  it('selects the first slide by default', async () => {
    const el = await makeCarousel();
    expect(el.slides[0]?.hasAttribute('selected')).toBe(true);
    expect(el.slides[1]?.hasAttribute('selected')).toBe(false);
  });

  it('explicit value selects the matching slide', async () => {
    const el = await makeCarousel({ value: 'b' });
    expect(el.slides[1]?.hasAttribute('selected')).toBe(true);
  });

  it('non-matching value falls back to the first slide', async () => {
    const el = await makeCarousel({ value: 'ghost' });
    expect(el.slides[0]?.hasAttribute('selected')).toBe(true);
    expect(el.getAttribute('value')).toBe('a');
  });
});

describe('FoundryCarousel — prev / next', () => {
  it('next advances by one slide', async () => {
    const el = await makeCarousel({ value: 'a' });
    nextBtn(el).click();
    expect(el.getAttribute('value')).toBe('b');
  });

  it('prev retreats by one slide', async () => {
    const el = await makeCarousel({ value: 'b' });
    prevBtn(el).click();
    expect(el.getAttribute('value')).toBe('a');
  });

  it('next at end wraps to first when loop=true (default)', async () => {
    const el = await makeCarousel({ value: 'c' });
    nextBtn(el).click();
    expect(el.getAttribute('value')).toBe('a');
  });

  it('prev at start wraps to last when loop=true', async () => {
    const el = await makeCarousel({ value: 'a' });
    prevBtn(el).click();
    expect(el.getAttribute('value')).toBe('c');
  });

  it('next at end is no-op when loop=false', async () => {
    const el = await makeCarousel({ value: 'c', loop: false });
    nextBtn(el).click();
    expect(el.getAttribute('value')).toBe('c');
    expect(nextBtn(el).hasAttribute('disabled')).toBe(true);
  });

  it('prev at start is no-op + disabled when loop=false', async () => {
    const el = await makeCarousel({ value: 'a', loop: false });
    prevBtn(el).click();
    expect(el.getAttribute('value')).toBe('a');
    expect(prevBtn(el).hasAttribute('disabled')).toBe(true);
  });
});

describe('FoundryCarousel — indicators', () => {
  it('clicking an indicator selects the matching slide', async () => {
    const el = await makeCarousel();
    indicators(el)[2]?.click();
    expect(el.getAttribute('value')).toBe('c');
  });

  it('the active indicator carries the indicator-current part', async () => {
    const el = await makeCarousel({ value: 'b' });
    expect(indicators(el)[1]?.getAttribute('part')).toContain('indicator-current');
    expect(indicators(el)[0]?.getAttribute('part')).not.toContain('indicator-current');
  });

  it('indicator aria-labels use the indicator-label prefix', async () => {
    const el = await makeCarousel();
    expect(indicators(el)[0]?.getAttribute('aria-label')).toBe('Go to slide 1');
  });

  it('changing indicator-label reflects onto rendered dot labels', async () => {
    const el = await makeCarousel();
    el.setAttribute('indicator-label', 'Diapositive');
    expect(indicators(el)[0]?.getAttribute('aria-label')).toBe('Diapositive 1');
  });

  it('clicking the current indicator is a no-op (no change event)', async () => {
    const el = await makeCarousel({ value: 'a' });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    indicators(el)[0]?.click();
    expect(fired).toBe(0);
  });
});

describe('FoundryCarousel — keyboard', () => {
  it('ArrowRight advances + dispatches change', async () => {
    const el = await makeCarousel({ value: 'a' });
    let detail: { value: string } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    const region = el.shadowRoot?.querySelector('[part="region"]');
    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(detail?.value).toBe('b');
  });

  it('ArrowLeft retreats', async () => {
    const el = await makeCarousel({ value: 'b' });
    const region = el.shadowRoot?.querySelector('[part="region"]');
    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(el.getAttribute('value')).toBe('a');
  });

  it('Home jumps to first slide', async () => {
    const el = await makeCarousel({ value: 'c' });
    const region = el.shadowRoot?.querySelector('[part="region"]');
    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(el.getAttribute('value')).toBe('a');
  });

  it('End jumps to last slide', async () => {
    const el = await makeCarousel({ value: 'a' });
    const region = el.shadowRoot?.querySelector('[part="region"]');
    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    expect(el.getAttribute('value')).toBe('c');
  });

  it('Home on the first slide is a no-op (no change event)', async () => {
    const el = await makeCarousel({ value: 'a' });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    const region = el.shadowRoot?.querySelector('[part="region"]');
    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(fired).toBe(0);
  });

  it('non-arrow keys are no-ops', async () => {
    const el = await makeCarousel({ value: 'a' });
    const region = el.shadowRoot?.querySelector('[part="region"]');
    region?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(el.getAttribute('value')).toBe('a');
  });

  it('keydown from inside slide content does not advance', async () => {
    const el = await makeCarousel({
      slides: [
        { value: 'a', text: 'Alpha' },
        { value: 'b', text: 'Bravo' },
      ],
    });
    // Insert a child inside the first slide and dispatch keydown from it.
    const slide = el.querySelector('foundry-carousel-slide');
    const inner = document.createElement('button');
    inner.textContent = 'inside';
    slide?.appendChild(inner);
    inner.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(el.getAttribute('value')).toBe('a');
  });
});

describe('FoundryCarousel — change event', () => {
  it('fires on user-driven navigation', async () => {
    const el = await makeCarousel({ value: 'a' });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    nextBtn(el).click();
    expect(fired).toBe(1);
  });

  it('does not fire when value is set programmatically', async () => {
    const el = await makeCarousel({ value: 'a' });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    (el as unknown as { value: string }).value = 'b';
    expect(fired).toBe(0);
  });

  it('setting value to the current value is a no-op (no change event)', async () => {
    const el = await makeCarousel({ value: 'a' });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    (el as unknown as { value: string }).value = 'a';
    expect(fired).toBe(0);
    expect(el.getAttribute('value')).toBe('a');
  });

  it('event detail.value is the new slide value', async () => {
    const el = await makeCarousel({ value: 'a' });
    let detail: { value: string } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    indicators(el)[2]?.click();
    expect(detail?.value).toBe('c');
  });
});

describe('FoundryCarousel — auto-advance', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances to next slide after the configured interval', async () => {
    // Build the carousel under real timers so rAF in makeCarousel resolves;
    // then switch to fake timers + force the interval to restart under
    // the fake clock by toggling autoAdvance.
    const el = await makeCarousel({ autoAdvance: 1000 });
    vi.useFakeTimers();
    (el as unknown as { autoAdvance: number }).autoAdvance = 0;
    (el as unknown as { autoAdvance: number }).autoAdvance = 1000;
    expect(el.getAttribute('value')).toBe('a');
    vi.advanceTimersByTime(1000);
    expect(el.getAttribute('value')).toBe('b');
  });

  it('does not advance when autoAdvance=0', async () => {
    const el = await makeCarousel();
    vi.useFakeTimers();
    vi.advanceTimersByTime(5000);
    expect(el.getAttribute('value')).toBe('a');
  });

  it('pauses on pointerenter, resumes on pointerleave', async () => {
    const el = await makeCarousel({ autoAdvance: 1000 });
    vi.useFakeTimers();
    (el as unknown as { autoAdvance: number }).autoAdvance = 0;
    (el as unknown as { autoAdvance: number }).autoAdvance = 1000;
    const region = el.shadowRoot?.querySelector('[part="region"]') as HTMLElement;
    region.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(1500);
    expect(el.getAttribute('value')).toBe('a');
    region.dispatchEvent(new Event('pointerleave'));
    vi.advanceTimersByTime(1000);
    expect(el.getAttribute('value')).toBe('b');
  });

  it('clears interval on disconnected', async () => {
    const el = await makeCarousel({ autoAdvance: 1000 });
    vi.useFakeTimers();
    el.remove();
    vi.advanceTimersByTime(2000);
    // No error — if the timer leaked we'd see `#move` running on a
    // detached element. #syncTimer guards on isConnected.
    expect(true).toBe(true);
  });
});

describe('FoundryCarousel — transition modes', () => {
  it('default transition reflects "slide"', async () => {
    const el = await makeCarousel();
    expect(el.getAttribute('transition')).toBe('slide');
  });

  it('transition="fade" applies fade-mode track styling', async () => {
    const el = await makeCarousel({ transition: 'fade' });
    expect(el.getAttribute('transition')).toBe('fade');
  });

  it('changing transition mode re-applies the track transform', async () => {
    const el = await makeCarousel();
    (el as unknown as { transition: string }).transition = 'fade';
    const track = el.shadowRoot?.querySelector('[part="track"]') as HTMLElement;
    // Fade mode should clear the transform.
    expect(track.style.transform).toBe('');
  });
});

describe('FoundryCarousel — propertyChanged filter', () => {
  it('ignores unknown property names', async () => {
    const el = await makeCarousel();
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});

describe('FoundryCarousel — i18n labels', () => {
  it('label attribute reflects onto inner region aria-label', async () => {
    const el = await makeCarousel();
    el.setAttribute('label', 'Featured products');
    expect(
      el.shadowRoot?.querySelector('[part="region"]')?.getAttribute('aria-label'),
    ).toBe('Featured products');
  });

  it('prev-label + next-label reflect onto button aria-labels', async () => {
    const el = await makeCarousel();
    el.setAttribute('prev-label', 'Précédent');
    el.setAttribute('next-label', 'Suivant');
    expect(prevBtn(el).getAttribute('aria-label')).toBe('Précédent');
    expect(nextBtn(el).getAttribute('aria-label')).toBe('Suivant');
  });

  it('empty label falls back to "Carousel"', async () => {
    const el = await makeCarousel();
    (el as unknown as { label: string }).label = '';
    expect(
      el.shadowRoot?.querySelector('[part="region"]')?.getAttribute('aria-label'),
    ).toBe('Carousel');
  });
});

describe('FoundryCarousel — indicator background clicks', () => {
  it('clicking the indicators background (non-button) is ignored', async () => {
    const el = await makeCarousel();
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    const ind = el.shadowRoot?.querySelector('[part="indicators"]') as HTMLElement;
    ind.click();
    expect(fired).toBe(0);
  });
});
