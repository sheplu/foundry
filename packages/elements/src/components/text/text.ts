import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './text.template.html?raw';
import styleCss from './text.css?inline';

export type TextVariant = 'body' | 'body-sm' | 'caption' | 'emphasis';

const DEFAULT_VARIANT: TextVariant = 'body';

/**
 * Inline typography primitive for body copy, secondary body, captions, and
 * inline emphasis. Sibling to `<foundry-heading>`; together they consume the
 * typography tier. Content is provided via the default slot. The element has
 * no ARIA role — semantics come from the surrounding context.
 *
 * @element foundry-text
 * @summary Typography-tier inline text with body / caption / emphasis variants.
 *
 * @attr {'body' | 'body-sm' | 'caption' | 'emphasis'} variant - Visual variant.
 *   Defaults to `body`. `body-sm` is secondary body copy, `caption` is compact
 *   label text, `emphasis` is the inline bold accent.
 *
 * @slot - The text content.
 *
 * @cssprop [--foundry-text-color] - Text color. Defaults to text-body.
 * @cssprop [--foundry-text-font-size] - Font size default. Defaults to font-size-body.
 * @cssprop [--foundry-text-font-weight] - Font weight default. Defaults to font-weight-body.
 * @cssprop [--foundry-text-line-height] - Line height default. Defaults to line-height-body.
 * @cssprop [--foundry-text-font-size-body-sm] - Font size for variant="body-sm".
 * @cssprop [--foundry-text-font-size-caption] - Font size for variant="caption".
 * @cssprop [--foundry-text-line-height-caption] - Line height for variant="caption".
 * @cssprop [--foundry-text-font-weight-emphasis] - Font weight for variant="emphasis".
 */
export class FoundryText extends FoundryElement {
  static override properties = {
    /** Visual variant (body / body-sm / caption / emphasis). Defaults to `body`. */
    variant: { type: String, reflect: true, default: DEFAULT_VARIANT satisfies TextVariant },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-text'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryText);
    }
  }

  override connected(): void {
    this.#syncVariant();
  }

  override propertyChanged(name: string): void {
    if (name === 'variant') {
      this.#syncVariant();
    }
  }

  #syncVariant(): void {
    if (!this.hasAttribute('variant')) {
      this.setAttribute('variant', DEFAULT_VARIANT);
    }
  }
}
