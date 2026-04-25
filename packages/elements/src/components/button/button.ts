import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './button.template.html?raw';
import styleCss from './button.css?inline';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A native button styled by the foundry design system. Wraps a `<button>`
 * inside an open shadow root; keyboard, focus, and form semantics are inherited
 * from the native element.
 *
 * @element foundry-button
 * @summary Themable button action element.
 *
 * @attr {'primary' | 'secondary' | 'danger'} variant - Visual variant. Defaults to `primary`.
 * @attr {boolean} disabled - Whether the button is disabled. Forwarded to the inner `<button>`.
 * @attr {'button' | 'submit' | 'reset'} type - Native button type. Defaults to `button`.
 *
 * @slot - Default slot for the button label.
 * @csspart button - The inner `<button>` element.
 *
 * @cssprop [--foundry-color-action-primary] - Background color of the primary variant.
 * @cssprop [--foundry-color-action-primary-hover] - Background when hovering the primary variant.
 * @cssprop [--foundry-color-action-primary-active] - Background when activating primary.
 * @cssprop [--foundry-color-action-primary-disabled] - Background when disabled.
 * @cssprop [--foundry-color-action-danger] - Background color of the danger variant.
 * @cssprop [--foundry-color-action-danger-hover] - Background when hovering the danger variant.
 * @cssprop [--foundry-color-surface-subtle] - Background color of the secondary variant.
 * @cssprop [--foundry-color-text-inverse] - Foreground color for primary and danger variants.
 * @cssprop [--foundry-color-text-body] - Foreground color for the secondary variant.
 * @cssprop [--foundry-space-inset-sm] - Block padding.
 * @cssprop [--foundry-space-inset-md] - Inline padding.
 * @cssprop [--foundry-radius-md] - Corner radius.
 */
export class FoundryButton extends FoundryElement {
  static override properties = {
    /** Visual variant: `primary` (default), `secondary`, or `danger`. */
    variant: { type: String, reflect: true, default: 'primary' satisfies ButtonVariant },
    /** Whether the button is disabled. Forwarded to the inner native `<button>`. */
    disabled: { type: Boolean, reflect: true, default: false },
    /** Native button `type`: `button` (default), `submit`, or `reset`. */
    type: { type: String, reflect: true, default: 'button' satisfies ButtonType },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-button'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryButton);
    }
  }

  override connected(): void {
    this.#syncInner();
  }

  override propertyChanged(name: string): void {
    if (name === 'disabled' || name === 'type') {
      this.#syncInner();
    }
  }

  #syncInner(): void {
    const inner = this.refs['inner'] as HTMLButtonElement | undefined;
    if (!inner) return;
    inner.disabled = Boolean(this._getProperty('disabled'));
    inner.type = this._getProperty('type') as ButtonType;
  }
}
