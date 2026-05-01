import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './avatar.template.html?raw';
import styleCss from './avatar.css?inline';

export type AvatarSize = 'sm' | 'md' | 'lg';
export type AvatarShape = 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

const DEFAULT_SIZE: AvatarSize = 'md';
const DEFAULT_SHAPE: AvatarShape = 'circle';

/**
 * Profile image with initials fallback. When `src` is set and the image
 * loads, the image is shown; otherwise initials are rendered — derived from
 * `name` automatically (first letter of the first two words, uppercased),
 * or provided explicitly via the default slot.
 *
 * The host carries `role="img"` and an `aria-label` — either the explicit
 * `label` attribute or `name` when `label` is absent. When neither is set,
 * the avatar is marked `aria-hidden="true"` (decorative).
 *
 * @element foundry-avatar
 * @summary Profile image with initials fallback and optional status dot.
 *
 * @attr {string} src - Image URL. If the image fails to load, the initials
 *   fallback is shown.
 * @attr {string} name - Full name used to derive initials when no default
 *   slot content is provided, and as the fallback accessible label.
 * @attr {string} label - Explicit accessible label. Overrides `name` for
 *   `aria-label` purposes.
 * @attr {'sm' | 'md' | 'lg'} size - Avatar size. Defaults to `md`.
 * @attr {'circle' | 'square'} shape - Visual shape. Defaults to `circle`.
 * @attr {'online' | 'offline' | 'away' | 'busy'} status - Optional status
 *   dot. When omitted, no dot is rendered.
 *
 * Note: `has-image` is an internal CSS hook the component sets automatically
 * based on image load success. Not public API.
 *
 * @slot - Optional explicit initials (1–3 characters). Overrides auto-derive
 *   from `name`. Useful for non-Latin scripts or custom glyphs.
 *
 * @csspart container - The outer wrapper.
 * @csspart image - The inner `<img>` element.
 * @csspart initials - The initials fallback span.
 * @csspart status - The status dot.
 *
 * @cssprop [--foundry-avatar-size] - Explicit size override (beats size="...").
 * @cssprop [--foundry-avatar-size-sm] - Size for size="sm".
 * @cssprop [--foundry-avatar-size-md] - Size for size="md" (default).
 * @cssprop [--foundry-avatar-size-lg] - Size for size="lg".
 * @cssprop [--foundry-avatar-radius] - Corner radius (circle default).
 * @cssprop [--foundry-avatar-radius-square] - Corner radius for shape="square".
 * @cssprop [--foundry-avatar-background] - Fallback background color.
 * @cssprop [--foundry-avatar-foreground] - Initials text color.
 * @cssprop [--foundry-avatar-font-weight] - Initials font weight.
 * @cssprop [--foundry-avatar-status-online] - Online dot color.
 * @cssprop [--foundry-avatar-status-offline] - Offline dot color.
 * @cssprop [--foundry-avatar-status-away] - Away dot color.
 * @cssprop [--foundry-avatar-status-busy] - Busy dot color.
 * @cssprop [--foundry-avatar-status-ring] - Ring color around the status dot.
 */
export class FoundryAvatar extends FoundryElement {
  static override properties = {
    src: { type: String, reflect: true },
    name: { type: String, reflect: true },
    label: { type: String, reflect: true },
    size: { type: String, reflect: true, default: DEFAULT_SIZE satisfies AvatarSize },
    shape: { type: String, reflect: true, default: DEFAULT_SHAPE satisfies AvatarShape },
    status: { type: String, reflect: true },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-avatar'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryAvatar);
    }
  }

  #img: HTMLImageElement | undefined;
  #initials: HTMLElement | undefined;

  override connected(): void {
    this.#img = this.refs['image'] as HTMLImageElement | undefined;
    this.#initials = this.refs['initials'] as HTMLElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#img || !this.#initials) return;

    this.#syncSize();
    this.#syncShape();
    this.#wireImage();
    this.#syncLabel();
    this.#renderInitials();
  }

  override propertyChanged(name: string): void {
    if (name === 'src') {
      this.#wireImage();
    } else if (name === 'name') {
      this.#renderInitials();
      this.#syncLabel();
    } else if (name === 'label') {
      this.#syncLabel();
    } else if (name === 'size') {
      this.#syncSize();
    } else if (name === 'shape') {
      this.#syncShape();
    }
  }

  #syncSize(): void {
    if (!this.hasAttribute('size')) {
      this.setAttribute('size', DEFAULT_SIZE);
    }
  }

  #syncShape(): void {
    if (!this.hasAttribute('shape')) {
      this.setAttribute('shape', DEFAULT_SHAPE);
    }
  }

  #wireImage(): void {
    /* v8 ignore next -- defensive; connected() guarantees #img */
    if (!this.#img) return;
    const src = this.readProperty('src') as string | undefined;
    if (!src) {
      this.#img.removeAttribute('src');
      this.toggleAttribute('has-image', false);
      return;
    }
    // Clear `has-image` while the new src loads; set on load, keep off on error.
    this.toggleAttribute('has-image', false);
    this.#img.onload = (): void => {
      this.toggleAttribute('has-image', true);
    };
    this.#img.onerror = (): void => {
      this.toggleAttribute('has-image', false);
    };
    this.#img.src = src;
  }

  #renderInitials(): void {
    /* v8 ignore next -- defensive; connected() guarantees #initials */
    if (!this.#initials) return;
    // If the consumer provided real light-DOM slotted content, leave it alone.
    // `assignedNodes()` (no flatten) returns only explicitly-assigned nodes,
    // never the slot's own fallback content — which is what we want.
    const slot = this.refs['slot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- template always provides the default slot */
    if (!slot) return;
    const hasSlotted = slot.assignedNodes().some((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) return true;
      return (n.textContent ?? '').trim().length > 0;
    });
    if (hasSlotted) return;

    const name = (this.readProperty('name') as string | undefined) ?? '';
    slot.textContent = deriveInitials(name);
  }

  #syncLabel(): void {
    const label = (this.readProperty('label') as string | undefined)
      ?? (this.readProperty('name') as string | undefined);
    if (label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', label);
      this.removeAttribute('aria-hidden');
    } else {
      // Decorative.
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    }
  }
}

// Exported for unit testing the pure helper.
export function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  const first = words[0] ?? '';
  if (words.length === 1) return first.charAt(0).toUpperCase();
  const last = words[words.length - 1] ?? '';
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
