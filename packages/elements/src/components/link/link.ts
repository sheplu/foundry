import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './link.template.html?raw';
import styleCss from './link.css?inline';

export type LinkVariant = 'inline' | 'standalone';
export type LinkTarget = '_self' | '_blank' | '_parent' | '_top';

const DEFAULT_VARIANT: LinkVariant = 'inline';

// Attributes forwarded verbatim onto the inner <a>. `rel` is forwarded too
// but may be augmented with `noopener` when target="_blank" without an
// explicit rel — see #syncRel below.
const FORWARDED_ATTRS = ['href', 'target', 'download', 'hreflang', 'type'] as const;

type ForwardedAttr = typeof FORWARDED_ATTRS[number];

/**
 * Themable hyperlink primitive. Wraps a native `<a>` so keyboard, focus,
 * middle-click, drag-to-bookmark, and right-click-open-in-new-tab all behave
 * natively. When `target="_blank"` is set without an explicit `rel`, the
 * component adds `rel="noopener"` for tab-nap / reverse-tabnabbing safety.
 *
 * Two variants: `inline` (default, underlined — for links sitting in prose)
 * and `standalone` (no underline until hover — for nav lists, card titles).
 *
 * @element foundry-link
 * @summary Themable hyperlink with inline and standalone variants.
 *
 * @attr {'inline' | 'standalone'} variant - Visual variant. Defaults to `inline`.
 * @attr {string} href - Target URL. Forwarded to the inner `<a>`.
 * @attr {'_self' | '_blank' | '_parent' | '_top'} target - Link target.
 *   Forwarded. `_blank` auto-adds `rel="noopener"` when `rel` is not set.
 * @attr {string} rel - Relationship tokens for the inner `<a>`. When set
 *   explicitly, the component does NOT add `noopener` automatically — the
 *   consumer is opting in to full control.
 * @attr {string} download - Forwarded to the inner `<a>`.
 * @attr {string} hreflang - Forwarded to the inner `<a>`.
 * @attr {string} type - Forwarded to the inner `<a>` as the MIME type hint.
 *
 * @slot - Link content (usually text).
 * @csspart anchor - The inner `<a>` element.
 *
 * @cssprop [--foundry-link-color] - Link color default.
 * @cssprop [--foundry-link-color-hover] - Link color on hover.
 * @cssprop [--foundry-link-color-active] - Link color when active (mousedown).
 * @cssprop [--foundry-link-color-visited] - Visited link color. Defaults to
 *   `--foundry-link-color` (no distinct visited style).
 * @cssprop [--foundry-link-underline-thickness] - Underline thickness.
 * @cssprop [--foundry-link-underline-offset] - Distance between text and underline.
 * @cssprop [--foundry-link-focus-outline] - Focus ring color.
 * @cssprop [--foundry-link-focus-radius] - Corner radius used for the focus ring only.
 */
export class FoundryLink extends FoundryElement {
  static override properties = {
    /** Visual variant: `inline` (default, underlined) or `standalone`. */
    variant: { type: String, reflect: true, default: DEFAULT_VARIANT satisfies LinkVariant },
    /** Target URL. */
    href: { type: String, reflect: true },
    /** Link target (`_self` / `_blank` / `_parent` / `_top`). */
    target: { type: String, reflect: true },
    /** Relationship tokens. When set, suppresses auto `noopener` on `_blank`. */
    rel: { type: String, reflect: true },
    /** Download hint. */
    download: { type: String, reflect: true },
    /** Target-resource language hint. */
    hreflang: { type: String, reflect: true },
    /** MIME type hint. */
    type: { type: String, reflect: true },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-link'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryLink);
    }
  }

  #anchor: HTMLAnchorElement | undefined;

  override connected(): void {
    this.#anchor = this.refs['anchor'] as HTMLAnchorElement | undefined;
    /* v8 ignore next -- defensive; template always provides the inner anchor */
    if (!this.#anchor) return;

    this.#syncVariant();
    this.#forwardAll();
    this.#syncRel();
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #anchor is set */
    if (!this.#anchor) return;
    if (name === 'variant') {
      this.#syncVariant();
    } else if ((FORWARDED_ATTRS as readonly string[]).includes(name)) {
      this.#forwardOne(name as ForwardedAttr);
      // target changes need a rel re-evaluation (auto `noopener` depends on target).
      if (name === 'target') this.#syncRel();
    } else if (name === 'rel') {
      this.#syncRel();
    }
  }

  override focus(options?: FocusOptions): void {
    this.#anchor?.focus(options);
  }

  #syncVariant(): void {
    if (!this.hasAttribute('variant')) {
      this.setAttribute('variant', DEFAULT_VARIANT);
    }
  }

  #forwardAll(): void {
    for (const attr of FORWARDED_ATTRS) {
      this.#forwardOne(attr);
    }
  }

  #forwardOne(attr: ForwardedAttr): void {
    /* v8 ignore next -- defensive; connected() guarantees #anchor */
    if (!this.#anchor) return;
    const value = this.readProperty(attr) as string | undefined;
    if (value === undefined || value === null || value === '') {
      this.#anchor.removeAttribute(attr);
    } else {
      this.#anchor.setAttribute(attr, value);
    }
  }

  // When `target="_blank"` is set and the consumer did NOT provide an
  // explicit `rel`, add `rel="noopener"` for safety. If the consumer set
  // `rel` themselves, honor it exactly — they've opted in to full control.
  #syncRel(): void {
    /* v8 ignore next -- defensive; connected() guarantees #anchor */
    if (!this.#anchor) return;
    const userRel = this.readProperty('rel') as string | undefined;
    if (userRel) {
      this.#anchor.setAttribute('rel', userRel);
      return;
    }
    const target = this.readProperty('target') as string | undefined;
    if (target === '_blank') {
      this.#anchor.setAttribute('rel', 'noopener');
    } else {
      this.#anchor.removeAttribute('rel');
    }
  }
}
