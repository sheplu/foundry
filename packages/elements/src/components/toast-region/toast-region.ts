import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryToast, type ToastDismissReason, type ToastVariant } from '../toast/toast.ts';
import templateHtml from './toast-region.template.html?raw';
import styleCss from './toast-region.css?inline';

export type ToastPosition
  = | 'top-start' | 'top-center' | 'top-end'
    | 'bottom-start' | 'bottom-center' | 'bottom-end';

export interface ToastOptions {
  variant?: ToastVariant;
  message: string;
  title?: string;
  duration?: number;
  closeable?: boolean;
}

export interface ToastHandle {
  readonly toast: FoundryToast;
  dismiss(reason?: ToastDismissReason): Promise<void>;
  readonly closed: Promise<void>;
}

const DEFAULT_POSITION: ToastPosition = 'bottom-end';
const DEFAULT_MAX = 5;

/**
 * Long-lived container that manages a stack of `<foundry-toast>` items.
 * Consumers typically create one at app-shell root and spawn toasts
 * imperatively via `region.add({ variant, message })`, which returns a
 * handle:
 *
 *   const handle = region.add({ variant: 'success', message: 'Saved' });
 *   await handle.closed;  // resolves after the toast leaves the DOM
 *
 * Declarative `<foundry-toast slot="items">` children work too — they
 * participate in the same stack and `max` enforcement.
 *
 * The region is anchored to one of six viewport corners via the
 * `position` attribute (logical-property-aware, so RTL flips start / end).
 *
 * @element foundry-toast-region
 * @summary Region manager for transient notifications.
 *
 * @attr {string} position - Viewport anchoring. One of `top-start`,
 *   `top-center`, `top-end`, `bottom-start`, `bottom-center`,
 *   `bottom-end`. Default `bottom-end`. Reflects.
 * @attr {number} max - Cap on visible toasts. When exceeded, oldest
 *   toasts auto-dismiss with `reason: 'timeout'`. Default 5.
 *
 * @slot items - Holds `<foundry-toast>` children (imperatively added or
 *   declared in markup).
 *
 * @csspart region - The fixed-position stack container.
 *
 * @cssprop [--foundry-toast-region-gap] - Vertical spacing between toasts.
 * @cssprop [--foundry-toast-region-padding] - Outer padding from the
 *   viewport edge.
 * @cssprop [--foundry-toast-region-z-index] - Stacking context.
 * @cssprop [--foundry-toast-region-inline-size] - Stack width.
 */
export class FoundryToastRegion extends FoundryElement {
  static override properties = {
    position: {
      type: String,
      reflect: true,
      default: DEFAULT_POSITION satisfies ToastPosition,
    },
    max: { type: Number, reflect: true, default: DEFAULT_MAX },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-toast-region'): void {
    FoundryToast.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryToastRegion);
    }
  }

  #slot: HTMLSlotElement | undefined;
  #toasts: FoundryToast[] = [];
  // Suppress `#enforceMax` recursion when we're dismissing a toast as
  // part of max enforcement (the removed child fires slotchange).
  #enforcing = false;

  override connected(): void {
    this.#slot = this.refs['slot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides the slot */
    if (!this.#slot) return;

    if (!this.hasAttribute('position')) {
      this.setAttribute('position', DEFAULT_POSITION);
    }

    this.#slot.addEventListener('slotchange', this.#onSlotChange);
    this.#readToasts();
    this.#enforceMax();
  }

  override disconnected(): void {
    this.#slot?.removeEventListener('slotchange', this.#onSlotChange);
  }

  /** Snapshot of currently-mounted `<foundry-toast>` children. */
  get toasts(): readonly FoundryToast[] {
    return this.#toasts;
  }

  /**
   * Spawn a new toast from options. Returns a handle with
   * `toast` (the DOM element), `dismiss(reason?)` (a Promise that
   * resolves after removal), and `closed` (a Promise that resolves when
   * the toast's `close` event fires).
   */
  add(options: ToastOptions): ToastHandle {
    const toast = document.createElement('foundry-toast') as FoundryToast;
    toast.setAttribute('slot', 'items');
    if (options.variant) toast.setAttribute('variant', options.variant);
    if (options.duration !== undefined) {
      toast.setAttribute('duration', String(options.duration));
    }
    if (options.closeable === false) {
      toast.removeAttribute('closeable');
      // closeable defaults to true on the component; we need an explicit
      // attribute-write to disable. Setting the property is the cleanest
      // path since it avoids relying on attribute=="false" coercion.
      (toast as unknown as { closeable: boolean }).closeable = false;
    }
    if (options.title !== undefined) {
      const title = document.createElement('span');
      title.setAttribute('slot', 'title');
      title.textContent = options.title;
      toast.appendChild(title);
    }
    toast.append(document.createTextNode(options.message));

    this.appendChild(toast);

    return {
      toast,
      dismiss: (reason: ToastDismissReason = 'manual') => toast.dismiss(reason),
      closed: toast.closed,
    };
  }

  #onSlotChange = (): void => {
    this.#readToasts();
    if (!this.#enforcing) this.#enforceMax();
  };

  #readToasts(): void {
    /* v8 ignore next -- defensive; connected() guarantees #slot */
    if (!this.#slot) return;
    this.#toasts = this.#slot
      .assignedElements({ flatten: true })
      .filter((el): el is FoundryToast => el instanceof FoundryToast);
  }

  #enforceMax(): void {
    const cap = Number(this.readProperty('max') ?? DEFAULT_MAX);
    if (!Number.isFinite(cap) || cap <= 0) return;
    if (this.#toasts.length <= cap) return;

    const overflow = this.#toasts.length - cap;
    this.#enforcing = true;
    // Dismiss the oldest. In column-reverse flex (bottom positions) the
    // oldest is still index 0 in DOM order.
    for (let i = 0; i < overflow; i += 1) {
      const toast = this.#toasts[i];
      if (toast) void toast.dismiss('timeout');
    }
    this.#enforcing = false;
  }
}
