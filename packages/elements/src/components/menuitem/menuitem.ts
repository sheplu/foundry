import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './menuitem.template.html?raw';
import styleCss from './menuitem.css?inline';

/**
 * A single action item inside a `<foundry-menu>`. Dispatches actions, not
 * values — menuitems have no "selected" state (contrast with
 * `<foundry-option>` which carries `selected` as persistent form state).
 *
 * Ships three slots aligned on a CSS grid so mixed-content rows stay
 * visually consistent:
 *  - `icon` — optional leading icon.
 *  - default — the label.
 *  - `shortcut` — optional right-aligned keyboard hint (purely visual;
 *    the menu does NOT intercept global keystrokes).
 *
 * The parent `<foundry-menu>` toggles `active` when the keyboard or
 * pointer highlights this item.
 *
 * @element foundry-menuitem
 * @summary A single action item in a `<foundry-menu>`.
 *
 * @attr {string} value - Identifier surfaced in the menu's `select` event.
 *   Defaults to the trimmed default-slot text.
 * @attr {boolean} disabled - Reflected. Disabled items are keyboard-skipped
 *   and click-inert.
 * @attr {boolean} active - Reflected. Managed by the parent menu; drives
 *   the keyboard/pointer highlight.
 *
 * @slot - The item's label.
 * @slot icon - Optional leading icon.
 * @slot shortcut - Optional right-aligned keyboard-shortcut hint.
 *
 * @csspart item - The item container (grid: icon | label | shortcut).
 * @csspart icon - The leading-icon wrapper.
 * @csspart label - The default-slot wrapper.
 * @csspart shortcut - The shortcut wrapper.
 *
 * @cssprop [--foundry-menuitem-padding] - Inner padding.
 * @cssprop [--foundry-menuitem-gap] - Gap between icon, label, shortcut.
 * @cssprop [--foundry-menuitem-color] - Idle foreground.
 * @cssprop [--foundry-menuitem-color-disabled] - Disabled foreground.
 * @cssprop [--foundry-menuitem-background-active] - Active background.
 * @cssprop [--foundry-menuitem-shortcut-color] - Shortcut text color.
 * @cssprop [--foundry-menuitem-icon-size] - Icon sizing.
 * @cssprop [--foundry-menuitem-radius] - Item corner radius.
 */
export class FoundryMenuitem extends FoundryElement {
  static override properties = {
    value: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true, default: false },
    active: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-menuitem'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryMenuitem);
    }
  }

  override connected(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'menuitem');
    this.#syncAriaDisabled();
    this.#wireSlot('iconSlot', 'has-icon');
    this.#wireSlot('shortcutSlot', 'has-shortcut');
  }

  override propertyChanged(name: string): void {
    if (name === 'disabled') this.#syncAriaDisabled();
  }

  /**
   * The item's identifier: the `value` attribute when set, otherwise the
   * trimmed default-slot text.
   */
  get resolvedValue(): string {
    const v = this.readProperty('value');
    if (typeof v === 'string') return v;
    return (this.textContent ?? '').trim();
  }

  #syncAriaDisabled(): void {
    if (this.readProperty('disabled')) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
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
    };
    slot.addEventListener('slotchange', sync);
    sync();
  }
}
