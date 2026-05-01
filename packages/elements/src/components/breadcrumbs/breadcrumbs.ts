import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './breadcrumbs.template.html?raw';
import styleCss from './breadcrumbs.css?inline';

/**
 * Navigation trail wrapper. Renders a semantic `<nav aria-label="Breadcrumb">`
 * around an ordered list of `<foundry-breadcrumb>` children. No runtime
 * coordination between parent and children — each child styles and announces
 * itself independently. The parent only owns the accessible name + list
 * structure.
 *
 * @element foundry-breadcrumbs
 * @summary Semantic breadcrumb-navigation wrapper.
 *
 * @slot - Breadcrumb items. Typically `<foundry-breadcrumb>` children.
 *
 * @csspart nav - The outer `<nav>` element.
 * @csspart list - The inner `<ol>` element.
 *
 * @cssprop [--foundry-breadcrumbs-gap] - Space between items.
 * @cssprop [--foundry-breadcrumbs-font-size] - Trail font size.
 * @cssprop [--foundry-breadcrumbs-color] - Trail color (children inherit).
 */
export class FoundryBreadcrumbs extends FoundryElement {
  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-breadcrumbs'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryBreadcrumbs);
    }
  }
}
