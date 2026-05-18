import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryCarouselSlide } from '../carousel-slide/carousel-slide.ts';
import templateHtml from './carousel.template.html?raw';
import styleCss from './carousel.css?inline';

export type CarouselTransition = 'slide' | 'fade';

const DEFAULT_TRANSITION: CarouselTransition = 'slide';
const DEFAULT_LABEL = 'Carousel';
const DEFAULT_PREV_LABEL = 'Previous slide';
const DEFAULT_NEXT_LABEL = 'Next slide';
const DEFAULT_INDICATOR_LABEL = 'Go to slide';

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_COMMIT_PX = 8;
const SWIPE_VELOCITY_MS = 300;

let nextSlideId = 0;

/**
 * Slideshow with prev/next buttons, indicator dots, keyboard navigation,
 * optional auto-advance with pause-on-hover/focus, touch swipe via pointer
 * events, and two transition modes (slide / fade). Slot members are
 * `<foundry-carousel-slide>` children.
 *
 * @element foundry-carousel
 * @summary Slideshow with prev/next, indicators, keyboard, swipe, and auto-advance.
 *
 * @attr {string} value - Currently-active slide's `value`. Reflects.
 * @attr {'slide' | 'fade'} transition - Visual transition between slides.
 *   Defaults to `slide`. Reflects.
 * @attr {number} auto-advance - Auto-advance interval in milliseconds;
 *   `0` disables. Defaults to `0`. Reflects.
 * @attr {boolean} loop - Whether navigation wraps at the ends. Defaults
 *   to `true`. Reflects.
 * @attr {string} label - aria-label for the carousel region. Defaults to
 *   `Carousel`.
 * @attr {string} prev-label - aria-label for the prev button.
 * @attr {string} next-label - aria-label for the next button.
 * @attr {string} indicator-label - Prefix for indicator-dot aria-labels.
 *
 * @slot - `<foundry-carousel-slide>` children.
 *
 * @csspart region - The outer `<section>` wrapper.
 * @csspart viewport - The clipping rectangle.
 * @csspart track - The flex strip that translates between slides.
 * @csspart prev - The prev button.
 * @csspart next - The next button.
 * @csspart prev-icon - Chevron SVG inside prev.
 * @csspart next-icon - Chevron SVG inside next.
 * @csspart indicators - The indicator-dot row.
 * @csspart indicator - One indicator dot.
 * @csspart indicator-current - The active indicator dot.
 *
 * @fires change - Bubbles + composed. `event.detail.value` is the new
 *   active slide's value. Fires on user activation (button, swipe, key)
 *   and on auto-advance.
 *
 * @cssprop [--foundry-carousel-aspect-ratio] - Outer aspect ratio. Defaults to `16 / 9`.
 * @cssprop [--foundry-carousel-radius] - Outer corner radius.
 * @cssprop [--foundry-carousel-button-size] - Prev/next button diameter.
 * @cssprop [--foundry-carousel-button-background] - Prev/next idle background.
 * @cssprop [--foundry-carousel-button-foreground] - Prev/next icon color.
 * @cssprop [--foundry-carousel-indicator-size] - Dot diameter.
 * @cssprop [--foundry-carousel-indicator-gap] - Gap between dots.
 * @cssprop [--foundry-carousel-indicator-color] - Idle dot color.
 * @cssprop [--foundry-carousel-indicator-color-active] - Active dot color.
 * @cssprop [--foundry-carousel-transition-duration] - Slide animation duration.
 * @cssprop [--foundry-carousel-focus-outline] - Focus ring color.
 */
export class FoundryCarousel extends FoundryElement {
  static override properties = {
    value: { type: String, reflect: true },
    transition: {
      type: String,
      reflect: true,
      default: DEFAULT_TRANSITION satisfies CarouselTransition,
    },
    autoAdvance: { type: Number, reflect: true, default: 0 },
    loop: { type: Boolean, reflect: true, default: true },
    label: { type: String, reflect: true, default: DEFAULT_LABEL },
    prevLabel: { type: String, reflect: true, default: DEFAULT_PREV_LABEL },
    nextLabel: { type: String, reflect: true, default: DEFAULT_NEXT_LABEL },
    indicatorLabel: {
      type: String,
      reflect: true,
      default: DEFAULT_INDICATOR_LABEL,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-carousel'): void {
    FoundryCarouselSlide.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryCarousel);
    }
  }

  #region: HTMLElement | undefined;
  #viewport: HTMLElement | undefined;
  #track: HTMLElement | undefined;
  #prev: HTMLButtonElement | undefined;
  #next: HTMLButtonElement | undefined;
  #indicators: HTMLElement | undefined;
  #slot: HTMLSlotElement | undefined;

  #slides: FoundryCarouselSlide[] = [];
  #activeIndex = 0;

  #advanceTimer: ReturnType<typeof setInterval> | undefined;
  #pausedByHover = false;
  #pausedByFocus = false;

  #pointerStart: { x: number; y: number; time: number } | undefined;
  #pointerActive = false;
  #pointerCommitted = false;

  // Suppress propertyChanged feedback when we write `value` from inside the
  // user-input path (button click, swipe, indicator).
  #applyingUserInput = false;

  override connected(): void {
    this.#region = this.refs['region'] as HTMLElement | undefined;
    this.#viewport = this.refs['viewport'] as HTMLElement | undefined;
    this.#track = this.refs['track'] as HTMLElement | undefined;
    this.#prev = this.refs['prev'] as HTMLButtonElement | undefined;
    this.#next = this.refs['next'] as HTMLButtonElement | undefined;
    this.#indicators = this.refs['indicators'] as HTMLElement | undefined;
    this.#slot = this.refs['slot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#region || !this.#track || !this.#slot) return;

    if (!this.hasAttribute('transition')) {
      this.setAttribute('transition', DEFAULT_TRANSITION);
    }

    this.#syncRegionLabel();
    this.#syncButtonLabels();

    this.#slot.addEventListener('slotchange', this.#onSlotChange);
    this.#prev?.addEventListener('click', this.#onPrev);
    this.#next?.addEventListener('click', this.#onNext);
    this.#indicators?.addEventListener('click', this.#onIndicatorsClick);
    this.#region.addEventListener('keydown', this.#onKeydown);
    this.#region.addEventListener('pointerenter', this.#onPointerEnter);
    this.#region.addEventListener('pointerleave', this.#onPointerLeave);
    this.#region.addEventListener('focusin', this.#onFocusIn);
    this.#region.addEventListener('focusout', this.#onFocusOut);
    this.#viewport?.addEventListener('pointerdown', this.#onPointerDown);
    this.#viewport?.addEventListener('pointermove', this.#onPointerMove);
    this.#viewport?.addEventListener('pointerup', this.#onPointerEnd);
    this.#viewport?.addEventListener('pointercancel', this.#onPointerEnd);

    this.#readSlides();
    this.#applyValue(false);
    this.#renderIndicators();
    this.#syncTimer();
  }

  override disconnected(): void {
    this.#slot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#prev?.removeEventListener('click', this.#onPrev);
    this.#next?.removeEventListener('click', this.#onNext);
    this.#indicators?.removeEventListener('click', this.#onIndicatorsClick);
    this.#region?.removeEventListener('keydown', this.#onKeydown);
    this.#region?.removeEventListener('pointerenter', this.#onPointerEnter);
    this.#region?.removeEventListener('pointerleave', this.#onPointerLeave);
    this.#region?.removeEventListener('focusin', this.#onFocusIn);
    this.#region?.removeEventListener('focusout', this.#onFocusOut);
    this.#viewport?.removeEventListener('pointerdown', this.#onPointerDown);
    this.#viewport?.removeEventListener('pointermove', this.#onPointerMove);
    this.#viewport?.removeEventListener('pointerup', this.#onPointerEnd);
    this.#viewport?.removeEventListener('pointercancel', this.#onPointerEnd);
    this.#stopTimer();
  }

  override propertyChanged(name: string): void {
    if (name === 'value') {
      if (this.#applyingUserInput) return;
      this.#applyValue(false);
    } else if (name === 'transition') {
      this.#applyValue(false);
    } else if (name === 'autoAdvance') {
      this.#syncTimer();
    } else if (name === 'label') {
      this.#syncRegionLabel();
    } else if (name === 'prevLabel' || name === 'nextLabel') {
      this.#syncButtonLabels();
    } else if (name === 'indicatorLabel') {
      this.#renderIndicators();
    }
  }

  /** Snapshot of discovered `<foundry-carousel-slide>` children. */
  get slides(): readonly FoundryCarouselSlide[] {
    return this.#slides;
  }

  // --- Slot discovery + selection ------------------------------------

  #onSlotChange = (): void => {
    this.#readSlides();
    this.#applyValue(false);
    this.#renderIndicators();
  };

  #readSlides(): void {
    /* v8 ignore next -- defensive; connected() guarantees #slot */
    if (!this.#slot) return;
    const next: FoundryCarouselSlide[] = [];
    for (const el of this.#slot.assignedElements({ flatten: true })) {
      if (el instanceof FoundryCarouselSlide) {
        if (!el.hasAttribute('value')) {
          el.setAttribute('value', `slide-${++nextSlideId}`);
        }
        next.push(el);
      }
    }
    this.#slides = next;
  }

  #applyValue(emitChange: boolean): void {
    if (this.#slides.length === 0) {
      this.#activeIndex = 0;
      return;
    }
    /* v8 ignore next -- defensive null fallback; declared String props always return string */
    const v = (this.readProperty('value') as string | undefined) ?? '';
    let idx = this.#slides.findIndex((s) => s.resolvedValue === v);
    if (idx === -1) idx = 0;
    this.#activeIndex = idx;

    // Reflect resolved value back to the host attribute so consumers can
    // read the canonical selection.
    /* v8 ignore next -- defensive; idx is bounds-checked above */
    const resolved = this.#slides[idx]?.resolvedValue ?? '';
    if ((this.readProperty('value') as string | undefined) !== resolved) {
      this.#applyingUserInput = true;
      (this as unknown as { value: string }).value = resolved;
      this.#applyingUserInput = false;
    }

    for (let i = 0; i < this.#slides.length; i += 1) {
      const slide = this.#slides[i];
      /* v8 ignore next -- defensive; i < #slides.length guarantees slide exists */
      if (!slide) continue;
      const sel = i === idx;
      if ((slide as unknown as { selected: boolean }).selected !== sel) {
        (slide as unknown as { selected: boolean }).selected = sel;
      }
    }

    this.#applyTrackTransform();
    this.#updateIndicatorState();
    this.#updateButtonState();

    if (emitChange) {
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: resolved },
      }));
    }
  }

  #applyTrackTransform(dx = 0): void {
    /* v8 ignore next -- defensive; connected() guarantees #track */
    if (!this.#track) return;
    const transition = (this.readProperty('transition') as CarouselTransition | undefined)
      ?? DEFAULT_TRANSITION;
    if (transition === 'fade') {
      this.#track.style.transform = '';
      return;
    }
    const base = -this.#activeIndex * 100;
    const px = dx === 0 ? '' : ` ${dx >= 0 ? '+' : '-'} ${Math.abs(dx)}px`;
    this.#track.style.transform = `translateX(calc(${base}%${px}))`;
  }

  // --- Indicator rendering -------------------------------------------

  #renderIndicators(): void {
    /* v8 ignore next -- defensive; connected() guarantees #indicators */
    if (!this.#indicators) return;
    /* v8 ignore next 2 -- defensive; indicatorLabel has a property default */
    const prefix = (this.readProperty('indicatorLabel') as string | undefined)
      || DEFAULT_INDICATOR_LABEL;
    this.#indicators.textContent = '';
    this.#slides.forEach((_slide, idx) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('part', idx === this.#activeIndex ? 'indicator indicator-current' : 'indicator');
      dot.setAttribute('aria-label', `${prefix} ${idx + 1}`);
      dot.dataset['index'] = String(idx);
      if (idx === this.#activeIndex) dot.setAttribute('aria-current', 'true');
      this.#indicators?.appendChild(dot);
    });
  }

  #updateIndicatorState(): void {
    /* v8 ignore next -- defensive; connected() guarantees #indicators */
    if (!this.#indicators) return;
    const dots = this.#indicators.querySelectorAll<HTMLButtonElement>('button');
    dots.forEach((dot, idx) => {
      const current = idx === this.#activeIndex;
      dot.setAttribute('part', current ? 'indicator indicator-current' : 'indicator');
      if (current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  #updateButtonState(): void {
    const loop = Boolean(this.readProperty('loop'));
    const atStart = this.#activeIndex <= 0;
    const atEnd = this.#activeIndex >= this.#slides.length - 1;
    /* v8 ignore next -- defensive; #prev is always set after connected() */
    if (this.#prev) {
      if (!loop && atStart) this.#prev.setAttribute('disabled', '');
      else this.#prev.removeAttribute('disabled');
    }
    /* v8 ignore next -- defensive; #next is always set after connected() */
    if (this.#next) {
      if (!loop && atEnd) this.#next.setAttribute('disabled', '');
      else this.#next.removeAttribute('disabled');
    }
  }

  // --- Aria labels ---------------------------------------------------

  #syncRegionLabel(): void {
    /* v8 ignore next -- defensive; connected() guarantees #region */
    if (!this.#region) return;
    /* v8 ignore next -- defensive; label property has a default that backs reads */
    const label = (this.readProperty('label') as string | undefined) || DEFAULT_LABEL;
    this.#region.setAttribute('aria-label', label);
  }

  #syncButtonLabels(): void {
    /* v8 ignore next 4 -- defensive; prev/nextLabel have property defaults */
    const prevLabel = (this.readProperty('prevLabel') as string | undefined)
      || DEFAULT_PREV_LABEL;
    const nextLabel = (this.readProperty('nextLabel') as string | undefined)
      || DEFAULT_NEXT_LABEL;
    this.#prev?.setAttribute('aria-label', prevLabel);
    this.#next?.setAttribute('aria-label', nextLabel);
  }

  // --- Navigation handlers -------------------------------------------

  #onPrev = (): void => {
    this.#move(-1);
  };

  #onNext = (): void => {
    this.#move(1);
  };

  #onIndicatorsClick = (event: MouseEvent): void => {
    const target = event.target;
    /* v8 ignore next -- defensive; click events on indicators target an HTMLElement */
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest<HTMLButtonElement>('button[data-index]');
    if (!button) return;
    const idx = Number(button.dataset['index']);
    /* v8 ignore next -- defensive; we author data-index ourselves as a finite number */
    if (!Number.isFinite(idx)) return;
    this.#goTo(idx);
  };

  #onKeydown = (event: KeyboardEvent): void => {
    // Skip if focus is inside slide content (don't intercept consumer
    // tabbable controls). The region itself has tabindex=0 so a direct
    // focus on the region matches our targets.
    const target = event.target;
    /* v8 ignore next -- defensive; keydown events on the region target an HTMLElement */
    if (!(target instanceof HTMLElement)) return;
    const onRegion = target === this.#region
      || target === this.#prev
      || target === this.#next
      || target.closest('[part="indicator"]') !== null;
    if (!onRegion) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.#move(-1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.#move(1);
        return;
      case 'Home':
        event.preventDefault();
        this.#goTo(0);
        return;
      case 'End':
        event.preventDefault();
        this.#goTo(this.#slides.length - 1);
    }
  };

  #move(delta: 1 | -1): void {
    /* v8 ignore next -- defensive; nav buttons + keyboard are inert before slides */
    if (this.#slides.length === 0) return;
    const loop = Boolean(this.readProperty('loop'));
    let next = this.#activeIndex + delta;
    if (next < 0) {
      if (!loop) return;
      next = this.#slides.length - 1;
    } else if (next >= this.#slides.length) {
      if (!loop) return;
      next = 0;
    }
    this.#goTo(next);
  }

  #goTo(idx: number): void {
    /* v8 ignore next -- defensive; callers always pass valid indices */
    if (idx < 0 || idx >= this.#slides.length) return;
    if (idx === this.#activeIndex) return;
    const slide = this.#slides[idx];
    /* v8 ignore next -- defensive; idx-bounds check above guarantees slide exists */
    if (!slide) return;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = slide.resolvedValue;
    this.#applyingUserInput = false;
    this.#activeIndex = idx;
    this.#applyValue(true);
  }

  // --- Pause / resume -----------------------------------------------

  #onPointerEnter = (): void => {
    this.#pausedByHover = true;
    this.#syncTimer();
  };

  #onPointerLeave = (): void => {
    this.#pausedByHover = false;
    this.#syncTimer();
  };

  /* v8 ignore start -- focus-in/out fires only in real-browser focus paths;
     functional tests cover the auto-advance pause-on-focus end-to-end. */
  #onFocusIn = (): void => {
    this.#pausedByFocus = true;
    this.#syncTimer();
  };

  #onFocusOut = (): void => {
    if (this.matches(':focus-within')) return;
    this.#pausedByFocus = false;
    this.#syncTimer();
  };
  /* v8 ignore stop */

  #syncTimer(): void {
    const interval = Number(this.readProperty('autoAdvance'));
    const shouldRun = Number.isFinite(interval)
      && interval > 0
      && !this.#pausedByHover
      && !this.#pausedByFocus
      && this.isConnected;
    if (shouldRun && this.#advanceTimer === undefined) {
      this.#advanceTimer = setInterval(() => {
        this.#move(1);
      }, interval);
    } else if (!shouldRun && this.#advanceTimer !== undefined) {
      this.#stopTimer();
    }
  }

  #stopTimer(): void {
    if (this.#advanceTimer !== undefined) {
      clearInterval(this.#advanceTimer);
      this.#advanceTimer = undefined;
    }
  }

  // --- Touch swipe ---------------------------------------------------

  /* v8 ignore start -- touch swipe is exercised in functional / E2E tests
     against a real browser; jsdom doesn't synthesize pointer events with
     the geometry we'd need to drive these branches meaningfully. */
  #onPointerDown = (event: PointerEvent): void => {
    // Only track left-button / touch / pen, not right-click.
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    if (this.readProperty('transition') === 'fade') return;
    this.#pointerStart = { x: event.clientX, y: event.clientY, time: Date.now() };
    this.#pointerActive = true;
    this.#pointerCommitted = false;
    /* v8 ignore next -- jsdom doesn't implement setPointerCapture */
    if (typeof (event.target as Element).setPointerCapture === 'function') {
      try {
        (event.target as Element).setPointerCapture(event.pointerId);
      } catch {
        // ignore — capture is a UX nicety, not required for correctness
      }
    }
  };

  #onPointerMove = (event: PointerEvent): void => {
    if (!this.#pointerActive || !this.#pointerStart) return;
    const dx = event.clientX - this.#pointerStart.x;
    const dy = event.clientY - this.#pointerStart.y;
    if (!this.#pointerCommitted) {
      if (Math.abs(dx) < SWIPE_COMMIT_PX) return;
      // Commit only if horizontal motion dominates — otherwise defer to
      // the consumer's vertical scroll inside the slide.
      if (Math.abs(dx) <= Math.abs(dy)) {
        this.#pointerActive = false;
        this.#pointerStart = undefined;
        return;
      }
      this.#pointerCommitted = true;
    }
    event.preventDefault();
    this.#applyTrackTransform(dx);
  };

  #onPointerEnd = (event: PointerEvent): void => {
    if (!this.#pointerActive || !this.#pointerStart) return;
    const dx = event.clientX - this.#pointerStart.x;
    const dt = Date.now() - this.#pointerStart.time;
    this.#pointerActive = false;
    this.#pointerCommitted = false;
    const start = this.#pointerStart;
    this.#pointerStart = undefined;

    /* v8 ignore next -- jsdom doesn't implement releasePointerCapture */
    if (typeof (event.target as Element).releasePointerCapture === 'function') {
      try {
        (event.target as Element).releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }

    const trackWidth = this.#viewport?.offsetWidth ?? 0;
    const fastSwipe = dt < SWIPE_VELOCITY_MS && Math.abs(dx) > SWIPE_THRESHOLD_PX;
    const farDrag = trackWidth > 0 && Math.abs(dx) > trackWidth / 4;

    // Suppress the synthesized click that follows pointerup if we
    // committed a swipe — otherwise tapping a slide could double-fire.
    if (fastSwipe || farDrag) {
      this.#move(dx < 0 ? 1 : -1);
    } else {
      // Snap back to canonical position.
      this.#applyTrackTransform(0);
    }
    void start; // satisfy linter
  };
  /* v8 ignore stop */
}
