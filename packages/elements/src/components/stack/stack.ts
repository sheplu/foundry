import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './stack.template.html?raw';
import styleCss from './stack.css?inline';

export type StackSpace = 'xs' | 'sm' | 'md' | 'lg';

const DEFAULT_SPACE: StackSpace = 'md';

/**
 * Vertical layout primitive. Arranges slotted children in a single column
 * with consistent spacing pulled from the `--foundry-space-stack-*` tokens.
 * No ARIA role — stacks are layout, not semantic lists; use a nested
 * `<ul>` / `<ol>` when list semantics matter.
 *
 * @element foundry-stack
 * @summary Space-tier vertical stack primitive with configurable gap.
 *
 * @attr {'xs' | 'sm' | 'md' | 'lg'} space - Gap between children.
 *   Defaults to `md`. `xs` and `sm` pack tightly; `lg` is display spacing.
 *
 * @slot - The stacked children.
 *
 * @cssprop [--foundry-stack-gap] - Catch-all gap override. Used when no
 *   per-size override is set.
 * @cssprop [--foundry-stack-gap-xs] - Gap for space="xs".
 * @cssprop [--foundry-stack-gap-sm] - Gap for space="sm".
 * @cssprop [--foundry-stack-gap-md] - Gap for space="md".
 * @cssprop [--foundry-stack-gap-lg] - Gap for space="lg".
 */
export class FoundryStack extends FoundryElement {
  static override properties = {
    /** Vertical gap between children (xs / sm / md / lg). Defaults to `md`. */
    space: { type: String, reflect: true, default: DEFAULT_SPACE satisfies StackSpace },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-stack'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryStack);
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
