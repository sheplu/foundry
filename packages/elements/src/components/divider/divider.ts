import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './divider.template.html?raw';
import styleCss from './divider.css?inline';

export type DividerOrientation = 'horizontal' | 'vertical';

const DEFAULT_ORIENTATION: DividerOrientation = 'horizontal';

/**
 * Presentational rule that separates sections of content. Renders as a 1px
 * line drawn from the `--foundry-color-border` semantic token by default.
 * Carries `role="separator"`; `aria-orientation` is emitted only when
 * vertical (horizontal is the implicit default for the role).
 *
 * @element foundry-divider
 * @summary Color-tier horizontal / vertical separator.
 *
 * @attr {'horizontal' | 'vertical'} orientation - Rule direction.
 *   Defaults to `horizontal`.
 *
 * @cssprop [--foundry-divider-color] - Rule color. Defaults to color-border.
 * @cssprop [--foundry-divider-thickness] - Rule thickness. Defaults to 1px.
 */
export class FoundryDivider extends FoundryElement {
  static override properties = {
    /** Rule direction (horizontal / vertical). Defaults to `horizontal`. */
    orientation: {
      type: String,
      reflect: true,
      default: DEFAULT_ORIENTATION satisfies DividerOrientation,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-divider'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryDivider);
    }
  }

  override connected(): void {
    this.#syncAria();
  }

  override propertyChanged(name: string): void {
    if (name === 'orientation') {
      this.#syncAria();
    }
  }

  #syncAria(): void {
    if (!this.hasAttribute('orientation')) {
      this.setAttribute('orientation', DEFAULT_ORIENTATION);
    }
    this.setAttribute('role', 'separator');

    const orientation = this.readProperty('orientation') as DividerOrientation;
    if (orientation === 'vertical') {
      this.setAttribute('aria-orientation', 'vertical');
    } else {
      this.removeAttribute('aria-orientation');
    }
  }
}
