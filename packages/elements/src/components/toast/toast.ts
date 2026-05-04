import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './toast.template.html?raw';
import styleCss from './toast.css?inline';

export type ToastVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ToastDismissReason = 'timeout' | 'close-button' | 'manual';

const DEFAULT_VARIANT: ToastVariant = 'info';
const DEFAULT_DURATION = 5000;
const ASSERTIVE: ReadonlySet<ToastVariant> = new Set<ToastVariant>(['danger', 'warning']);

/**
 * Transient notification. Designed to live inside a
 * `<foundry-toast-region>`, though it works standalone.
 *
 * Behavior:
 *  - Variant drives `role="status"` (info / success / neutral) vs
 *    `role="alert"` (warning / danger), matching `<foundry-alert>`.
 *  - Auto-dismisses after `duration` ms (default 5000). `duration="0"`
 *    disables auto-dismiss (manual close only).
 *  - Pointer hover and focus-within pause the timer; pointerleave /
 *    focusout resume from the remaining time.
 *  - Escape on the focused toast triggers dismiss (close-button reason).
 *  - `dismiss` event is cancelable — `preventDefault()` keeps the toast
 *    alive (useful for dirty-state guards on action toasts).
 *  - `close` event fires after the toast is removed from the DOM; the
 *    imperative handle returned by `region.add()` awaits this.
 *
 * @element foundry-toast
 * @summary A single transient notification.
 *
 * @attr {'neutral' | 'info' | 'success' | 'warning' | 'danger'} variant -
 *   Intent. Drives `role` and surface tokens. Defaults to `info`.
 * @attr {number} duration - Auto-dismiss in milliseconds. `0` disables.
 *   Defaults to 5000.
 * @attr {boolean} closeable - Shows the close button. Defaults to `true`.
 * @attr {boolean} open - Reflected. Present while the toast is live;
 *   removed when `dismiss()` starts.
 *
 * @slot - Body content (plain text or rich markup).
 * @slot title - Optional title, bold.
 * @slot icon - Optional leading icon.
 *
 * @csspart container - The toast surface.
 * @csspart icon - The icon wrapper.
 * @csspart content - The title + body block.
 * @csspart title - The title wrapper.
 * @csspart body - The body-slot wrapper.
 * @csspart close-button - The dismiss button.
 * @csspart close-icon - The close icon.
 *
 * @fires open - Fires once on connect.
 * @fires dismiss - Bubbles + composed + cancelable. Fires before removal.
 *   `event.detail.reason: 'timeout' | 'close-button' | 'manual'`.
 * @fires close - Bubbles + composed. Fires after removal from the DOM.
 *
 * @cssprop [--foundry-toast-padding] - Inner padding.
 * @cssprop [--foundry-toast-radius] - Corner radius.
 * @cssprop [--foundry-toast-shadow] - Drop shadow.
 * @cssprop [--foundry-toast-background] - Default background.
 * @cssprop [--foundry-toast-foreground] - Default text color.
 * @cssprop [--foundry-toast-border-color] - Default border color.
 * @cssprop [--foundry-toast-gap] - Grid gap between icon / content / close.
 * @cssprop [--foundry-toast-min-inline-size] - Minimum width.
 * @cssprop [--foundry-toast-max-inline-size] - Maximum width.
 * @cssprop [--foundry-toast-transition] - Exit-fade duration.
 * @cssprop [--foundry-toast-background-info] - Info variant background.
 * @cssprop [--foundry-toast-foreground-info] - Info variant text color.
 * @cssprop [--foundry-toast-background-success] - Success variant background.
 * @cssprop [--foundry-toast-foreground-success] - Success variant text color.
 * @cssprop [--foundry-toast-background-warning] - Warning variant background.
 * @cssprop [--foundry-toast-foreground-warning] - Warning variant text color.
 * @cssprop [--foundry-toast-background-danger] - Danger variant background.
 * @cssprop [--foundry-toast-foreground-danger] - Danger variant text color.
 */
export class FoundryToast extends FoundryElement {
  static override properties = {
    variant: {
      type: String,
      reflect: true,
      default: DEFAULT_VARIANT satisfies ToastVariant,
    },
    duration: { type: Number, reflect: true, default: DEFAULT_DURATION },
    closeable: { type: Boolean, reflect: true, default: true },
    open: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-toast'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryToast);
    }
  }

  #container: HTMLElement | undefined;
  #closeButton: HTMLButtonElement | undefined;
  #dismissTimer: ReturnType<typeof setTimeout> | undefined;
  // Remaining milliseconds until auto-dismiss. Updated when the timer
  // pauses (pointerenter / focusin) and when it resumes.
  #remainingMs = 0;
  // Timestamp when the current schedule started; used to compute elapsed
  // on pause.
  #scheduleStartedAt = 0;
  #paused = false;
  #dismissing = false;
  // Resolver for the close Promise — handed to the imperative handle so
  // consumers can `await region.add(...).closed`.
  #closeResolver: (() => void) | undefined;
  // Cached from attribute-read state so we don't depend on event-handler
  // guards to suppress re-dispatch on disconnect.
  #openEventFired = false;

  /**
   * Promise that resolves after the toast's `close` event fires. The
   * imperative handle returned by `region.add()` forwards this so
   * consumers can `await region.add(...).closed`.
   */
  get closed(): Promise<void> {
    if (this.#closePromise) return this.#closePromise;
    this.#closePromise = new Promise<void>((resolve) => {
      this.#closeResolver = resolve;
    });
    return this.#closePromise;
  }

  #closePromise: Promise<void> | undefined;

  override connected(): void {
    this.#container = this.refs['container'] as HTMLElement | undefined;
    this.#closeButton = this.refs['closeButton'] as HTMLButtonElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#container) return;

    this.#container.setAttribute('aria-atomic', 'true');
    this.#syncVariant();
    this.#wireSlot('iconSlot', 'has-icon');
    this.#wireSlot('titleSlot', 'has-title');

    this.#closeButton?.addEventListener('click', this.#onCloseButtonClick);
    this.addEventListener('pointerenter', this.#onPointerEnter);
    this.addEventListener('pointerleave', this.#onPointerLeave);
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
    this.addEventListener('keydown', this.#onKeydown);

    // open=true reflects onto the host so CSS / consumers can observe the
    // live state without parsing dismiss lifecycle events.
    (this as unknown as { open: boolean }).open = true;

    if (!this.#openEventFired) {
      this.#openEventFired = true;
      this.dispatchEvent(new CustomEvent('open', { bubbles: true, composed: true }));
    }

    this.#scheduleAutoDismiss();
  }

  override disconnected(): void {
    this.#clearDismissTimer();
    this.#closeButton?.removeEventListener('click', this.#onCloseButtonClick);
    this.removeEventListener('pointerenter', this.#onPointerEnter);
    this.removeEventListener('pointerleave', this.#onPointerLeave);
    this.removeEventListener('focusin', this.#onFocusIn);
    this.removeEventListener('focusout', this.#onFocusOut);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  override propertyChanged(name: string): void {
    if (name === 'variant') {
      this.#syncVariant();
    } else if (name === 'duration') {
      // New duration applies from now (matches the tooltip-style reschedule).
      this.#scheduleAutoDismiss();
    }
  }

  /**
   * Programmatically dismiss the toast. Dispatches the cancelable
   * `dismiss` event; if not prevented, removes the toast from the DOM
   * and dispatches `close`.
   */
  async dismiss(reason: ToastDismissReason = 'manual'): Promise<void> {
    if (this.#dismissing) return;
    const event = new CustomEvent('dismiss', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { reason },
    });
    const notPrevented = this.dispatchEvent(event);
    if (!notPrevented) return;

    this.#dismissing = true;
    this.#clearDismissTimer();
    (this as unknown as { open: boolean }).open = false;

    // Trigger the CSS exit transition. Under reduced-motion or when the
    // transition is disabled the removal happens immediately; the
    // transitionend fallback uses a 200ms max wait.
    this.setAttribute('data-exiting', '');
    await this.#waitForExit();
    this.remove();
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    this.#closeResolver?.();
  }

  #waitForExit(): Promise<void> {
    const transition = getComputedStyle(this).transitionDuration;
    // "0s" or empty string → no animation; resolve immediately.
    const hasTransition = transition && transition !== '0s' && transition !== '';
    if (!hasTransition) return Promise.resolve();
    /* v8 ignore start -- jsdom doesn't compute transitionDuration; the
       real-browser transitionend + fallback are exercised in the
       functional spec, where tests call fastExit() or rely on the timer. */
    return new Promise<void>((resolve) => {
      const done = (): void => {
        this.removeEventListener('transitionend', done);
        clearTimeout(timeout);
        resolve();
      };
      // Fallback: don't hang forever if transitionend doesn't fire.
      const timeout = setTimeout(done, 250);
      this.addEventListener('transitionend', done, { once: true });
    });
    /* v8 ignore stop */
  }

  #syncVariant(): void {
    if (!this.hasAttribute('variant')) {
      this.setAttribute('variant', DEFAULT_VARIANT);
    }
    const variant = this.readProperty('variant') as ToastVariant;
    if (this.#container) {
      this.#container.setAttribute('role', ASSERTIVE.has(variant) ? 'alert' : 'status');
    }
  }

  #wireSlot(refName: string, hostAttr: string): void {
    const slot = this.refs[refName] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these slot refs */
    if (!slot) return;
    const sync = (): void => {
      const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        /* v8 ignore next -- named slots only accept elements with slot= */
        return (n.textContent ?? '').trim().length > 0;
      });
      this.toggleAttribute(hostAttr, hasContent);
    };
    slot.addEventListener('slotchange', sync);
    sync();
  }

  // --- Auto-dismiss timer ---------------------------------------------

  #scheduleAutoDismiss(): void {
    this.#clearDismissTimer();
    const d = Number(this.readProperty('duration') ?? DEFAULT_DURATION);
    if (!Number.isFinite(d) || d <= 0) return;
    this.#remainingMs = d;
    this.#paused = false;
    this.#armTimer();
  }

  #armTimer(): void {
    this.#scheduleStartedAt = now();
    this.#dismissTimer = setTimeout(() => {
      this.#dismissTimer = undefined;
      void this.dismiss('timeout');
    }, this.#remainingMs);
  }

  #pauseTimer(): void {
    if (this.#paused) return;
    if (this.#dismissTimer === undefined) return;
    const elapsed = now() - this.#scheduleStartedAt;
    this.#remainingMs = Math.max(0, this.#remainingMs - elapsed);
    clearTimeout(this.#dismissTimer);
    this.#dismissTimer = undefined;
    this.#paused = true;
  }

  #resumeTimer(): void {
    if (!this.#paused) return;
    this.#paused = false;
    if (this.#remainingMs <= 0) {
      void this.dismiss('timeout');
      return;
    }
    this.#armTimer();
  }

  #clearDismissTimer(): void {
    if (this.#dismissTimer !== undefined) {
      clearTimeout(this.#dismissTimer);
      this.#dismissTimer = undefined;
    }
    this.#paused = false;
  }

  // --- Event handlers -------------------------------------------------

  #onCloseButtonClick = (): void => {
    void this.dismiss('close-button');
  };

  #onPointerEnter = (): void => {
    this.#pauseTimer();
  };

  #onPointerLeave = (): void => {
    // Only resume if focus isn't still inside the toast.
    if (this.matches(':focus-within')) return;
    this.#resumeTimer();
  };

  #onFocusIn = (): void => {
    this.#pauseTimer();
  };

  #onFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (next && this.contains(next)) return;
    // Only resume if pointer isn't still hovering.
    if (this.matches(':hover')) return;
    this.#resumeTimer();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      void this.dismiss('close-button');
    }
  };
}

// `performance.now()` when available (real browsers, web-test-runner);
// fall back to Date.now() for environments where performance is missing.
function now(): number {
  /* v8 ignore next -- performance is available in jsdom + all target envs */
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}
