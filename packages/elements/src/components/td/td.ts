import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './td.template.html?raw';
import styleCss from './td.css?inline';

/**
 * Table data cell. Wraps slotted content in a native `<td>` so AT sees a
 * real table cell. Pairs with `<foundry-tr>` / `<foundry-tbody>` /
 * `<foundry-table>`.
 *
 * The host carries `display: contents` so the inner native element
 * participates directly in the parent row's layout.
 *
 * @element foundry-td
 * @summary Table data cell, wraps slotted content in a native `<td>`.
 *
 * @slot - The cell content.
 *
 * @csspart cell - The inner native `<td>` element.
 *
 * @cssprop [--foundry-table-cell-padding-block] - Cell vertical padding.
 * @cssprop [--foundry-table-cell-padding-inline] - Cell horizontal padding.
 */
export class FoundryTd extends FoundryElement {
  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-td'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTd);
    }
  }

  override connected(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
  }
}
