import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './option.template.html?raw';
import styleCss from './option.css?inline';

/**
 * A single selectable option. Intended as a child of `<foundry-select>`,
 * but works independently. Carries a `value` (the submitted data) and a
 * trimmed `textContent` (the visible label). The parent `<foundry-select>`
 * toggles `selected` when its own `value` matches this option.
 *
 * In Phase 1 of `<foundry-select>`, options are inert — they render as list
 * rows inside the listbox surface but the listbox never opens. Phase 2 will
 * wire click-to-select + keyboard navigation and add `:host([selected])` /
 * `:host([active])` styling hooks.
 *
 * @element foundry-option
 * @summary A selectable item inside a `<foundry-select>` listbox.
 *
 * @attr {string} value - The option's submitted value. Defaults to the
 *   trimmed `textContent` when omitted.
 * @attr {boolean} disabled - Reflected. Disabled options can't be selected.
 * @attr {boolean} selected - Reflected. Managed by the parent select; not
 *   meant for consumer writes.
 *
 * @slot - The option's label content.
 *
 * @csspart option - The item container.
 */
export class FoundryOption extends FoundryElement {
  static override properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true, default: false },
    selected: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-option'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryOption);
    }
  }

  override connected(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'option');
    this.#syncAriaSelected();
    this.#syncAriaDisabled();
  }

  override propertyChanged(name: string): void {
    if (name === 'selected') this.#syncAriaSelected();
    else if (name === 'disabled') this.#syncAriaDisabled();
  }

  /**
   * The option's submitted value: the `value` attribute when set, otherwise
   * the trimmed `textContent`. Used by the parent `<foundry-select>` to
   * resolve a matching option when its own `value` changes.
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
}
