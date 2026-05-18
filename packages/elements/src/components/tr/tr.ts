import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './tr.template.html?raw';
import styleCss from './tr.css?inline';

/**
 * Table row. Wraps slotted `<foundry-th>` / `<foundry-td>` cells in a
 * native `<tr>` so AT sees a real table row. Pairs with
 * `<foundry-thead>` / `<foundry-tbody>` / `<foundry-table>`.
 *
 * The host carries `display: contents` so the inner native element
 * participates directly in the parent table layout.
 *
 * @element foundry-tr
 * @summary Table row, wraps slotted cells in a native `<tr>`.
 *
 * @slot - `<foundry-th>` / `<foundry-td>` children.
 *
 * @csspart row - The inner native `<tr>` element.
 */
export class FoundryTr extends FoundryElement {
  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-tr'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTr);
    }
  }

  override connected(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
  }
}
