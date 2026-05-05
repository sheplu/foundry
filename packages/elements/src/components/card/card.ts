import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './card.template.html?raw';
import styleCss from './card.css?inline';

export type CardVariant = 'outlined' | 'elevated';

const DEFAULT_VARIANT: CardVariant = 'outlined';

/**
 * Themed surface container with four optional regions: `media`, `header`,
 * default (body), and `footer`. Each region auto-hides when its slot is
 * empty, driven by `has-*` host attributes observed via `slotchange`.
 *
 * The media region is edge-to-edge (no side padding) so slotted images
 * sit flush with the card's rounded corners. Header and footer nestle
 * tight against the body so vertical rhythm stays consistent whether or
 * not every region is present.
 *
 * Two visual variants:
 *  - `outlined` (default) — subtle border, no shadow.
 *  - `elevated` — no border, drop shadow.
 *
 * Card is purely presentational. Interactive behavior (click-through,
 * links) lives in child elements, following the library's convention
 * that no component's host acts as a button or link.
 *
 * @element foundry-card
 * @summary Themed surface container with header / media / body / footer.
 *
 * @attr {'outlined' | 'elevated'} variant - Visual treatment.
 *   Defaults to `outlined`. Reflects.
 *
 * @slot - The card body (main content).
 * @slot header - Optional header row — typically a `<foundry-heading>`
 *   and/or metadata.
 * @slot media - Optional edge-to-edge media region above the header
 *   (images, charts, illustrations).
 * @slot footer - Optional action row (buttons, links, secondary content).
 *
 * @csspart card - The outer surface.
 * @csspart header - The header region wrapper.
 * @csspart media - The media region wrapper.
 * @csspart body - The default-slot wrapper.
 * @csspart footer - The footer region wrapper.
 *
 * @cssprop [--foundry-card-background] - Surface background.
 * @cssprop [--foundry-card-foreground] - Surface text color.
 * @cssprop [--foundry-card-border-color] - Border color (outlined variant).
 * @cssprop [--foundry-card-border-width] - Border width (outlined variant).
 * @cssprop [--foundry-card-radius] - Corner radius.
 * @cssprop [--foundry-card-shadow] - Drop shadow (elevated variant).
 * @cssprop [--foundry-card-padding] - Inner padding for header / body / footer.
 */
export class FoundryCard extends FoundryElement {
  static override properties = {
    variant: {
      type: String,
      reflect: true,
      default: DEFAULT_VARIANT satisfies CardVariant,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-card'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryCard);
    }
  }

  override connected(): void {
    this.#syncVariant();
    this.#wireSlot('mediaSlot', 'has-media');
    this.#wireSlot('headerSlot', 'has-header');
    this.#wireSlot('footerSlot', 'has-footer');
  }

  override propertyChanged(name: string): void {
    if (name === 'variant') this.#syncVariant();
  }

  #syncVariant(): void {
    if (!this.hasAttribute('variant')) {
      this.setAttribute('variant', DEFAULT_VARIANT);
    }
  }

  #wireSlot(refName: string, hostAttr: string): void {
    const slot = this.refs[refName] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these slot refs */
    if (!slot) return;
    const sync = (): void => {
      const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        /* v8 ignore next -- named slots only accept elements with slot= */
        return (n.textContent ?? '').trim().length > 0;
      });
      this.toggleAttribute(hostAttr, hasContent);
    };
    slot.addEventListener('slotchange', sync);
    sync();
  }
}
