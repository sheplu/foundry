import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './breadcrumb.template.html?raw';
import styleCss from './breadcrumb.css?inline';

/**
 * A single breadcrumb item. Intended as a child of `<foundry-breadcrumbs>`,
 * but works independently. The default slot takes the item's content —
 * usually a `<foundry-link>` or plain text when `current` is set.
 *
 * When `current` is true, the host gains `aria-current="page"` so assistive
 * technology announces this item as the current page, and the trailing
 * separator is hidden. The last item's separator is also hidden via
 * `:host(:last-of-type)` so trailing punctuation never shows.
 *
 * @element foundry-breadcrumb
 * @summary A single breadcrumb item with an optional separator.
 *
 * @attr {boolean} current - Marks this item as the current page.
 *   Reflects `aria-current="page"` on the host.
 *
 * Note: `has-separator` is an internal CSS hook the component sets based on
 * the `separator` slot's content. Not public API.
 *
 * @slot - The item content (link or plain text).
 * @slot separator - Optional custom separator. Defaults to `/`.
 *
 * @csspart item - The outer `<li>` element.
 * @csspart content - The wrapper around the default slot.
 * @csspart separator - The wrapper around the separator slot.
 *
 * @cssprop [--foundry-breadcrumb-separator-color] - Separator color.
 * @cssprop [--foundry-breadcrumb-separator-margin] - Space between content and separator.
 * @cssprop [--foundry-breadcrumb-current-color] - Content color when `current`.
 * @cssprop [--foundry-breadcrumb-current-font-weight] - Content weight when `current`.
 */
export class FoundryBreadcrumb extends FoundryElement {
  static override properties = {
    /** Marks this item as the current page. */
    current: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-breadcrumb'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryBreadcrumb);
    }
  }

  override connected(): void {
    // Axe can't see the inner <li> through the shadow DOM, so we advertise
    // `role="listitem"` on the host itself. The parent's <ol role="list">
    // + these role="listitem" hosts form a valid list to assistive tech.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listitem');
    this.#syncCurrent();
    this.#wireSeparatorSlot();
  }

  override propertyChanged(name: string): void {
    if (name === 'current') {
      this.#syncCurrent();
    }
  }

  #syncCurrent(): void {
    if (this.readProperty('current')) {
      this.setAttribute('aria-current', 'page');
    } else {
      this.removeAttribute('aria-current');
    }
  }

  #wireSeparatorSlot(): void {
    const slot = this.refs['separatorSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides the separator slot */
    if (!slot) return;
    const sync = (): void => {
      const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        /* v8 ignore next -- named slots only accept elements with slot=,
           so bare text nodes can never reach here in practice */
        return (n.textContent ?? '').trim().length > 0;
      });
      // When no assigned content, the default `/` fallback still renders —
      // so `has-separator` is true for both assigned and fallback cases
      // except when a consumer explicitly assigns an empty element.
      this.toggleAttribute('has-separator', hasContent || slot.children.length === 0);
    };
    slot.addEventListener('slotchange', sync);
    sync();
  }
}
