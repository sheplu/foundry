import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './navbar.template.html?raw';
import styleCss from './navbar.css?inline';

export type NavbarVariant = 'flat' | 'outlined' | 'elevated';

const DEFAULT_VARIANT: NavbarVariant = 'outlined';
const DEFAULT_LABEL = 'Main navigation';

/**
 * Semantic navigation shell. Renders a `<nav role="navigation">` with three
 * slot regions — `brand` at the start, the default slot in the middle, and
 * `actions` at the end — laid out as a single flex row. Each edge region
 * auto-collapses when its slot is empty, driven by `has-brand` / `has-actions`
 * host attributes observed via `slotchange`.
 *
 * Navbar is purely a container: no mobile-menu toggle, no link-coordination,
 * no dropdown orchestration. Consumers place whatever content they want
 * inside — native `<a>`, `<foundry-link>`, `<foundry-button>`, search input,
 * avatar, etc. That separation keeps the surface small and makes more opinionated
 * variants (app-bar, mobile-burger) composable on top.
 *
 * @element foundry-navbar
 * @summary Semantic navbar shell with brand / content / actions slot regions.
 *
 * @attr {'flat' | 'outlined' | 'elevated'} variant - Visual treatment.
 *   Defaults to `outlined` (thin bottom border). Reflects.
 * @attr {boolean} sticky - When present, pins the navbar to the top of its
 *   scroll container via `position: sticky`. Reflects.
 * @attr {string} label - Accessible label forwarded to the inner `<nav>`.
 *   Defaults to `Main navigation`.
 *
 * @slot brand - Start-edge region. Logo + wordmark.
 * @slot - Middle region. Primary nav links or free-form content.
 * @slot actions - End-edge region. Auxiliary buttons, avatar, theme toggle.
 *
 * @csspart nav - The outer `<nav>` wrapper.
 * @csspart brand - The brand slot container.
 * @csspart content - The default-slot container.
 * @csspart actions - The actions slot container.
 *
 * @cssprop [--foundry-navbar-background] - Navbar background color.
 * @cssprop [--foundry-navbar-foreground] - Navbar text color.
 * @cssprop [--foundry-navbar-border-color] - Bottom-border color (outlined variant).
 * @cssprop [--foundry-navbar-shadow] - Drop shadow (elevated variant).
 * @cssprop [--foundry-navbar-gap] - Horizontal gap between regions.
 * @cssprop [--foundry-navbar-padding-inline] - Inline padding.
 * @cssprop [--foundry-navbar-padding-block] - Block padding.
 * @cssprop [--foundry-navbar-min-height] - Minimum navbar height.
 * @cssprop [--foundry-navbar-brand-font-weight] - Brand text weight.
 * @cssprop [--foundry-navbar-z-index] - Stacking index when sticky.
 */
export class FoundryNavbar extends FoundryElement {
  static override properties = {
    variant: {
      type: String,
      reflect: true,
      default: DEFAULT_VARIANT satisfies NavbarVariant,
    },
    sticky: { type: Boolean, reflect: true, default: false },
    label: { type: String, reflect: true, default: DEFAULT_LABEL },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-navbar'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryNavbar);
    }
  }

  override connected(): void {
    this.#syncVariant();
    this.#syncLabel();
    this.#wireSlot('brandSlot', 'has-brand');
    this.#wireSlot('actionsSlot', 'has-actions');
  }

  override propertyChanged(name: string): void {
    if (name === 'variant') {
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

  #syncLabel(): void {
    const nav = this.refs['nav'] as HTMLElement | undefined;
    /* v8 ignore next -- defensive; template always provides the nav ref */
    if (!nav) return;
    const label = (this.readProperty('label') as string | undefined) || DEFAULT_LABEL;
    nav.setAttribute('aria-label', label);
  }

  #wireSlot(refName: string, hostAttr: string): void {
    const slot = this.refs[refName] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides slot refs */
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
