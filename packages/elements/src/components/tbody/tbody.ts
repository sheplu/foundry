import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './tbody.template.html?raw';
import styleCss from './tbody.css?inline';

/**
 * Table body section. Wraps slotted `<foundry-tr>` rows in a native
 * `<tbody>` so AT sees a real table-section element. Pairs with
 * `<foundry-thead>` and `<foundry-table>`.
 *
 * The host carries `display: contents` so the inner native element
 * participates directly in the parent `<foundry-table>`'s table layout.
 *
 * @element foundry-tbody
 * @summary Table body section, wraps slotted rows in a native `<tbody>`.
 *
 * @slot - `<foundry-tr>` children.
 *
 * @csspart tbody - The inner native `<tbody>` element.
 */
export class FoundryTbody extends FoundryElement {
  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-tbody'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTbody);
    }
  }

  override connected(): void {
    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');
  }
}
