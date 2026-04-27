import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './inset.template.html?raw';
import styleCss from './inset.css?inline';

export type InsetSpace = 'sm' | 'md' | 'lg';

const DEFAULT_SPACE: InsetSpace = 'md';

/**
 * Padding wrapper primitive. Applies uniform padding around slotted content,
 * pulled from the `--foundry-space-inset-*` tokens. Completes the space-tier
 * trilogy alongside `<foundry-stack>` (vertical gap) and
 * `<foundry-cluster>` (horizontal gap).
 *
 * @element foundry-inset
 * @summary Space-tier padding wrapper with configurable inset.
 *
 * @attr {'sm' | 'md' | 'lg'} space - Uniform padding rung. Defaults to `md`.
 *
 * @slot - The inset content.
 *
 * @cssprop [--foundry-inset-padding] - Catch-all padding override.
 * @cssprop [--foundry-inset-padding-sm] - Padding for space="sm".
 * @cssprop [--foundry-inset-padding-md] - Padding for space="md".
 * @cssprop [--foundry-inset-padding-lg] - Padding for space="lg".
 * @cssprop [--foundry-inset-display] - `display` value. Defaults to `block`.
 */
export class FoundryInset extends FoundryElement {
  static override properties = {
    /** Uniform padding rung (sm / md / lg). Defaults to `md`. */
    space: { type: String, reflect: true, default: DEFAULT_SPACE satisfies InsetSpace },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-inset'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryInset);
    }
  }

  override connected(): void {
    this.#syncSpace();
  }

  override propertyChanged(name: string): void {
    if (name === 'space') {
      this.#syncSpace();
    }
  }

  #syncSpace(): void {
    if (!this.hasAttribute('space')) {
      this.setAttribute('space', DEFAULT_SPACE);
    }
  }
}
