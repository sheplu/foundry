import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundrySpinner } from '../spinner/spinner.ts';
import templateHtml from './button.template.html?raw';
import styleCss from './button.css?inline';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A native button styled by the foundry design system. Wraps a `<button>`
 * inside an open shadow root; keyboard, focus, and form semantics are inherited
 * from the native element.
 *
 * When `loading` is set, the button renders a centered `<foundry-spinner>`
 * over its label, forces the inner native button disabled (so clicks are
 * suppressed), and sets `aria-busy="true"` for assistive tech. The label
 * stays in the DOM (visually hidden only) so the button's width doesn't jump.
 *
 * @element foundry-button
 * @summary Themable button action element.
 *
 * @attr {'primary' | 'secondary' | 'danger'} variant - Visual variant. Defaults to `primary`.
 * @attr {boolean} disabled - Whether the button is disabled. Forwarded to the inner `<button>`.
 * @attr {boolean} loading - Whether the button is in a loading state. When
 *   true, a spinner overlays the label, clicks are suppressed, and the inner
 *   button exposes `aria-busy="true"`.
 * @attr {'button' | 'submit' | 'reset'} type - Native button type. Defaults to `button`.
 *
 * @slot - Default slot for the button label.
 * @csspart button - The inner `<button>` element.
 * @csspart label - The span wrapping the slotted label.
 * @csspart spinner - The absolutely-positioned spinner overlay (only rendered when `loading`).
 *
 * @cssprop [--foundry-button-background] - Background color of the default (primary) variant.
 * @cssprop [--foundry-button-background-hover] - Background when hovering the primary variant.
 * @cssprop [--foundry-button-background-active] - Background when activating the primary variant.
 * @cssprop [--foundry-button-background-disabled] - Background when disabled.
 * @cssprop [--foundry-button-background-secondary] - Background for the secondary variant.
 * @cssprop [--foundry-button-background-secondary-hover] - Secondary hover background.
 * @cssprop [--foundry-button-background-secondary-active] - Secondary active background.
 * @cssprop [--foundry-button-background-danger] - Background for the danger variant.
 * @cssprop [--foundry-button-background-danger-hover] - Danger hover background.
 * @cssprop [--foundry-button-background-danger-active] - Danger active background.
 * @cssprop [--foundry-button-foreground] - Foreground color for primary and danger variants.
 * @cssprop [--foundry-button-foreground-secondary] - Foreground for the secondary variant.
 * @cssprop [--foundry-button-padding-block] - Block padding.
 * @cssprop [--foundry-button-padding-inline] - Inline padding.
 * @cssprop [--foundry-button-radius] - Corner radius.
 * @cssprop [--foundry-button-focus-outline] - Focus outline color.
 */
export class FoundryButton extends FoundryElement {
  static override properties = {
    /** Visual variant: `primary` (default), `secondary`, or `danger`. */
    variant: { type: String, reflect: true, default: 'primary' satisfies ButtonVariant },
    /** Whether the button is disabled. Forwarded to the inner native `<button>`. */
    disabled: { type: Boolean, reflect: true, default: false },
    /** Whether the button is in a loading state. */
    loading: { type: Boolean, reflect: true, default: false },
    /** Native button `type`: `button` (default), `submit`, or `reset`. */
    type: { type: String, reflect: true, default: 'button' satisfies ButtonType },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-button'): void {
    // Ensure the nested spinner is registered too — consumers get a working
    // loading state without a separate FoundrySpinner.define() call.
    FoundrySpinner.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryButton);
    }
  }

  override connected(): void {
    this.#syncInner();
  }

  override propertyChanged(name: string): void {
    if (name === 'disabled' || name === 'type' || name === 'loading') {
      this.#syncInner();
    }
  }

  #syncInner(): void {
    const inner = this.refs['inner'] as HTMLButtonElement | undefined;
    /* v8 ignore next -- defensive; template always provides the inner button */
    if (!inner) return;
    const loading = Boolean(this.readProperty('loading'));
    // Loading forces the native button disabled so clicks are suppressed.
    // Hosts's own [disabled] attribute still wins when set.
    inner.disabled = Boolean(this.readProperty('disabled')) || loading;
    inner.type = this.readProperty('type') as ButtonType;
    if (loading) {
      inner.setAttribute('aria-busy', 'true');
    } else {
      inner.removeAttribute('aria-busy');
    }
  }
}
