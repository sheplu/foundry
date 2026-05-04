import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryDetails } from '../details/details.ts';
import templateHtml from './accordion.template.html?raw';
import styleCss from './accordion.css?inline';

export type AccordionMode = 'single' | 'multiple';

const DEFAULT_MODE: AccordionMode = 'single';

/**
 * Group container for `<foundry-details>` children. Discovers items via
 * `slotchange` + `instanceof` and listens for the native `toggle` event
 * bubbling up from each child to coordinate open state:
 *
 *  - `mode="single"` (default): opening one item closes the others.
 *  - `mode="multiple"`: each item toggles independently; the parent
 *    provides grouped styling only.
 *
 * Emits a composed `change` event after any user-initiated toggle with
 * `event.detail.openValues` — an array of `resolvedValue` strings for
 * every currently-open item.
 *
 * @element foundry-accordion
 * @summary Grouped disclosure items with single-open or multi-open modes.
 *
 * @attr {'single' | 'multiple'} mode - Coordination model. Default `single`.
 *   Switching `multiple → single` at runtime collapses all but the first
 *   open item.
 *
 * @slot - Holds `<foundry-details>` children.
 *
 * @csspart group - The outer container (flex column).
 *
 * @fires change - Bubbles + composed. `event.detail.openValues: string[]`
 *   is the list of open items' resolvedValues after the change.
 *
 * @cssprop [--foundry-accordion-gap] - Vertical spacing between items.
 */
export class FoundryAccordion extends FoundryElement {
  static override properties = {
    mode: { type: String, reflect: true, default: DEFAULT_MODE satisfies AccordionMode },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-accordion'): void {
    FoundryDetails.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryAccordion);
    }
  }

  #slot: HTMLSlotElement | undefined;
  #items: FoundryDetails[] = [];
  // Suppress recursive change emissions while we programmatically close
  // siblings in single-mode coordination.
  #coordinating = false;

  override connected(): void {
    this.#slot = this.refs['slot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides the slot */
    if (!this.#slot) return;

    if (!this.hasAttribute('mode')) this.setAttribute('mode', DEFAULT_MODE);

    this.#slot.addEventListener('slotchange', this.#onSlotChange);
    // Bubbling toggle events from <foundry-details> children (native
    // <details> fires `toggle`, which bubbles through the slotted parent).
    this.addEventListener('toggle', this.#onDetailsToggle);

    this.#readItems();
    this.#enforceSingleMode();
  }

  override disconnected(): void {
    this.#slot?.removeEventListener('slotchange', this.#onSlotChange);
    this.removeEventListener('toggle', this.#onDetailsToggle);
  }

  override propertyChanged(name: string): void {
    if (name === 'mode') {
      this.#enforceSingleMode();
    }
  }

  /** Snapshot of discovered `<foundry-details>` children. */
  get items(): readonly FoundryDetails[] {
    return this.#items;
  }

  #onSlotChange = (): void => {
    this.#readItems();
  };

  #readItems(): void {
    /* v8 ignore next -- defensive; connected() guarantees #slot */
    if (!this.#slot) return;
    const assigned = this.#slot.assignedElements({ flatten: true });
    this.#items = assigned.filter(
      (el): el is FoundryDetails => el instanceof FoundryDetails,
    );
  }

  #onDetailsToggle = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof FoundryDetails)) return;
    if (!this.#items.includes(target)) return;
    if (this.#coordinating) return;

    const mode = (this.readProperty('mode') as AccordionMode) ?? DEFAULT_MODE;
    if (isOpen(target) && mode === 'single') {
      this.#coordinating = true;
      for (const item of this.#items) {
        if (item !== target && isOpen(item)) {
          setOpen(item, false);
        }
      }
      this.#coordinating = false;
    }

    this.#emitChange();
  };

  // If multiple items are open in single-mode (either from initial markup
  // or after a mode switch), collapse all but the first open one.
  #enforceSingleMode(): void {
    const mode = (this.readProperty('mode') as AccordionMode) ?? DEFAULT_MODE;
    if (mode !== 'single') return;
    const openItems = this.#items.filter(isOpen);
    if (openItems.length <= 1) return;
    this.#coordinating = true;
    for (let i = 1; i < openItems.length; i += 1) {
      const item = openItems[i];
      if (item) setOpen(item, false);
    }
    this.#coordinating = false;
  }

  #emitChange(): void {
    const openValues = this.#items
      .filter(isOpen)
      .map((item) => item.resolvedValue);
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { openValues },
    }));
  }
}

// FoundryElement generates property accessors at runtime from the
// `static properties` map; TypeScript can't see them on the class. These
// tiny helpers cast through `{ open: boolean }` so the callers stay clean.
function isOpen(item: FoundryDetails): boolean {
  return (item as unknown as { open: boolean }).open;
}

function setOpen(item: FoundryDetails, value: boolean): void {
  (item as unknown as { open: boolean }).open = value;
}
