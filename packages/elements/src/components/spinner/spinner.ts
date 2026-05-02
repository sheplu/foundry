import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './spinner.template.html?raw';
import styleCss from './spinner.css?inline';

export type SpinnerSize = 'sm' | 'md' | 'lg';

const DEFAULT_SIZE: SpinnerSize = 'md';

/**
 * Indeterminate loading indicator. Decorative by default
 * (`aria-hidden="true"`). Setting `label` promotes the host to
 * `role="status"` with `aria-label`, giving assistive tech a polite
 * announcement that a loading state is active.
 *
 * The spin animation honors `prefers-reduced-motion: reduce` — the arc is
 * still visible, but rotation stops.
 *
 * @element foundry-spinner
 * @summary Accessible indeterminate loading indicator.
 *
 * @attr {'sm' | 'md' | 'lg'} size - Size preset. Defaults to `md`.
 * @attr {string} label - Optional accessible label. When set, the host
 *   exposes `role="status"` + `aria-label`. When absent, the host is
 *   decorative (`aria-hidden="true"`).
 *
 * @csspart container - The outer element that rotates.
 * @csspart track - The full-circle background stroke.
 * @csspart arc - The visible spinning arc.
 *
 * @cssprop [--foundry-spinner-size] - Explicit size override (beats `size`).
 * @cssprop [--foundry-spinner-size-sm] - Size for `size="sm"`.
 * @cssprop [--foundry-spinner-size-md] - Size for `size="md"` (default).
 * @cssprop [--foundry-spinner-size-lg] - Size for `size="lg"`.
 * @cssprop [--foundry-spinner-color] - Arc color. Inherits `currentColor`.
 * @cssprop [--foundry-spinner-track-color] - Track color.
 * @cssprop [--foundry-spinner-track-opacity] - Track opacity (default 0.25).
 * @cssprop [--foundry-spinner-stroke-width] - Stroke thickness in viewBox units.
 * @cssprop [--foundry-spinner-duration] - Full rotation duration (default 0.8s).
 */
export class FoundrySpinner extends FoundryElement {
  static override properties = {
    size: { type: String, reflect: true, default: DEFAULT_SIZE satisfies SpinnerSize },
    label: { type: String, reflect: true },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-spinner'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundrySpinner);
    }
  }

  override connected(): void {
    this.#syncSize();
    this.#syncLabel();
  }

  override propertyChanged(name: string): void {
    if (name === 'size') {
      this.#syncSize();
    } else if (name === 'label') {
      this.#syncLabel();
    }
  }

  #syncSize(): void {
    if (!this.hasAttribute('size')) {
      this.setAttribute('size', DEFAULT_SIZE);
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
