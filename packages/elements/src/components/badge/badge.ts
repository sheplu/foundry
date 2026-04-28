import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './badge.template.html?raw';
import styleCss from './badge.css?inline';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const DEFAULT_VARIANT: BadgeVariant = 'neutral';

/**
 * Presentational pill for status and intent. Renders a small rounded
 * surface coloured from the `--foundry-color-intent-*` semantic tokens.
 * No ARIA role — the slotted text is the announcement; consumers that need
 * live-region semantics wrap the badge themselves.
 *
 * @element foundry-badge
 * @summary Intent-tier status / count pill.
 *
 * @attr {'neutral' | 'info' | 'success' | 'warning' | 'danger'} variant -
 *   Intent. Defaults to `neutral`.
 *
 * @slot - The badge content (short label, count, or icon + label).
 *
 * @cssprop [--foundry-badge-background] - Pill background. Defaults to the
 *   intent's semantic background.
 * @cssprop [--foundry-badge-foreground] - Pill text color. Defaults to the
 *   intent's semantic foreground.
 * @cssprop [--foundry-badge-padding] - Pill padding. Defaults to 1u / 2u.
 * @cssprop [--foundry-badge-radius] - Corner radius. Defaults to radius-lg.
 * @cssprop [--foundry-badge-font-size] - Text size. Defaults to font-size-caption.
 * @cssprop [--foundry-badge-font-weight] - Text weight. Defaults to font-weight-body.
 */
export class FoundryBadge extends FoundryElement {
  static override properties = {
    /** Intent (neutral / info / success / warning / danger). Defaults to `neutral`. */
    variant: {
      type: String,
      reflect: true,
      default: DEFAULT_VARIANT satisfies BadgeVariant,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-badge'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryBadge);
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
