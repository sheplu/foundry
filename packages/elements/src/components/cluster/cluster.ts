import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './cluster.template.html?raw';
import styleCss from './cluster.css?inline';

export type ClusterSpace = 'xs' | 'sm' | 'md' | 'lg';

const DEFAULT_SPACE: ClusterSpace = 'md';

/**
 * Horizontal layout primitive. Arranges slotted children in a flex row with
 * consistent spacing pulled from the `--foundry-space-inline-*` tokens.
 * Wraps to new rows by default; override via `--foundry-cluster-wrap`.
 * Sibling to `<foundry-stack>` on the inline axis.
 *
 * @element foundry-cluster
 * @summary Space-tier horizontal cluster primitive with configurable gap.
 *
 * @attr {'xs' | 'sm' | 'md' | 'lg'} space - Horizontal gap between children.
 *   Defaults to `md`.
 *
 * @slot - The clustered children.
 *
 * @cssprop [--foundry-cluster-gap] - Catch-all gap override.
 * @cssprop [--foundry-cluster-gap-xs] - Gap for space="xs".
 * @cssprop [--foundry-cluster-gap-sm] - Gap for space="sm".
 * @cssprop [--foundry-cluster-gap-md] - Gap for space="md".
 * @cssprop [--foundry-cluster-gap-lg] - Gap for space="lg".
 * @cssprop [--foundry-cluster-wrap] - `flex-wrap` value. Defaults to `wrap`.
 * @cssprop [--foundry-cluster-align] - `align-items` value. Defaults to `center`.
 */
export class FoundryCluster extends FoundryElement {
  static override properties = {
    /** Horizontal gap between children (xs / sm / md / lg). Defaults to `md`. */
    space: { type: String, reflect: true, default: DEFAULT_SPACE satisfies ClusterSpace },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-cluster'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryCluster);
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
