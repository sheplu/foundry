import { FoundryElement } from '../../core/foundry-element.ts';
import { PopoverController } from '../../core/popover-controller.ts';
import { type PopoverPlacement } from '../../core/position.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './tooltip.template.html?raw';
import styleCss from './tooltip.css?inline';

/**
 * Placement alias kept for historical compatibility within the tooltip
 * component. Consumers should prefer the canonical `PopoverPlacement` from
 * `@foundry/elements`.
 */
export type TooltipPlacement = PopoverPlacement;

const DEFAULT_PLACEMENT: PopoverPlacement = 'top';
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
 * Positioning, top-layer plumbing, and viewport-change handling are all
 * delegated to the shared `PopoverController` in `core/` — the same
 * primitive every future popover-adjacent component will use.
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
      default: DEFAULT_PLACEMENT satisfies PopoverPlacement,
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
  #controller: PopoverController | undefined;
  #showTimer: ReturnType<typeof setTimeout> | undefined;
  #hideTimer: ReturnType<typeof setTimeout> | undefined;
  #tooltipId = '';
  #onPointerEnter = (): void => this.#scheduleShow(this.#getDelayShow());
  #onPointerLeave = (): void => this.#scheduleHide(this.#getDelayHide());
  #onFocusIn = (): void => this.#scheduleShow(0);
  #onFocusOut = (): void => this.#scheduleHide(this.#getDelayHide());

  override connected(): void {
    this.#surface = this.refs['surface'] as HTMLElement | undefined;
    this.#triggerSlot = this.refs['triggerSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#surface || !this.#triggerSlot) return;

    this.#syncPlacement();
    this.#tooltipId = `foundry-tooltip-${++nextId}`;
    this.#surface.id = this.#tooltipId;

    this.#controller = new PopoverController({
      host: this,
      surface: this.#surface,
      getAnchor: () => this.#trigger,
      getPlacement: () =>
        (this.readProperty('placement') as PopoverPlacement) ?? DEFAULT_PLACEMENT,
      offset: DEFAULT_OFFSET,
    });
    this.#controller.attach();

    this.#resolveTrigger();
    this.#triggerSlot.addEventListener('slotchange', this.#onSlotChange);
  }

  override disconnected(): void {
    this.#clearTimers();
    this.#detachTriggerListeners();
    this.#triggerSlot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#controller?.detach();
    this.#controller = undefined;
  }

  override propertyChanged(name: string): void {
    if (name === 'placement') {
      this.#syncPlacement();
      if (this.#controller?.isOpen) this.#controller.reposition();
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
    /* v8 ignore next -- defensive; called only when trigger is resolved */
    if (!t || !this.#controller) return;
    t.setAttribute('aria-describedby', this.#tooltipId);
    this.#controller.show();
  }

  #hide(): void {
    const t = this.#trigger;
    /* v8 ignore next -- defensive; called only when trigger is resolved */
    if (!t || !this.#controller) return;
    const described = t.getAttribute('aria-describedby');
    if (described === this.#tooltipId) t.removeAttribute('aria-describedby');
    this.#controller.hide();
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
