import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './skeleton.template.html?raw';
import styleCss from './skeleton.css?inline';

export type SkeletonShape = 'text' | 'circle' | 'rect';

const DEFAULT_SHAPE: SkeletonShape = 'text';

/**
 * Low-contrast placeholder for content that's still loading. Decorative by
 * default (`aria-hidden="true"`). Setting `label` promotes the host to
 * `role="status"` with `aria-label`, mirroring `<foundry-spinner>`.
 *
 * The pulse animation honors `prefers-reduced-motion: reduce` — the
 * placeholder still renders at the same size, but the opacity loop stops.
 *
 * @element foundry-skeleton
 * @summary Loading placeholder with a pulse animation.
 *
 * @attr {'text' | 'circle' | 'rect'} shape - Geometry preset. Defaults to
 *   `text`. `circle` is 1:1 for avatar placeholders; `rect` is a
 *   configurable block-size box for card/image placeholders.
 * @attr {string} label - Optional accessible label. When set, the host
 *   exposes `role="status"` + `aria-label`. When absent, the host is
 *   decorative (`aria-hidden="true"`).
 *
 * @csspart surface - The element carrying the pulsing background.
 *
 * @cssprop [--foundry-skeleton-color] - Surface color. Defaults to
 *   `--foundry-color-surface-subtle`.
 * @cssprop [--foundry-skeleton-color-highlight] - Reserved for a future shimmer variant.
 * @cssprop [--foundry-skeleton-radius] - Corner radius (circle ignores this; it uses 50%).
 * @cssprop [--foundry-skeleton-width] - Explicit inline-size override.
 * @cssprop [--foundry-skeleton-block-size] - Height.
 * @cssprop [--foundry-skeleton-pulse-min-opacity] - Trough of the pulse cycle.
 * @cssprop [--foundry-skeleton-pulse-duration] - Full pulse cycle (default 1.5s).
 */
export class FoundrySkeleton extends FoundryElement {
  static override properties = {
    shape: { type: String, reflect: true, default: DEFAULT_SHAPE satisfies SkeletonShape },
    label: { type: String, reflect: true },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-skeleton'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundrySkeleton);
    }
  }

  override connected(): void {
    this.#syncShape();
    this.#syncLabel();
  }

  override propertyChanged(name: string): void {
    if (name === 'shape') {
      this.#syncShape();
    } else if (name === 'label') {
      this.#syncLabel();
    }
  }

  #syncShape(): void {
    if (!this.hasAttribute('shape')) {
      this.setAttribute('shape', DEFAULT_SHAPE);
    }
  }

  #syncLabel(): void {
    const label = this.readProperty('label') as string | undefined;
    if (label) {
      this.setAttribute('role', 'status');
      this.setAttribute('aria-label', label);
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    }
  }
}
