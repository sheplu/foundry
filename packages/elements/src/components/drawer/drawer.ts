import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './drawer.template.html?raw';
import styleCss from './drawer.css?inline';

export type DrawerPlacement = 'start' | 'end' | 'top' | 'bottom';

const DEFAULT_PLACEMENT: DrawerPlacement = 'end';

let nextId = 0;

/**
 * Side-anchored overlay dialog — a.k.a. Sheet / Offcanvas. Wraps a native
 * `<dialog>` for the same reasons as `<foundry-modal>`: top-layer hoisting,
 * modal focus containment, inert background, and `::backdrop`. The difference
 * is the geometry: instead of centering, the dialog pins to an edge
 * (`placement="start" | "end" | "top" | "bottom"`) and slides into view.
 *
 * The triple-dismiss model, slotted header/body/footer, form-close
 * integration, and event surface mirror `<foundry-modal>` exactly — so
 * consumers already familiar with the modal API can adopt drawers with no
 * re-learning.
 *
 * @element foundry-drawer
 * @summary Side-anchored dialog (drawer / sheet) backed by native `<dialog>`.
 *
 * @attr {boolean} open - Reflected. Tracks dialog open state.
 * @attr {'start' | 'end' | 'top' | 'bottom'} placement - Which edge the
 *   drawer anchors to. Defaults to `end` (right side in LTR, left in RTL).
 *   Reflects.
 * @attr {boolean} dismiss-on-backdrop - When `true` (default), clicking
 *   outside the drawer body closes it with `returnValue='dismiss'`.
 * @attr {boolean} hide-close-button - Hides the built-in close button.
 *
 * @slot title - Drawer heading; wired via `aria-labelledby`.
 * @slot description - Optional subheading; wired via `aria-describedby`.
 * @slot - Default slot. Main body content.
 * @slot footer - Optional action row.
 *
 * @csspart dialog - The native `<dialog>` element.
 * @csspart header - Title + description + close button row.
 * @csspart title - Title wrapper.
 * @csspart description - Description wrapper.
 * @csspart close-button - Built-in X close button.
 * @csspart close-icon - Icon inside the close button.
 * @csspart body - Default-slot container.
 * @csspart footer - Footer slot container.
 *
 * @fires close - Bubbles + composed. `event.detail.returnValue` mirrors the
 *   dialog's returnValue.
 *
 * @cssprop [--foundry-drawer-inline-size] - Drawer width for start/end placements.
 * @cssprop [--foundry-drawer-block-size] - Drawer height for top/bottom placements.
 * @cssprop [--foundry-drawer-background] - Surface color.
 * @cssprop [--foundry-drawer-foreground] - Text color.
 * @cssprop [--foundry-drawer-shadow] - Drop shadow.
 * @cssprop [--foundry-drawer-backdrop] - `::backdrop` color.
 * @cssprop [--foundry-drawer-padding] - Inner padding.
 * @cssprop [--foundry-drawer-duration] - Slide-in animation duration.
 * @cssprop [--foundry-drawer-focus-outline] - Focus ring color.
 * @cssprop [--foundry-drawer-description-foreground] - Description text color.
 * @cssprop [--foundry-drawer-close-foreground] - Close-button icon color.
 */
export class FoundryDrawer extends FoundryElement {
  static override properties = {
    open: { type: Boolean, reflect: true, default: false },
    placement: {
      type: String,
      reflect: true,
      default: DEFAULT_PLACEMENT satisfies DrawerPlacement,
    },
    dismissOnBackdrop: { type: Boolean, reflect: true, default: true },
    hideCloseButton: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-drawer'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryDrawer);
    }
  }

  #dialog: HTMLDialogElement | undefined;
  #titleEl: HTMLElement | undefined;
  #descriptionEl: HTMLElement | undefined;
  #closeButton: HTMLButtonElement | undefined;
  #titleId = '';
  #descId = '';
  #applyingNativeState = false;

  override connected(): void {
    this.#dialog = this.refs['dialog'] as HTMLDialogElement | undefined;
    this.#titleEl = this.refs['title'] as HTMLElement | undefined;
    this.#descriptionEl = this.refs['description'] as HTMLElement | undefined;
    this.#closeButton = this.refs['closeButton'] as HTMLButtonElement | undefined;
    /* v8 ignore next -- defensive; template always provides the refs */
    if (!this.#dialog) return;

    if (!this.hasAttribute('placement')) {
      this.setAttribute('placement', DEFAULT_PLACEMENT);
    }

    const id = ++nextId;
    this.#titleId = `foundry-drawer-title-${id}`;
    this.#descId = `foundry-drawer-desc-${id}`;
    if (this.#titleEl) this.#titleEl.id = this.#titleId;
    if (this.#descriptionEl) this.#descriptionEl.id = this.#descId;

    this.#dialog.addEventListener('close', this.#onDialogClose);
    this.#dialog.addEventListener('click', this.#onDialogClick);
    this.#closeButton?.addEventListener('click', this.#onCloseButtonClick);
    this.addEventListener('submit', this.#onHostSubmit);

    this.#wireSlotChanges();
    this.#syncAriaLabels();

    if (this.readProperty('open')) this.#openNative();
  }

  override disconnected(): void {
    this.#dialog?.removeEventListener('close', this.#onDialogClose);
    this.#dialog?.removeEventListener('click', this.#onDialogClick);
    this.#closeButton?.removeEventListener('click', this.#onCloseButtonClick);
    this.removeEventListener('submit', this.#onHostSubmit);
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

  /** Open the drawer via the native `showModal()`. Idempotent. */
  show(): void {
    (this as unknown as { open: boolean }).open = true;
  }

  /**
   * Close the drawer. Sets the dialog's `returnValue` if provided. Idempotent.
   */
  close(returnValue?: string): void {
    if (returnValue !== undefined && this.#dialog) {
      this.#dialog.returnValue = returnValue;
    }
    (this as unknown as { open: boolean }).open = false;
  }

  /** Proxies the native dialog's returnValue. */
  get returnValue(): string {
    /* v8 ignore next -- defensive; #dialog is always set after connect */
    return this.#dialog?.returnValue ?? '';
  }

  set returnValue(value: string) {
    /* v8 ignore next -- defensive; #dialog is always set after connect */
    if (this.#dialog) this.#dialog.returnValue = value;
  }

  #openNative(): void {
    const d = this.#dialog;
    /* v8 ignore next -- defensive; connected() guarantees #dialog */
    if (!d) return;
    d.returnValue = '';
    const showModal = (d as HTMLDialogElement & { showModal?: () => void }).showModal;
    /* v8 ignore start -- jsdom lacks full dialog API support; functional tests verify */
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
    if (event.target !== this.#dialog) return;
    if (!this.readProperty('dismissOnBackdrop')) return;
    this.close('dismiss');
  };

  #onCloseButtonClick = (): void => {
    this.close();
  };

  #onHostSubmit = (event: SubmitEvent): void => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.method !== 'dialog') return;
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
    /* v8 ignore next -- defensive; template always provides the slot refs */
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
