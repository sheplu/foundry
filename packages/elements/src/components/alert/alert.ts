import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './alert.template.html?raw';
import styleCss from './alert.css?inline';

export type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const DEFAULT_VARIANT: AlertVariant = 'info';
const ASSERTIVE: ReadonlySet<AlertVariant> = new Set<AlertVariant>(['danger', 'warning']);

/**
 * Intent-aware callout banner. Renders with a soft-surface background,
 * matching-hue border, and optional bold title. Live-region role is
 * derived from variant: `alert` (assertive) for danger/warning,
 * `status` (polite) for info/success/neutral — per WAI-ARIA.
 *
 * @element foundry-alert
 * @summary Intent-tier feedback banner with title + body slots.
 *
 * @attr {'neutral' | 'info' | 'success' | 'warning' | 'danger'} variant -
 *   Intent. Defaults to `info`.
 *
 * Note: the `has-title` attribute is managed automatically by the component
 * (reflected based on whether the `title` slot has assigned content). It's an
 * internal CSS hook, not part of the public API — consumers never set it.
 *
 * @slot title - Optional title line. Rendered bold above the body. Hidden
 *   when no content is assigned.
 * @slot - The alert body (required).
 *
 * @csspart container - The outer wrapper that carries background + border.
 * @csspart title - The title row; empty-state hidden via CSS.
 * @csspart body - The body text row.
 *
 * @cssprop [--foundry-alert-background] - Surface color. Defaults to the
 *   intent's semantic background.
 * @cssprop [--foundry-alert-foreground] - Text color. Defaults to the
 *   intent's semantic foreground.
 * @cssprop [--foundry-alert-border-color] - Border color. Defaults to the
 *   intent's semantic foreground (same hue as text).
 * @cssprop [--foundry-alert-border-width] - Border thickness. Defaults to 1px.
 * @cssprop [--foundry-alert-padding] - Inner padding. Defaults to space-inset-md.
 * @cssprop [--foundry-alert-radius] - Corner radius. Defaults to radius-md.
 * @cssprop [--foundry-alert-font-size] - Body font size. Defaults to font-size-body.
 * @cssprop [--foundry-alert-line-height] - Body line height. Defaults to line-height-body.
 * @cssprop [--foundry-alert-title-font-weight] - Title weight. Defaults to font-weight-emphasis.
 */
export class FoundryAlert extends FoundryElement {
  static override properties = {
    /** Intent (neutral / info / success / warning / danger). Defaults to `info`. */
    variant: {
      type: String,
      reflect: true,
      default: DEFAULT_VARIANT satisfies AlertVariant,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-alert'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryAlert);
    }
  }

  override connected(): void {
    this.#syncVariant();
    this.#wireTitleSlot();
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
    const variant = this.readProperty('variant') as AlertVariant;
    this.setAttribute('role', ASSERTIVE.has(variant) ? 'alert' : 'status');
  }

  #wireTitleSlot(): void {
    const titleSlot = this.refs['titleSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides titleSlot ref */
    if (!titleSlot) return;

    const sync = (): void => {
      const hasContent = titleSlot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        /* v8 ignore next -- named slots only accept elements with slot=,
           so bare text nodes can never reach here in practice */
        return (n.textContent ?? '').trim().length > 0;
      });
      this.toggleAttribute('has-title', hasContent);
    };

    titleSlot.addEventListener('slotchange', sync);
    sync();
  }
}
