import { FoundryElement, FoundrySpinner, createStylesheet, createTemplate } from '@foundry/elements';
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
 * When `loading` is set, the icon is hidden and a `<foundry-spinner>` of the
 * same size takes its place. The inner native button is forced `disabled`
 * (suppressing clicks) and exposes `aria-busy="true"` for assistive tech.
 * The accessible name is unchanged — it continues to come from `label`.
 *
 * @element foundry-icon-button
 * @summary Icon-only action button.
 *
 * @attr {string} name - Name of the registered icon to render.
 * @attr {string} label - Accessible label for the button. Required for a11y.
 * @attr {'primary' | 'secondary' | 'danger'} variant - Visual variant. Defaults to `secondary`
 *   (neutral chrome) because icon-only buttons commonly live in toolbars.
 * @attr {boolean} disabled - Whether the button is disabled.
 * @attr {boolean} loading - Whether the button is in a loading state. When
 *   true, a spinner replaces the icon, clicks are suppressed, and the inner
 *   button exposes `aria-busy="true"`.
 * @attr {'button' | 'submit' | 'reset'} type - Native button type. Defaults to `button`.
 *
 * @csspart button - The inner native `<button>` element.
 * @csspart icon - The inner `<foundry-icon>` element.
 * @csspart spinner - The inner `<foundry-spinner>` shown while `loading`.
 *
 * @cssprop [--foundry-icon-button-background] - Default (secondary/neutral) background.
 * @cssprop [--foundry-icon-button-background-hover] - Hover background.
 * @cssprop [--foundry-icon-button-background-active] - Active background.
 * @cssprop [--foundry-icon-button-background-disabled] - Disabled background.
 * @cssprop [--foundry-icon-button-background-primary] - Primary variant background.
 * @cssprop [--foundry-icon-button-background-primary-hover] - Primary hover background.
 * @cssprop [--foundry-icon-button-background-primary-active] - Primary active background.
 * @cssprop [--foundry-icon-button-background-danger] - Danger variant background.
 * @cssprop [--foundry-icon-button-background-danger-hover] - Danger hover background.
 * @cssprop [--foundry-icon-button-background-danger-active] - Danger active background.
 * @cssprop [--foundry-icon-button-foreground] - Default foreground color.
 * @cssprop [--foundry-icon-button-foreground-primary] - Foreground for primary variant.
 * @cssprop [--foundry-icon-button-foreground-danger] - Foreground for danger variant.
 * @cssprop [--foundry-icon-button-foreground-disabled] - Foreground when disabled.
 * @cssprop [--foundry-icon-button-padding] - Padding inside the button.
 * @cssprop [--foundry-icon-button-radius] - Corner radius.
 * @cssprop [--foundry-icon-button-focus-outline] - Focus outline color.
 * @cssprop [--foundry-icon-button-icon-size=1.25rem] - Size of the rendered icon.
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
    /** Whether the button is in a loading state. */
    loading: { type: Boolean, reflect: true, default: false },
    /** Native button `type`. Defaults to `button`. */
    type: { type: String, reflect: true, default: 'button' satisfies IconButtonType },
  };

  static override template = template;
  static override styles = styles;
  static override delegatesFocus = true;

  static define(tag = 'foundry-icon-button'): void {
    // Ensure the nested icon + spinner are registered too — consumers get a
    // working loading state without a separate FoundrySpinner.define() call.
    FoundryIcon.define();
    FoundrySpinner.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryIconButton);
    }
  }

  override connected(): void {
    this.#syncInner();
  }

  override propertyChanged(name: string): void {
    if (
      name === 'disabled'
      || name === 'type'
      || name === 'label'
      || name === 'name'
      || name === 'loading'
    ) {
      this.#syncInner();
    }
  }

  #syncInner(): void {
    const inner = this.refs['inner'] as HTMLButtonElement | undefined;
    const icon = this.refs['icon'] as HTMLElement | undefined;
    if (!inner || !icon) return;

    const loading = Boolean(this.readProperty('loading'));
    // Loading forces the native button disabled so clicks are suppressed.
    // Host's own [disabled] attribute still wins when set.
    inner.disabled = Boolean(this.readProperty('disabled')) || loading;
    inner.type = this.readProperty('type') as IconButtonType;
    if (loading) {
      inner.setAttribute('aria-busy', 'true');
    } else {
      inner.removeAttribute('aria-busy');
    }

    const label = this.readProperty('label') as string | undefined;
    if (label) {
      inner.setAttribute('aria-label', label);
    } else {
      inner.removeAttribute('aria-label');
    }

    const name = this.readProperty('name') as string | undefined;
    if (name) {
      icon.setAttribute('name', name);
    } else {
      icon.removeAttribute('name');
    }
  }
}
