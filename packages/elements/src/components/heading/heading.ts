import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './heading.template.html?raw';
import styleCss from './heading.css?inline';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl';

const DEFAULT_SIZE_FOR_LEVEL: Readonly<Record<HeadingLevel, HeadingSize>> = {
  1: 'xl',
  2: 'lg',
  3: 'md',
  4: 'sm',
  5: 'sm',
  6: 'sm',
};

/**
 * A semantic heading with a visual size that can be chosen independently of
 * the document-outline level. The host element carries `role="heading"` and
 * `aria-level` so assistive technology maps it correctly regardless of where
 * it appears in the DOM. Slotted children render as the heading's text.
 *
 * @element foundry-heading
 * @summary Typography-tier heading with decoupled level + size.
 *
 * @attr {1 | 2 | 3 | 4 | 5 | 6} level - ARIA level for the heading. Defaults to `2`.
 * @attr {'sm' | 'md' | 'lg' | 'xl'} size - Visual size. Defaults to the
 *   level→size mapping (1→xl, 2→lg, 3→md, 4+→sm). Set explicitly to decouple
 *   visual weight from document structure.
 *
 * @slot - The heading text.
 *
 * @cssprop [--foundry-heading-color] - Text color. Defaults to text-body.
 * @cssprop [--foundry-heading-font-weight] - Font weight. Defaults to font-weight-heading.
 * @cssprop [--foundry-heading-line-height] - Line height. Defaults to line-height-heading.
 * @cssprop [--foundry-heading-font-size] - Font size default. Used when no size attribute is set.
 * @cssprop [--foundry-heading-font-size-sm] - Font size for size="sm". Defaults to heading-sm.
 * @cssprop [--foundry-heading-font-size-md] - Font size for size="md". Defaults to heading-md.
 * @cssprop [--foundry-heading-font-size-lg] - Font size for size="lg". Defaults to heading-lg.
 * @cssprop [--foundry-heading-font-size-xl] - Font size for size="xl". Defaults to heading-xl.
 */
export class FoundryHeading extends FoundryElement {
  static override properties = {
    /** ARIA level (1-6). Defaults to 2. */
    level: { type: Number, reflect: true, default: 2 satisfies HeadingLevel },
    /**
     * Visual size (sm/md/lg/xl). When unset, the rendered size follows the
     * level→size mapping (1→xl, 2→lg, 3→md, 4+→sm).
     */
    size: { type: String, reflect: true },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-heading'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryHeading);
    }
  }

  override connected(): void {
    this.#syncAria();
  }

  override propertyChanged(name: string): void {
    if (name === 'level' || name === 'size') {
      this.#syncAria();
    }
  }

  #syncAria(): void {
    const level = this.#clampLevel(Number(this.readProperty('level')));
    this.setAttribute('role', 'heading');
    this.setAttribute('aria-level', String(level));

    // Apply default size for level if consumer hasn't set one explicitly.
    const size = this.readProperty('size') as HeadingSize | null | undefined;
    if (size == null) {
      this.setAttribute('size', DEFAULT_SIZE_FOR_LEVEL[level]);
    }
  }

  #clampLevel(level: number): HeadingLevel {
    if (!Number.isFinite(level) || level < 1) return 2;
    if (level > 6) return 6;
    return Math.round(level) as HeadingLevel;
  }
}
