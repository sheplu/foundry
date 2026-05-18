import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './thead.template.html?raw';
import styleCss from './thead.css?inline';

/**
 * Table header section. Wraps slotted `<foundry-tr>` rows in a native
 * `<thead>` so the browser + assistive tech see a real table-section
 * element (better than CSS `display: table-header-group` workarounds for
 * row spanning, "next-column" navigation, and section announcements).
 *
 * The host carries `display: contents` so the inner native element
 * participates directly in the parent `<foundry-table>`'s table layout.
 *
 * @element foundry-thead
 * @summary Table header section, wraps slotted rows in a native `<thead>`.
 *
 * @slot - `<foundry-tr>` children whose cells are header cells.
 *
 * @csspart thead - The inner native `<thead>` element.
 *
 * @cssprop [--foundry-table-header-background] - Background color of the
 *   header section.
 */
export class FoundryThead extends FoundryElement {
  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-thead'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryThead);
    }
  }

  override connected(): void {
    // The shadow's <thead> carries the table-section semantics; the host is
    // a generic custom element wrapper.
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
  }
}
