import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { positionAnchored, type TooltipPlacement } from './position.ts';
import templateHtml from './tooltip.template.html?raw';
import styleCss from './tooltip.css?inline';

export type { TooltipPlacement };

const DEFAULT_PLACEMENT: TooltipPlacement = 'top';
const DEFAULT_DELAY_SHOW = 300;
const DEFAULT_DELAY_HIDE = 0;
const DEFAULT_OFFSET = 8;

let nextId = 0;

/**
 * Accessible tooltip. Wraps a trigger element (default slot) and renders a
 * tooltip in the top layer via the HTML Popover API (`popover="manual"`).
 * Shows on hover (after `delay-show`) or focus (immediate); hides on
 * leave/blur. Accessible name is wired via `aria-describedby` on the
 * trigger → `role="tooltip"` surface.
 *
 * Positioning is JS-driven via `positionAnchored()` — CSS anchor positioning
 * is Chromium-only and would break Firefox/Safari. The pure positioning
 * helper is exported from `./position.ts` for unit testing.
 *
 * @element foundry-tooltip
 * @summary Accessible hover/focus tooltip with top-layer rendering.
 *
 * @attr {'top' | 'bottom' | 'left' | 'right'} placement - Preferred side.
 *   No auto-flip in this version. Defaults to `top`.
 * @attr {number} delay-show - Milliseconds to wait before showing on hover.
 *   Focus-show is always immediate. Default 300.
 * @attr {number} delay-hide - Milliseconds to wait before hiding. Default 0.
 * @attr {boolean} open - Reflected internal state. Managed by the component;
 *   consumers read for styling but shouldn't set directly.
 *
 * @slot - The trigger element. The first assigned element is wired as the
 *   anchor. Additional slotted elements are ignored for interaction but
 *   still render in the light DOM.
 * @slot content - The tooltip body (text or simple inline content).
 *
 * @csspart surface - The tooltip container (the popover root).
 * @csspart arrow - The CSS-triangle arrow pointing at the trigger.
 *
 * @cssprop [--foundry-tooltip-background] - Surface color.
 * @cssprop [--foundry-tooltip-foreground] - Text color.
 * @cssprop [--foundry-tooltip-padding] - Inner padding.
 * @cssprop [--foundry-tooltip-radius] - Corner radius.
 * @cssprop [--foundry-tooltip-font-size] - Text size.
 * @cssprop [--foundry-tooltip-offset] - Distance between trigger and surface.
 * @cssprop [--foundry-tooltip-arrow-size] - Triangle edge length.
 * @cssprop [--foundry-tooltip-max-inline-size] - Wrapping width.
 * @cssprop [--foundry-tooltip-transition] - Fade duration.
 */
export class FoundryTooltip extends FoundryElement {
  static override properties = {
    placement: {
      type: String,
      reflect: true,
      default: DEFAULT_PLACEMENT satisfies TooltipPlacement,
    },
    delayShow: { type: Number, reflect: true, default: DEFAULT_DELAY_SHOW },
    delayHide: { type: Number, reflect: true, default: DEFAULT_DELAY_HIDE },
    open: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-tooltip'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTooltip);
    }
  }

  #surface: HTMLElement | undefined;
  #triggerSlot: HTMLSlotElement | undefined;
  #trigger: HTMLElement | undefined;
  #showTimer: ReturnType<typeof setTimeout> | undefined;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
  #tooltipId = '';
  #onPointerEnter = (): void => this.#scheduleShow(this.#getDelayShow());
  #onPointerLeave = (): void => this.#scheduleHide(this.#getDelayHide());
  #onFocusIn = (): void => this.#scheduleShow(0);
  #onFocusOut = (): void => this.#scheduleHide(this.#getDelayHide());
  #onViewportChange = (): void => {
    if (this.readProperty('open')) this.#reposition();
  };

  override connected(): void {
    this.#surface = this.refs['surface'] as HTMLElement | undefined;
    this.#triggerSlot = this.refs['triggerSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#surface || !this.#triggerSlot) return;

    this.#syncPlacement();
    this.#tooltipId = `foundry-tooltip-${++nextId}`;
    this.#surface.id = this.#tooltipId;

    this.#resolveTrigger();
    this.#triggerSlot.addEventListener('slotchange', this.#onSlotChange);

    window.addEventListener('scroll', this.#onViewportChange, { passive: true, capture: true });
    window.addEventListener('resize', this.#onViewportChange, { passive: true });
  }

  override disconnected(): void {
    this.#clearTimers();
    this.#detachTriggerListeners();
    this.#triggerSlot?.removeEventListener('slotchange', this.#onSlotChange);
    window.removeEventListener('scroll', this.#onViewportChange, { capture: true } as EventListenerOptions);
    window.removeEventListener('resize', this.#onViewportChange);
  }

  override propertyChanged(name: string): void {
    if (name === 'placement') {
      this.#syncPlacement();
      if (this.readProperty('open')) this.#reposition();
    }
  }

  #syncPlacement(): void {
    if (!this.hasAttribute('placement')) {
      this.setAttribute('placement', DEFAULT_PLACEMENT);
    }
  }

  #onSlotChange = (): void => {
    this.#detachTriggerListeners();
    this.#resolveTrigger();
  };

  #resolveTrigger(): void {
    /* v8 ignore next -- defensive; connected() guarantees #triggerSlot */
    if (!this.#triggerSlot) return;
    const assigned = this.#triggerSlot.assignedElements();
    const next = assigned[0] instanceof HTMLElement ? assigned[0] : undefined;
    this.#trigger = next;
    if (!next) return;

    next.addEventListener('pointerenter', this.#onPointerEnter);
    next.addEventListener('pointerleave', this.#onPointerLeave);
    next.addEventListener('focusin', this.#onFocusIn);
    next.addEventListener('focusout', this.#onFocusOut);
  }

  #detachTriggerListeners(): void {
    const t = this.#trigger;
    if (!t) return;
    t.removeEventListener('pointerenter', this.#onPointerEnter);
    t.removeEventListener('pointerleave', this.#onPointerLeave);
    t.removeEventListener('focusin', this.#onFocusIn);
    t.removeEventListener('focusout', this.#onFocusOut);
    // Clear any lingering aria-describedby we may have set.
    const described = t.getAttribute('aria-describedby');
    if (described === this.#tooltipId) t.removeAttribute('aria-describedby');
    this.#trigger = undefined;
  }

  #scheduleShow(delay: number): void {
    this.#clearTimers();
    if (delay <= 0) {
      this.#show();
      return;
    }
    this.#showTimer = setTimeout(() => {
      this.#showTimer = undefined;
      this.#show();
    }, delay);
  }

  #scheduleHide(delay: number): void {
    this.#clearTimers();
    if (delay <= 0) {
      this.#hide();
      return;
    }
    this.#hideTimer = setTimeout(() => {
      this.#hideTimer = undefined;
      this.#hide();
    }, delay);
  }

  #clearTimers(): void {
    if (this.#showTimer !== undefined) {
      clearTimeout(this.#showTimer);
      this.#showTimer = undefined;
    }
    if (this.#hideTimer !== undefined) {
      clearTimeout(this.#hideTimer);
      this.#hideTimer = undefined;
    }
  }

  #show(): void {
    const t = this.#trigger;
    const s = this.#surface;
    /* v8 ignore next -- defensive; called only when both are resolved */
    if (!t || !s) return;

    t.setAttribute('aria-describedby', this.#tooltipId);
    // Browsers that don't ship the Popover API (old test runners, jsdom)
    // fall through silently; visual state comes from the [open] attribute.
    const showPopover = (s as HTMLElement & { showPopover?: () => void }).showPopover;
    /* v8 ignore start -- browser-only path; jsdom doesn't implement
       the Popover API, so this branch is exercised in functional tests */
    if (typeof showPopover === 'function') {
      try {
        showPopover.call(s);
      } catch {
        /* already showing; ignore */
      }
    }
    /* v8 ignore stop */
    (this as unknown as { open: boolean }).open = true;
    this.#reposition();
  }

  #hide(): void {
    const t = this.#trigger;
    const s = this.#surface;
    /* v8 ignore next -- defensive; called only when both are resolved */
    if (!t || !s) return;

    const described = t.getAttribute('aria-describedby');
    if (described === this.#tooltipId) t.removeAttribute('aria-describedby');

    const hidePopover = (s as HTMLElement & { hidePopover?: () => void }).hidePopover;
    /* v8 ignore start -- browser-only path; jsdom doesn't implement
       the Popover API, so this branch is exercised in functional tests */
    if (typeof hidePopover === 'function') {
      try {
        hidePopover.call(s);
      } catch {
        /* already hidden; ignore */
      }
    }
    /* v8 ignore stop */
    (this as unknown as { open: boolean }).open = false;
  }

  #reposition(): void {
    const t = this.#trigger;
    const s = this.#surface;
    /* v8 ignore next -- defensive; callers check open state */
    if (!t || !s) return;
    const anchor = t.getBoundingClientRect();
    const popover = s.getBoundingClientRect();
    const placement = (this.readProperty('placement') as TooltipPlacement) ?? DEFAULT_PLACEMENT;
    const { top, left } = positionAnchored(anchor, popover, placement, DEFAULT_OFFSET);
    s.style.top = `${top}px`;
    s.style.left = `${left}px`;
  }

  #getDelayShow(): number {
    const raw = this.readProperty('delayShow');
    if (raw === null || raw === undefined) return DEFAULT_DELAY_SHOW;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DELAY_SHOW;
  }

  #getDelayHide(): number {
    const raw = this.readProperty('delayHide');
    if (raw === null || raw === undefined) return DEFAULT_DELAY_HIDE;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DELAY_HIDE;
  }
}
