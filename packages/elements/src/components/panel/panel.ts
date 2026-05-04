import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './panel.template.html?raw';
import styleCss from './panel.css?inline';

/**
 * A single tab panel. Intended as a child of `<foundry-tabs>`, auto-paired
 * with a `<foundry-tab>` at the same index. Renders its slotted content
 * when `selected` is true; hidden otherwise.
 *
 * The parent `<foundry-tabs>` wires `aria-labelledby` to the matching
 * tab's ID so assistive tech announces "{tab-label}, tab panel" when the
 * panel receives focus.
 *
 * @element foundry-panel
 * @summary A tab panel paired with a `<foundry-tab>` at the same index.
 *
 * @attr {boolean} selected - Reflected. Managed by the parent tabs; not
 *   meant for consumer writes. Controls visibility + `aria-hidden`.
 *
 * @slot - The panel's content.
 *
 * @csspart panel - The panel container.
 *
 * @cssprop [--foundry-panel-padding] - Inner padding.
 */
export class FoundryPanel extends FoundryElement {
  static override properties = {
    selected: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-panel'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryPanel);
    }
  }

  override connected(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'tabpanel');
    // Panels are focusable per WAI-ARIA APG so keyboard users can Tab from
    // the active tab directly into the panel content.
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this.#syncAriaHidden();
  }

  override propertyChanged(name: string): void {
    if (name === 'selected') this.#syncAriaHidden();
  }

  #syncAriaHidden(): void {
    const visible = Boolean(this.readProperty('selected'));
    if (visible) this.removeAttribute('aria-hidden');
    else this.setAttribute('aria-hidden', 'true');
  }
}
