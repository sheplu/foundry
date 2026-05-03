import { positionAnchored, type PopoverPlacement } from './position.ts';

export interface PopoverControllerOptions {
  /** The host custom element. The `open` attribute is toggled on it. */
  host: HTMLElement;
  /** The floating surface inside the host's shadow root (the popover root). */
  surface: HTMLElement;
  /** Returns the current anchor. Called on every show / reposition. */
  getAnchor: () => HTMLElement | undefined;
  /** Returns the current placement. Called on every reposition. */
  getPlacement: () => PopoverPlacement;
  /** Distance between anchor and surface in px. */
  offset: number;
}

/**
 * Top-layer show/hide + reposition plumbing, shared by popover-style
 * components (tooltip, popover, select, menu). Does NOT wire trigger
 * events, manage ARIA relationships, or handle keyboard — those are
 * per-component concerns that vary across consumers.
 *
 * Lifecycle: call `attach()` from the host's `connectedCallback()` and
 * `detach()` from `disconnectedCallback()`. Call `show()` / `hide()`
 * from the consumer's own event handlers. `reposition()` runs
 * automatically on `scroll` / `resize` while open.
 */
export class PopoverController {
  #opts: PopoverControllerOptions;
  #open = false;
  #attached = false;
  #onViewportChange = (): void => {
    if (this.#open) this.reposition();
  };

  // Kept in sync with the native `toggle` event so that browser-driven
  // dismissals (light-dismiss in `popover="auto"` mode: outside click,
  // Escape, stack pre-emption) don't leave our `#open` flag stale.
  // Manual-mode popovers (tooltip) never fire `toggle` for external
  // reasons, so this listener is a no-op there.
  #onNativeToggle = (event: Event): void => {
    const next = (event as Event & { newState?: string }).newState;
    if (next === 'closed' && this.#open) {
      this.#open = false;
      this.#opts.host.toggleAttribute('open', false);
    } else if (next === 'open' && !this.#open) {
      this.#open = true;
      this.#opts.host.toggleAttribute('open', true);
    }
  };

  constructor(options: PopoverControllerOptions) {
    this.#opts = options;
  }

  /** Read-only view of the current open state. */
  get isOpen(): boolean {
    return this.#open;
  }

  /** Register window-level listeners. Safe to call once per instance. */
  attach(): void {
    if (this.#attached) return;
    this.#attached = true;
    window.addEventListener('scroll', this.#onViewportChange, { passive: true, capture: true });
    window.addEventListener('resize', this.#onViewportChange, { passive: true });
    this.#opts.surface.addEventListener('toggle', this.#onNativeToggle);
  }

  /** Tear down listeners + hide if still open. Safe to call multiple times. */
  detach(): void {
    if (!this.#attached) return;
    this.#attached = false;
    window.removeEventListener(
      'scroll',
      this.#onViewportChange,
      { capture: true } as EventListenerOptions,
    );
    window.removeEventListener('resize', this.#onViewportChange);
    this.#opts.surface.removeEventListener('toggle', this.#onNativeToggle);
    if (this.#open) this.hide();
  }

  /** Open the popover. Idempotent; a second call while open is a no-op. */
  show(): void {
    if (this.#open) return;
    const { surface, host } = this.#opts;
    const showPopover = (surface as HTMLElement & { showPopover?: () => void }).showPopover;
    /* v8 ignore start -- jsdom doesn't implement the Popover API; this path
       is exercised in the functional (real-browser) test suite */
    if (typeof showPopover === 'function') {
      try {
        showPopover.call(surface);
      } catch {
        /* already showing; ignore */
      }
    }
    /* v8 ignore stop */
    this.#open = true;
    host.toggleAttribute('open', true);
    this.reposition();
  }

  /** Close the popover. Idempotent; a second call while closed is a no-op. */
  hide(): void {
    if (!this.#open) return;
    const { surface, host } = this.#opts;
    const hidePopover = (surface as HTMLElement & { hidePopover?: () => void }).hidePopover;
    /* v8 ignore start -- jsdom doesn't implement the Popover API; this path
       is exercised in the functional (real-browser) test suite */
    if (typeof hidePopover === 'function') {
      try {
        hidePopover.call(surface);
      } catch {
        /* already hidden; ignore */
      }
    }
    /* v8 ignore stop */
    this.#open = false;
    host.toggleAttribute('open', false);
  }

  /**
   * Recompute the surface's position from the current anchor + placement.
   * No-ops when no anchor is resolvable.
   */
  reposition(): void {
    const anchor = this.#opts.getAnchor();
    if (!anchor) return;
    const { surface, getPlacement, offset } = this.#opts;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = surface.getBoundingClientRect();
    const { top, left } = positionAnchored(
      anchorRect,
      popoverRect,
      getPlacement(),
      offset,
      { width: window.innerWidth, height: window.innerHeight },
    );
    surface.style.top = `${top}px`;
    surface.style.left = `${left}px`;
  }
}
