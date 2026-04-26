import { FoundryElement, createStylesheet, createTemplate } from '@foundry/elements';
import { FoundryIcon } from './foundry-icon.ts';
import templateHtml from './foundry-icon-button.template.html?raw';
import styleCss from './foundry-icon-button.css?inline';

const template = createTemplate(templateHtml);
const styles = createStylesheet(styleCss);

export type IconButtonVariant = 'primary' | 'secondary' | 'danger';
export type IconButtonType = 'button' | 'submit' | 'reset';

/**
 * Compact button showing a single registered icon. Composes a native `<button>`
 * with a `<foundry-icon>` inside. Because there is no visible text, `label` is
 * required — it becomes the accessible name on the inner native button.
 *
 * @element foundry-icon-button
 * @summary Icon-only action button.
 *
 * @attr {string} name - Name of the registered icon to render.
 * @attr {string} label - Accessible label for the button. Required for a11y.
 * @attr {'primary' | 'secondary' | 'danger'} variant - Visual variant. Defaults to `secondary`
 *   (neutral chrome) because icon-only buttons commonly live in toolbars.
 * @attr {boolean} disabled - Whether the button is disabled.
 * @attr {'button' | 'submit' | 'reset'} type - Native button type. Defaults to `button`.
 *
 * @csspart button - The inner native `<button>` element.
 * @csspart icon - The inner `<foundry-icon>` element.
 *
 * @cssprop [--foundry-icon-size=1.25rem] - Icon size inside the button.
 * @cssprop [--foundry-color-action-primary] - Primary variant background.
 * @cssprop [--foundry-color-action-danger] - Danger variant background.
 * @cssprop [--foundry-color-surface-subtle] - Secondary hover surface.
 * @cssprop [--foundry-radius-md] - Corner radius.
 */
export class FoundryIconButton extends FoundryElement {
  static override properties = {
    /** Registered icon name. */
    name: { type: String, reflect: true },
    /** Accessible label (required). Forwarded to the inner button's aria-label. */
    label: { type: String, reflect: true },
    /** Visual variant. Defaults to `secondary`. */
    variant: { type: String, reflect: true, default: 'secondary' satisfies IconButtonVariant },
    /** Whether the button is disabled. */
    disabled: { type: Boolean, reflect: true, default: false },
    /** Native button `type`. Defaults to `button`. */
    type: { type: String, reflect: true, default: 'button' satisfies IconButtonType },
  };

  static override template = template;
  static override styles = styles;
  static override delegatesFocus = true;

  static define(tag = 'foundry-icon-button'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryIconButton);
      FoundryIcon.define();
    }
  }

  override connected(): void {
    this.#syncInner();
  }

  override propertyChanged(name: string): void {
    if (name === 'disabled' || name === 'type' || name === 'label' || name === 'name') {
      this.#syncInner();
    }
  }

  #syncInner(): void {
    const inner = this.refs['inner'] as HTMLButtonElement | undefined;
    const icon = this.refs['icon'] as HTMLElement | undefined;
    if (!inner || !icon) return;

    inner.disabled = Boolean(this._getProperty('disabled'));
    inner.type = this._getProperty('type') as IconButtonType;

    const label = this._getProperty('label') as string | undefined;
    if (label) {
      inner.setAttribute('aria-label', label);
    } else {
      inner.removeAttribute('aria-label');
    }

    const name = this._getProperty('name') as string | undefined;
    if (name) {
      icon.setAttribute('name', name);
    } else {
      icon.removeAttribute('name');
    }
  }
}
