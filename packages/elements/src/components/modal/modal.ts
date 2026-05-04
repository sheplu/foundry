import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './modal.template.html?raw';
import styleCss from './modal.css?inline';

export type ModalSize = 'sm' | 'md' | 'lg';

const DEFAULT_SIZE: ModalSize = 'md';

let nextId = 0;

/**
 * Accessible modal dialog with form-close integration. Wraps a native
 * `<dialog>` element so the browser handles the hard parts for free:
 * top-layer hoisting, modal focus containment, inert background, and the
 * `::backdrop` pseudo-element. The component adds three ergonomic layers
 * on top:
 *
 *  1. **Slotted header/body/footer** with stable IDs and dynamic
 *     `aria-labelledby` / `aria-describedby` wiring.
 *  2. **Triple dismiss model** — Escape (native), backdrop click (opt-out
 *     via `dismiss-on-backdrop=false`), and a built-in close button in the
 *     header (opt-out via `hide-close-button`).
 *  3. **Form-close integration** — a `<form method="dialog">` inside the
 *     body automatically closes the dialog on submit and sets
 *     `returnValue` to the clicked button's `value`, surfaced on the
 *     host's bubbling+composed `close` event as `event.detail.returnValue`.
 *
 * @element foundry-modal
 * @summary Accessible dialog backed by the native `<dialog>` element.
 *
 * @attr {boolean} open - Reflected. Tracks dialog open state. Managed by
 *   the component + the browser's native close (Escape, form submit,
 *   backdrop click). Consumers read for styling; prefer `show()` / `close()`
 *   to write.
 * @attr {'sm' | 'md' | 'lg'} size - Width tier. Defaults to `md`.
 *   Overridable with `--foundry-modal-max-inline-size`.
 * @attr {boolean} dismiss-on-backdrop - When `true` (default), clicking
 *   outside the dialog body closes it with `returnValue='dismiss'`. Set
 *   to `false` for blocking modals.
 * @attr {boolean} hide-close-button - Hides the built-in close button in
 *   the header.
 *
 * @slot title - Dialog heading; wired via `aria-labelledby`.
 * @slot description - Optional subheading; wired via `aria-describedby`.
 * @slot - Default slot. The main body content.
 * @slot footer - Optional action row (Cancel/Confirm buttons, etc.).
 *
 * @csspart dialog - The native `<dialog>` element (top-layer surface).
 * @csspart header - Title + description + close button row.
 * @csspart title - The title wrapper.
 * @csspart description - The description wrapper.
 * @csspart close-button - The built-in X close button.
 * @csspart close-icon - The icon inside the close button.
 * @csspart body - The default-slot container.
 * @csspart footer - The footer slot container.
 *
 * @fires close - Bubbles + composed. `event.detail.returnValue` mirrors
 *   the dialog's returnValue.
 * @fires cancel - The native dialog cancel event bubbles through (Escape
 *   keypress). Consumers can `preventDefault()` to veto.
 *
 * @cssprop [--foundry-modal-max-inline-size] - One-off width override.
 * @cssprop [--foundry-modal-max-inline-size-sm] - Width for `size=sm`.
 * @cssprop [--foundry-modal-max-inline-size-md] - Width for `size=md`.
 * @cssprop [--foundry-modal-max-inline-size-lg] - Width for `size=lg`.
 * @cssprop [--foundry-modal-background] - Dialog surface color.
 * @cssprop [--foundry-modal-foreground] - Dialog text color.
 * @cssprop [--foundry-modal-padding] - Inner padding.
 * @cssprop [--foundry-modal-radius] - Corner radius.
 * @cssprop [--foundry-modal-shadow] - Drop shadow.
 * @cssprop [--foundry-modal-backdrop] - `::backdrop` color.
 * @cssprop [--foundry-modal-header-gap] - Header horizontal gap.
 * @cssprop [--foundry-modal-footer-gap] - Footer button gap.
 * @cssprop [--foundry-modal-title-font-size] - Title font size.
 * @cssprop [--foundry-modal-title-font-weight] - Title font weight.
 * @cssprop [--foundry-modal-description-font-size] - Description font size.
 * @cssprop [--foundry-modal-description-color] - Description text color.
 * @cssprop [--foundry-modal-close-color] - Close button icon color.
 * @cssprop [--foundry-modal-close-icon-size] - Close icon dimensions.
 * @cssprop [--foundry-modal-focus-outline] - Focus ring color.
 */
export class FoundryModal extends FoundryElement {
  static override properties = {
    open: { type: Boolean, reflect: true, default: false },
    size: { type: String, reflect: true, default: DEFAULT_SIZE satisfies ModalSize },
    dismissOnBackdrop: { type: Boolean, reflect: true, default: true },
    hideCloseButton: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-modal'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryModal);
    }
  }

  #dialog: HTMLDialogElement | undefined;
  #titleEl: HTMLElement | undefined;
  #descriptionEl: HTMLElement | undefined;
  #closeButton: HTMLButtonElement | undefined;
  #titleId = '';
  #descId = '';
  // Suppress the `open` propertyChanged feedback loop when we flip the
  // property from inside the native close/show path.
  #applyingNativeState = false;

  override connected(): void {
    this.#dialog = this.refs['dialog'] as HTMLDialogElement | undefined;
    this.#titleEl = this.refs['title'] as HTMLElement | undefined;
    this.#descriptionEl = this.refs['description'] as HTMLElement | undefined;
    this.#closeButton = this.refs['closeButton'] as HTMLButtonElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#dialog) return;

    // Reflect the default size onto the host so selector-based styling +
    // introspection don't depend on whether size was explicitly set.
    if (!this.hasAttribute('size')) this.setAttribute('size', DEFAULT_SIZE);

    const id = ++nextId;
    this.#titleId = `foundry-modal-title-${id}`;
    this.#descId = `foundry-modal-desc-${id}`;
    if (this.#titleEl) this.#titleEl.id = this.#titleId;
    if (this.#descriptionEl) this.#descriptionEl.id = this.#descId;

    this.#dialog.addEventListener('close', this.#onDialogClose);
    this.#dialog.addEventListener('click', this.#onDialogClick);
    this.#closeButton?.addEventListener('click', this.#onCloseButtonClick);
    // Slotted <form method="dialog"> lives in the light DOM, so the browser
    // won't auto-close the shadow-scoped dialog on submit. Listen for the
    // submit event bubbling up to the host and close manually with the
    // submitter's value as returnValue — matches native semantics.
    this.addEventListener('submit', this.#onHostSubmit);

    this.#wireSlotChanges();
    this.#syncAriaLabels();

    // If `open` was set before connect, open now.
    if (this.readProperty('open')) this.#openNative();
  }

  override disconnected(): void {
    this.#dialog?.removeEventListener('close', this.#onDialogClose);
    this.#dialog?.removeEventListener('click', this.#onDialogClick);
    this.#closeButton?.removeEventListener('click', this.#onCloseButtonClick);
    this.removeEventListener('submit', this.#onHostSubmit);
    // If still open on teardown, close so we don't leak a top-layer dialog.
    if (this.#dialog?.open) this.#closeNative();
  }

  override propertyChanged(name: string): void {
    if (this.#applyingNativeState) return;
    if (name === 'open') {
      const shouldOpen = Boolean(this.readProperty('open'));
      if (shouldOpen && !this.#dialog?.open) this.#openNative();
      else if (!shouldOpen && this.#dialog?.open) this.#closeNative();
    }
  }

  /** Open the modal via the native `showModal()`. Idempotent. */
  show(): void {
    (this as unknown as { open: boolean }).open = true;
  }

  /**
   * Close the modal. Sets the dialog's `returnValue` if provided. Idempotent.
   */
  close(returnValue?: string): void {
    if (returnValue !== undefined && this.#dialog) {
      this.#dialog.returnValue = returnValue;
    }
    (this as unknown as { open: boolean }).open = false;
  }

  /** Proxies the native dialog's returnValue. */
  get returnValue(): string {
    return this.#dialog?.returnValue ?? '';
  }

  set returnValue(value: string) {
    if (this.#dialog) this.#dialog.returnValue = value;
  }

  #openNative(): void {
    const d = this.#dialog;
    /* v8 ignore next -- defensive; connected() guarantees #dialog */
    if (!d) return;
    // Reset the returnValue on every open so a stale value from the prior
    // close doesn't leak through.
    d.returnValue = '';
    const showModal = (d as HTMLDialogElement & { showModal?: () => void }).showModal;
    /* v8 ignore start -- jsdom lacks full dialog API support; real-browser
       behavior is verified by functional tests */
    if (typeof showModal === 'function') {
      try {
        showModal.call(d);
      } catch {
        /* already open */
      }
    }
    /* v8 ignore stop */
  }

  #closeNative(): void {
    const d = this.#dialog;
    /* v8 ignore next -- defensive; connected() guarantees #dialog */
    if (!d) return;
    const closeFn = (d as HTMLDialogElement & { close?: (v?: string) => void }).close;
    /* v8 ignore start -- jsdom partial implementation */
    if (typeof closeFn === 'function') {
      try {
        closeFn.call(d);
      } catch {
        /* already closed */
      }
    }
    /* v8 ignore stop */
  }

  #onDialogClose = (): void => {
    // The native close event fires after showModal()'s counterpart runs —
    // for form submit, Escape, or our close() call. Mirror the state,
    // then re-dispatch a bubbling+composed `close` from the host so
    // consumers outside the shadow tree can listen.
    this.#applyingNativeState = true;
    (this as unknown as { open: boolean }).open = false;
    this.#applyingNativeState = false;
    this.dispatchEvent(new CustomEvent('close', {
      bubbles: true,
      composed: true,
      detail: { returnValue: this.returnValue },
    }));
  };

  #onDialogClick = (event: MouseEvent): void => {
    // `popover="manual"`-style backdrop clicks fire on the dialog itself
    // (target === dialog). Inner content clicks bubble from descendants,
    // so target !== dialog. This is the documented native pattern.
    if (event.target !== this.#dialog) return;
    if (!this.readProperty('dismissOnBackdrop')) return;
    this.close('dismiss');
  };

  #onCloseButtonClick = (): void => {
    this.close();
  };

  #onHostSubmit = (event: SubmitEvent): void => {
    // Only hijack submits from a <form method="dialog">. Native form
    // submission with any other method should reach the network / consumer
    // handler unchanged.
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.method !== 'dialog') return;
    // Prevent the browser from navigating; the dialog close + returnValue
    // are what method="dialog" is supposed to do, but since the form
    // lives in the light DOM outside the <dialog>, the browser treats it
    // as a normal form submit.
    event.preventDefault();
    const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null;
    const value = submitter?.value ?? '';
    this.close(value);
  };

  #wireSlotChanges(): void {
    this.#wireSlot('titleSlot', 'has-title');
    this.#wireSlot('descriptionSlot', 'has-description');
    this.#wireSlot('footerSlot', 'has-footer');
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
      this.#syncAriaLabels();
    };
    slot.addEventListener('slotchange', sync);
    sync();
  }

  #syncAriaLabels(): void {
    /* v8 ignore next -- defensive; called only from sync paths after connect */
    if (!this.#dialog) return;
    const hasTitle = this.hasAttribute('has-title');
    const hasDescription = this.hasAttribute('has-description');
    if (hasTitle) this.#dialog.setAttribute('aria-labelledby', this.#titleId);
    else this.#dialog.removeAttribute('aria-labelledby');
    if (hasDescription) this.#dialog.setAttribute('aria-describedby', this.#descId);
    else this.#dialog.removeAttribute('aria-describedby');
  }
}
