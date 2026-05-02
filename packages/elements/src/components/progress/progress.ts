import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './progress.template.html?raw';
import styleCss from './progress.css?inline';

export type ProgressVariant = 'neutral' | 'success' | 'warning' | 'danger';

const DEFAULT_VARIANT: ProgressVariant = 'neutral';
const DEFAULT_LABEL = 'Progress';

/**
 * Determinate progress indicator. The host carries `role="progressbar"` plus
 * `aria-valuenow` / `aria-valuemin` / `aria-valuemax`, so assistive tech
 * announces progress without any wrapper. A CSS-animated bar fills the
 * track from 0 to 100% of `(value / max)`; the fill transition is halted
 * under `prefers-reduced-motion: reduce`.
 *
 * Values are clamped to `[0, max]`; non-finite values fall back to `0`.
 *
 * @element foundry-progress
 * @summary Determinate progress bar with a clamped value and intent variants.
 *
 * @attr {number} value - Current progress (clamped to `[0, max]`). Default 0.
 * @attr {number} max - Upper bound. Default 100. Must be > 0; non-positive
 *   values fall back to 100.
 * @attr {'neutral' | 'success' | 'warning' | 'danger'} variant - Intent.
 *   Defaults to `neutral` (primary action color).
 * @attr {string} label - Accessible label. Defaults to `Progress`.
 *
 * @csspart track - The full-width track.
 * @csspart bar - The filled inner bar.
 *
 * @cssprop [--foundry-progress-width] - Host inline-size. Defaults to `100%`.
 * @cssprop [--foundry-progress-height] - Track height. Defaults to `0.5rem`.
 * @cssprop [--foundry-progress-radius] - Corner radius. Defaults to `999px` (pill).
 * @cssprop [--foundry-progress-track] - Track color.
 * @cssprop [--foundry-progress-fill] - Bar color for `neutral` variant.
 * @cssprop [--foundry-progress-fill-success] - Bar color for `success`.
 * @cssprop [--foundry-progress-fill-warning] - Bar color for `warning`.
 * @cssprop [--foundry-progress-fill-danger] - Bar color for `danger`.
 * @cssprop [--foundry-progress-transition] - Fill transition duration.
 */
export class FoundryProgress extends FoundryElement {
  static override properties = {
    value: { type: Number, reflect: true, default: 0 },
    max: { type: Number, reflect: true, default: 100 },
    variant: {
      type: String,
      reflect: true,
      default: DEFAULT_VARIANT satisfies ProgressVariant,
    },
    label: { type: String, reflect: true },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-progress'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryProgress);
    }
  }

  #bar: HTMLElement | undefined;

  override connected(): void {
    this.#bar = this.refs['bar'] as HTMLElement | undefined;
    /* v8 ignore next -- defensive; template always provides the bar ref */
    if (!this.#bar) return;

    this.setAttribute('role', 'progressbar');
    this.#syncVariant();
    this.#syncAria();
  }

  override propertyChanged(name: string): void {
    if (name === 'value' || name === 'max') {
      this.#syncAria();
    } else if (name === 'variant') {
      this.#syncVariant();
    } else if (name === 'label') {
      this.#syncLabel();
    }
  }

  #syncVariant(): void {
    if (!this.hasAttribute('variant')) {
      this.setAttribute('variant', DEFAULT_VARIANT);
    }
  }

  /** Clamp + reflect value, max, and bar fill width onto the DOM. */
  #syncAria(): void {
    /* v8 ignore next -- defensive; connected() guarantees #bar */
    if (!this.#bar) return;

    const rawMax = Number(this.readProperty('max'));
    const max = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 100;

    const rawValue = Number(this.readProperty('value'));
    const safe = Number.isFinite(rawValue) ? rawValue : 0;
    const value = Math.min(Math.max(safe, 0), max);

    const pct = (value / max) * 100;

    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(value));
    this.#bar.style.setProperty('--_bar-size', `${pct}%`);
    this.#syncLabel();
  }

  #syncLabel(): void {
    const label = this.readProperty('label') as string | undefined;
    this.setAttribute('aria-label', label || DEFAULT_LABEL);
  }
}
