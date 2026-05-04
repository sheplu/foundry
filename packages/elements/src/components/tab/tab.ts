import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './tab.template.html?raw';
import styleCss from './tab.css?inline';

/**
 * A single tab in a tablist. Intended as a child of `<foundry-tabs>`, but
 * works independently. Carries a `value` (the identifier used to resolve
 * which panel this tab activates) and a visible label via slotted content.
 * The parent `<foundry-tabs>` toggles `selected` when its own `value`
 * matches this tab.
 *
 * Auto-pairs with a `<foundry-panel>` at the same index by default; the
 * parent generates stable IDs and wires `aria-controls` / `aria-labelledby`
 * so the tab and its matching panel cross-reference each other.
 *
 * @element foundry-tab
 * @summary A tab in a `<foundry-tabs>` tablist.
 *
 * @attr {string} value - The tab's identifier. Defaults to the trimmed
 *   `textContent` when omitted.
 * @attr {boolean} disabled - Reflected. Disabled tabs can't be activated;
 *   arrow-key navigation skips them.
 * @attr {boolean} selected - Reflected. Managed by the parent tabs; not
 *   meant for consumer writes.
 *
 * @slot - The tab's label content.
 *
 * @csspart tab - The clickable tab container.
 *
 * @cssprop [--foundry-tab-padding] - Inner padding.
 * @cssprop [--foundry-tab-color] - Idle label color.
 * @cssprop [--foundry-tab-color-selected] - Selected label color.
 * @cssprop [--foundry-tab-color-hover] - Hover label color.
 * @cssprop [--foundry-tab-color-disabled] - Disabled label color.
 * @cssprop [--foundry-tab-background-selected] - Selected background.
 * @cssprop [--foundry-tab-indicator-color] - Active-indicator color.
 * @cssprop [--foundry-tab-indicator-size] - Active-indicator thickness.
 * @cssprop [--foundry-tab-focus-outline] - Focus ring color.
 * @cssprop [--foundry-tab-font-weight] - Idle font weight.
 * @cssprop [--foundry-tab-font-weight-selected] - Selected font weight.
 */
export class FoundryTab extends FoundryElement {
  static override properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true, default: false },
    selected: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-tab'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTab);
    }
  }

  override connected(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tab');
    this.#syncAriaSelected();
    this.#syncAriaDisabled();
    this.#syncTabindex();
  }

  override propertyChanged(name: string): void {
    if (name === 'selected') {
      this.#syncAriaSelected();
      this.#syncTabindex();
    } else if (name === 'disabled') {
      this.#syncAriaDisabled();
    }
  }

  /**
   * The tab's identifier: the `value` attribute when set, otherwise the
   * trimmed `textContent`. Used by the parent `<foundry-tabs>` to resolve
   * a matching tab when its own `value` changes.
   */
  get resolvedValue(): string {
    const v = this.readProperty('value');
    if (typeof v === 'string') return v;
    return (this.textContent ?? '').trim();
  }

  #syncAriaSelected(): void {
    this.setAttribute('aria-selected', this.readProperty('selected') ? 'true' : 'false');
  }

  #syncAriaDisabled(): void {
    if (this.readProperty('disabled')) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
  }

  // Roving tabindex: only the selected tab is in the Tab order. The parent
  // <foundry-tabs> manages focus movement via Arrow keys.
  #syncTabindex(): void {
    this.tabIndex = this.readProperty('selected') ? 0 : -1;
  }
}
