import { FoundryElement } from '../../core/foundry-element.ts';
import { PopoverController } from '../../core/popover-controller.ts';
import { type PopoverPlacement } from '../../core/position.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './popover.template.html?raw';
import styleCss from './popover.css?inline';

const DEFAULT_PLACEMENT: PopoverPlacement = 'bottom';
const DEFAULT_OFFSET = 8;

let nextId = 0;

/**
 * Click-to-toggle light-dismiss popover. Wraps a trigger element (default
 * slot) and renders arbitrary content (`content` slot) in the top layer via
 * the HTML Popover API (`popover="auto"`). Light-dismiss is browser-native:
 * outside click + Escape close the popover; opening another `auto` popover
 * closes this one.
 *
 * The trigger is wired via the `popovertarget` attribute — browsers handle
 * the full show/hide cycle (including the re-open-on-click-while-open
 * corner case). We listen to the surface's `toggle` event to keep
 * `aria-expanded` on the trigger in sync. The `PopoverController`
 * independently keeps the host's `open` attribute in sync for styling.
 *
 * @element foundry-popover
 * @summary Click-to-toggle light-dismiss popover anchored to a trigger.
 *
 * @attr {'top' | 'bottom' | 'left' | 'right'} placement - Preferred side.
 *   Defaults to `bottom`. No auto-flip in this version.
 * @attr {boolean} open - Reflected. Managed by the component + the browser's
 *   light-dismiss; consumers read for styling but shouldn't set directly.
 *
 * @slot - The trigger element. One element; gets `popovertarget`,
 *   `aria-haspopup="dialog"`, `aria-controls`, and `aria-expanded` wired.
 * @slot content - The popover body. Arbitrary content.
 *
 * @csspart surface - The popover container (the popover root).
 *
 * @cssprop [--foundry-popover-background] - Surface background.
 * @cssprop [--foundry-popover-foreground] - Text color.
 * @cssprop [--foundry-popover-padding] - Inner padding.
 * @cssprop [--foundry-popover-radius] - Corner radius.
 * @cssprop [--foundry-popover-border-color] - Border color.
 * @cssprop [--foundry-popover-border-width] - Border thickness.
 * @cssprop [--foundry-popover-shadow] - Drop shadow.
 * @cssprop [--foundry-popover-offset] - Distance between trigger and surface.
 * @cssprop [--foundry-popover-max-inline-size] - Wrapping width.
 * @cssprop [--foundry-popover-transition] - Fade duration.
 */
export class FoundryPopover extends FoundryElement {
  static override properties = {
    placement: {
      type: String,
      reflect: true,
      default: DEFAULT_PLACEMENT satisfies PopoverPlacement,
    },
    open: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-popover'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryPopover);
    }
  }

  #surface: HTMLElement | undefined;
  #triggerSlot: HTMLSlotElement | undefined;
  #trigger: HTMLElement | undefined;
  #controller: PopoverController | undefined;
  #popoverId = '';
  // When the trigger is clicked while the popover is open, `popover="auto"`'s
  // light-dismiss fires on pointerdown (before click) and closes it. Without
  // this flag our click handler would re-open it immediately. We capture the
  // open state at pointerdown and skip the open-call on click if it was open.
  #wasOpenAtPointerdown = false;
  #onTriggerPointerdown = (): void => {
    this.#wasOpenAtPointerdown = this.#controller?.isOpen ?? false;
  };

  #onTriggerClick = (): void => {
    if (this.#wasOpenAtPointerdown) {
      // The browser's light-dismiss already closed the popover on pointerdown.
      // Leaving it closed is the user's intent (they clicked to toggle off).
      this.#wasOpenAtPointerdown = false;
      return;
    }
    this.#surface?.showPopover?.();
  };

  override connected(): void {
    this.#surface = this.refs['surface'] as HTMLElement | undefined;
    this.#triggerSlot = this.refs['triggerSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#surface || !this.#triggerSlot) return;

    this.#syncPlacement();
    this.#popoverId = `foundry-popover-${++nextId}`;
    this.#surface.id = this.#popoverId;

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

    // The controller keeps `host[open]` in sync with the native toggle
    // event. We listen separately to push the `aria-expanded` update onto
    // the trigger element — that's per-component ARIA the controller
    // deliberately doesn't know about.
    this.#surface.addEventListener('toggle', this.#onSurfaceToggle);
  }

  override disconnected(): void {
    this.#detachTriggerWiring();
    this.#triggerSlot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#surface?.removeEventListener('toggle', this.#onSurfaceToggle);
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
    this.#detachTriggerWiring();
    this.#resolveTrigger();
  };

  #onSurfaceToggle = (event: Event): void => {
    const next = (event as Event & { newState?: string }).newState;
    const open = next === 'open';
    this.#trigger?.setAttribute('aria-expanded', String(open));
  };

  #resolveTrigger(): void {
    /* v8 ignore next -- defensive; connected() guarantees #triggerSlot */
    if (!this.#triggerSlot) return;
    const assigned = this.#triggerSlot.assignedElements();
    const next = assigned[0] instanceof HTMLElement ? assigned[0] : undefined;
    this.#trigger = next;
    if (!next) return;

    // `popovertarget` can't be used here — ID resolution does not cross
    // shadow-root boundaries, and our surface lives inside the shadow
    // root. Instead, wire explicit click + pointerdown handlers. The
    // pointerdown captures whether we were open BEFORE the browser's
    // light-dismiss fires (on pointerdown, before click), so the click
    // handler can tell "user clicked trigger to close" from "user clicked
    // trigger to open."
    next.addEventListener('pointerdown', this.#onTriggerPointerdown);
    next.addEventListener('click', this.#onTriggerClick);
    next.setAttribute('aria-haspopup', 'dialog');
    next.setAttribute('aria-controls', this.#popoverId);
    next.setAttribute('aria-expanded', 'false');
  }

  #detachTriggerWiring(): void {
    const t = this.#trigger;
    if (!t) return;
    t.removeEventListener('pointerdown', this.#onTriggerPointerdown);
    t.removeEventListener('click', this.#onTriggerClick);
    // Only remove attributes we ourselves set — compared against our
    // popover's id so we don't stomp attributes the consumer owned.
    if (t.getAttribute('aria-controls') === this.#popoverId) {
      t.removeAttribute('aria-controls');
    }
    t.removeAttribute('aria-haspopup');
    t.removeAttribute('aria-expanded');
    this.#trigger = undefined;
  }
}
