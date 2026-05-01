import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './tag.template.html?raw';
import styleCss from './tag.css?inline';

export type TagVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const DEFAULT_VARIANT: TagVariant = 'neutral';

/**
 * Dismissible intent pill. A sibling of `<foundry-badge>` that can be
 * removed via an inline close button. When `removable`, clicking or pressing
 * Enter/Space on the close button dispatches a cancelable `remove` event.
 * If the listener does NOT call `preventDefault()`, the tag removes itself
 * from the DOM — giving vanilla consumers working UX with zero code. If
 * the listener prevents the default, the tag stays mounted and the consumer
 * handles state.
 *
 * @element foundry-tag
 * @summary Dismissible intent pill.
 *
 * @attr {'neutral' | 'info' | 'success' | 'warning' | 'danger'} variant -
 *   Intent. Defaults to `neutral`.
 * @attr {string} value - Identifier surfaced in the `remove` event detail.
 *   Falls back to the slotted label when omitted.
 * @attr {boolean} removable - Renders the close button when true. Default false.
 * @attr {boolean} disabled - Suppresses close interaction and dims the pill.
 *
 * @slot - The tag label (short text).
 *
 * @csspart wrapper - The outer pill container.
 * @csspart content - Wrapper around the default slot.
 * @csspart close - The inner close `<button>` (only visible when `removable`).
 * @csspart close-icon - The inline close SVG.
 *
 * @fires remove - `CustomEvent<{ value: string }>` fired when the consumer
 *   clicks the close button (or presses Enter / Space on it). Bubbles,
 *   composed, and cancelable: calling `preventDefault()` keeps the tag in
 *   the DOM.
 *
 * @cssprop [--foundry-tag-background] - Pill background.
 * @cssprop [--foundry-tag-foreground] - Pill text color.
 * @cssprop [--foundry-tag-padding] - Pill padding.
 * @cssprop [--foundry-tag-radius] - Corner radius.
 * @cssprop [--foundry-tag-font-size] - Text size.
 * @cssprop [--foundry-tag-font-weight] - Text weight.
 * @cssprop [--foundry-tag-close-size] - Close button diameter.
 * @cssprop [--foundry-tag-close-color] - Close icon color.
 * @cssprop [--foundry-tag-close-background-hover] - Close button hover bg.
 * @cssprop [--foundry-tag-focus-outline] - Close button focus ring.
 * @cssprop [--foundry-tag-disabled-opacity] - Host opacity when disabled.
 */
export class FoundryTag extends FoundryElement {
  static override properties = {
    variant: { type: String, reflect: true, default: DEFAULT_VARIANT satisfies TagVariant },
    value: { type: String, reflect: true },
    removable: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-tag'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTag);
    }
  }

  #close: HTMLButtonElement | undefined;

  override connected(): void {
    this.#close = this.refs['close'] as HTMLButtonElement | undefined;
    /* v8 ignore next -- defensive; template always provides the close ref */
    if (!this.#close) return;

    this.#syncVariant();
    this.#syncRemovable();
    this.#syncDisabled();
    this.#close.addEventListener('click', this.#onClick);
    this.#close.addEventListener('keydown', this.#onKeydown);
  }

  override propertyChanged(name: string): void {
    if (name === 'variant') {
      this.#syncVariant();
    } else if (name === 'removable') {
      this.#syncRemovable();
    } else if (name === 'disabled') {
      this.#syncDisabled();
    }
  }

  #syncVariant(): void {
    if (!this.hasAttribute('variant')) {
      this.setAttribute('variant', DEFAULT_VARIANT);
    }
  }

  #syncRemovable(): void {
    /* v8 ignore next -- defensive; connected() guarantees #close */
    if (!this.#close) return;
    const removable = Boolean(this.readProperty('removable'));
    if (removable) {
      this.#close.tabIndex = 0;
      this.#close.removeAttribute('aria-hidden');
      this.#close.setAttribute('aria-label', `Remove ${this.#resolveValue()}`);
    } else {
      this.#close.tabIndex = -1;
      this.#close.setAttribute('aria-hidden', 'true');
      this.#close.removeAttribute('aria-label');
    }
  }

  #syncDisabled(): void {
    /* v8 ignore next -- defensive; connected() guarantees #close */
    if (!this.#close) return;
    this.#close.disabled = Boolean(this.readProperty('disabled'));
  }

  #onClick = (event: MouseEvent): void => {
    if (this.readProperty('disabled')) return;
    event.stopPropagation();
    this.#requestRemove();
  };

  #onKeydown = (event: KeyboardEvent): void => {
    if (this.readProperty('disabled')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.#requestRemove();
  };

  #requestRemove(): void {
    const detail = { value: this.#resolveValue() };
    const event = new CustomEvent<{ value: string }>('remove', {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true,
    });
    const notPrevented = this.dispatchEvent(event);
    if (notPrevented) this.remove();
  }

  #resolveValue(): string {
    return resolveTagValue(
      (this.readProperty('value') as string | undefined) ?? '',
      this.textContent ?? '',
    );
  }
}

/**
 * Pure helper exported for unit testing — returns the explicit `value`
 * attribute when non-empty, otherwise the trimmed slotted label.
 */
export function resolveTagValue(value: string, text: string): string {
  if (value) return value;
  return text.trim();
}
