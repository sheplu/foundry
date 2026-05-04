import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './details.template.html?raw';
import styleCss from './details.css?inline';

/**
 * Themable disclosure wrapper around the native `<details>` / `<summary>`
 * elements. The browser handles expand/collapse toggling, keyboard
 * (Enter / Space on the summary), the `open` attribute, the `toggle`
 * event, focus semantics, and screen-reader announcements for free. This
 * component adds:
 *
 * - Consistent theming via CSS parts + custom properties.
 * - A chevron that rotates 180° on open, with `prefers-reduced-motion`
 *   halting the transition.
 * - A `disabled` attribute that blocks click + keyboard interaction and
 *   rejects programmatic `open` writes.
 * - A `value` attribute + `resolvedValue` getter used by
 *   `<foundry-accordion>` to report which items are open.
 *
 * The host `open` attribute is two-way synced with the native
 * `<details>` via the browser's `toggle` event.
 *
 * @element foundry-details
 * @summary Themable disclosure (expand/collapse) built on native `<details>`.
 *
 * @attr {string} value - Identifier surfaced in the accordion's change
 *   event. Defaults to the trimmed `summary`-slot text.
 * @attr {boolean} open - Reflected. Tracks the native details open state.
 * @attr {boolean} disabled - Reflected. Blocks summary interaction and
 *   rejects `open` writes when true.
 *
 * @slot summary - The clickable title. Rendered inside the native `<summary>`.
 * @slot - The disclosure body.
 *
 * @csspart details - The native `<details>` element.
 * @csspart summary - The native `<summary>` wrapper.
 * @csspart label - The summary-slot wrapper.
 * @csspart caret - The chevron icon.
 * @csspart body - The body-slot wrapper.
 *
 * @cssprop [--foundry-details-padding] - Body inner padding.
 * @cssprop [--foundry-details-border-color] - Surface border color.
 * @cssprop [--foundry-details-border-width] - Surface border width.
 * @cssprop [--foundry-details-radius] - Surface corner radius.
 * @cssprop [--foundry-details-background] - Surface background.
 * @cssprop [--foundry-details-foreground] - Surface text color.
 * @cssprop [--foundry-details-summary-padding] - Summary padding.
 * @cssprop [--foundry-details-summary-gap] - Gap between label and caret.
 * @cssprop [--foundry-details-summary-background] - Summary background.
 * @cssprop [--foundry-details-summary-background-hover] - Summary hover.
 * @cssprop [--foundry-details-summary-font-weight] - Summary font weight.
 * @cssprop [--foundry-details-caret-size] - Chevron dimensions.
 * @cssprop [--foundry-details-caret-color] - Chevron color.
 * @cssprop [--foundry-details-caret-transition] - Chevron rotation duration.
 * @cssprop [--foundry-details-focus-outline] - Summary focus ring color.
 * @cssprop [--foundry-details-color-disabled] - Foreground when disabled.
 */
export class FoundryDetails extends FoundryElement {
  static override properties = {
    value: { type: String, reflect: true },
    open: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-details'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryDetails);
    }
  }

  #details: HTMLDetailsElement | undefined;
  #summary: HTMLElement | undefined;
  // Suppress the feedback loop when a native toggle syncs the host or vice versa.
  #applyingNativeState = false;

  override connected(): void {
    this.#details = this.refs['details'] as HTMLDetailsElement | undefined;
    this.#summary = this.refs['summary'] as HTMLElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#details || !this.#summary) return;

    this.#details.addEventListener('toggle', this.#onNativeToggle);
    this.#summary.addEventListener('click', this.#onSummaryClick, true);
    this.#summary.addEventListener('keydown', this.#onSummaryKeydown, true);

    this.#syncDisabled();
    // Reflect an initial `open` attribute onto the native element.
    const initial = Boolean(this.readProperty('open'));
    if (initial && !this.#details.open) this.#openNative();
  }

  override disconnected(): void {
    this.#details?.removeEventListener('toggle', this.#onNativeToggle);
    this.#summary?.removeEventListener('click', this.#onSummaryClick, true);
    this.#summary?.removeEventListener('keydown', this.#onSummaryKeydown, true);
  }

  override propertyChanged(name: string): void {
    if (this.#applyingNativeState) return;
    if (name === 'open') {
      if (this.readProperty('disabled')) {
        // Disabled components reject open writes — revert immediately.
        const reverted = !this.readProperty('open');
        this.#applyingNativeState = true;
        (this as unknown as { open: boolean }).open = reverted;
        this.#applyingNativeState = false;
        return;
      }
      const shouldOpen = Boolean(this.readProperty('open'));
      const nativeOpen = Boolean(this.#details?.open);
      if (shouldOpen && !nativeOpen) this.#openNative();
      else if (!shouldOpen && nativeOpen) this.#closeNative();
    } else if (name === 'disabled') {
      this.#syncDisabled();
    }
  }

  /**
   * The details' identifier: the `value` attribute when set, otherwise the
   * trimmed summary slot text.
   */
  get resolvedValue(): string {
    const v = this.readProperty('value');
    if (typeof v === 'string') return v;
    const slot = this.refs['summarySlot'] as HTMLSlotElement | undefined;
    if (!slot) return '';
    const nodes = slot.assignedNodes({ flatten: true });
    const text = nodes.map((n) => n.textContent ?? '').join('');
    return text.trim();
  }

  #openNative(): void {
    if (!this.#details) return;
    this.#applyingNativeState = true;
    this.#details.open = true;
    this.#applyingNativeState = false;
  }

  #closeNative(): void {
    if (!this.#details) return;
    this.#applyingNativeState = true;
    this.#details.open = false;
    this.#applyingNativeState = false;
  }

  #onNativeToggle = (): void => {
    /* v8 ignore next -- defensive; listener only runs after connect */
    if (!this.#details) return;
    // Native toggle fires after open actually flipped. Mirror back to host.
    const native = this.#details.open;
    if (Boolean(this.readProperty('open')) !== native) {
      this.#applyingNativeState = true;
      (this as unknown as { open: boolean }).open = native;
      this.#applyingNativeState = false;
    }
    // Native <details> toggle events don't cross the shadow boundary
    // (they're not `composed`). Re-dispatch a composed toggle from the
    // host so a parent <foundry-accordion> can coordinate group state.
    this.dispatchEvent(new Event('toggle', { bubbles: true, composed: true }));
  };

  // Intercept summary clicks when disabled. CSS pointer-events: none
  // handles most of this, but authors may overlay another element; belt
  // and suspenders via a capturing listener.
  #onSummaryClick = (event: MouseEvent): void => {
    if (this.readProperty('disabled')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  #onSummaryKeydown = (event: KeyboardEvent): void => {
    if (!this.readProperty('disabled')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  #syncDisabled(): void {
    if (!this.#summary) return;
    if (this.readProperty('disabled')) {
      this.#summary.setAttribute('aria-disabled', 'true');
    } else {
      this.#summary.removeAttribute('aria-disabled');
    }
  }
}
