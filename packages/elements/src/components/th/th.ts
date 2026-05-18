import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './th.template.html?raw';
import styleCss from './th.css?inline';

export type ThDirection = 'asc' | 'desc' | 'none';
export type ThScope = 'col' | 'row';

const DEFAULT_DIRECTION: ThDirection = 'none';
const DEFAULT_SCOPE: ThScope = 'col';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Table header cell. Wraps slotted content in a native `<th>` so AT sees a
 * real header. When `sortable` is set, the cell becomes a clickable target
 * with a chevron icon and emits `sort` events that toggle between
 * ascending and descending.
 *
 * Consumers manage the data: on `sort`, they sort their rows and write
 * `direction="asc" | "desc"` back onto the active cell. The parent
 * `<foundry-table>` clears `direction` on sibling sortable cells so only
 * one column shows the active indicator at a time.
 *
 * The host carries `display: contents` so the inner native `<th>`
 * participates directly in the parent row's table layout.
 *
 * @element foundry-th
 * @summary Table header cell with optional sortable affordance.
 *
 * @attr {boolean} sortable - When set, the cell becomes a clickable
 *   button-like target that emits `sort` events. Reflects.
 * @attr {'asc' | 'desc' | 'none'} direction - Current sort direction.
 *   Defaults to `none`. Reflects. Mirrors onto `aria-sort` of the inner
 *   `<th>`.
 * @attr {'col' | 'row'} scope - Forwarded as the inner `<th scope>`.
 *   Defaults to `col`. Reflects.
 *
 * @slot - The header label.
 *
 * @csspart cell - The inner native `<th>` element.
 * @csspart button - The clickable button (only rendered when `sortable`).
 * @csspart icon - The sort-direction chevron SVG.
 *
 * @fires sort - Bubbles + composed. Fires on click / Enter / Space
 *   activation of a sortable header. `event.detail.direction` is the
 *   *next* direction (`'asc'` from none/desc, `'desc'` from asc).
 *
 * @cssprop [--foundry-table-header-font-weight] - Header text weight.
 * @cssprop [--foundry-table-cell-padding-block] - Cell vertical padding.
 * @cssprop [--foundry-table-cell-padding-inline] - Cell horizontal padding.
 * @cssprop [--foundry-th-focus-outline] - Focus ring color for the
 *   sortable button.
 */
export class FoundryTh extends FoundryElement {
  static override properties = {
    sortable: { type: Boolean, reflect: true, default: false },
    direction: {
      type: String,
      reflect: true,
      default: DEFAULT_DIRECTION satisfies ThDirection,
    },
    scope: {
      type: String,
      reflect: true,
      default: DEFAULT_SCOPE satisfies ThScope,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-th'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTh);
    }
  }

  #cell: HTMLTableCellElement | undefined;
  #button: HTMLButtonElement | undefined;
  #slot: HTMLSlotElement | undefined;

  override connected(): void {
    this.#cell = this.refs['cell'] as HTMLTableCellElement | undefined;
    /* v8 ignore next -- defensive; template always provides the cell ref */
    if (!this.#cell) return;

    if (!this.hasAttribute('role')) this.setAttribute('role', 'presentation');

    // Cache the original slot so we can move it between the bare cell and
    // the button wrapper as `sortable` toggles.
    this.#slot = this.#cell.querySelector('slot') ?? undefined;

    // Reflect the default scope onto the host so selector-based styling
    // and consumer introspection work identically whether or not scope
    // was explicitly set.
    if (!this.hasAttribute('scope')) this.setAttribute('scope', DEFAULT_SCOPE);

    this.#syncScope();
    this.#syncSortable();
    this.#syncDirection();
  }

  override propertyChanged(name: string): void {
    if (name === 'sortable') {
      this.#syncSortable();
      this.#syncDirection();
    } else if (name === 'direction') {
      this.#syncDirection();
    } else if (name === 'scope') {
      this.#syncScope();
    }
  }

  #syncScope(): void {
    /* v8 ignore next -- defensive; #cell always set after connect */
    if (!this.#cell) return;
    const scope = (this.readProperty('scope') as ThScope | undefined) ?? DEFAULT_SCOPE;
    this.#cell.setAttribute('scope', scope);
  }

  #syncSortable(): void {
    /* v8 ignore next -- defensive; #cell always set after connect */
    if (!this.#cell || !this.#slot) return;
    const sortable = Boolean(this.readProperty('sortable'));

    if (sortable && !this.#button) {
      // Build the button wrapper once and move the existing slot inside it.
      // Native <button> handles Enter + Space → click synthesis, so we only
      // need a click listener here.
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('part', 'button');
      button.appendChild(this.#slot);
      button.appendChild(this.#renderChevron());
      button.addEventListener('click', this.#onActivate);
      this.#cell.appendChild(button);
      this.#button = button;
    } else if (!sortable && this.#button) {
      // Move the slot back to the bare cell and tear down the button.
      this.#button.removeEventListener('click', this.#onActivate);
      this.#cell.appendChild(this.#slot);
      this.#button.remove();
      this.#button = undefined;
    }
  }

  #syncDirection(): void {
    /* v8 ignore next -- defensive; #cell always set after connect */
    if (!this.#cell) return;
    const direction = this.#readDirection();
    const sortable = Boolean(this.readProperty('sortable'));
    if (!sortable) {
      this.#cell.removeAttribute('aria-sort');
      return;
    }
    const ariaValue = direction === 'asc'
      ? 'ascending'
      : direction === 'desc'
        ? 'descending'
        : 'none';
    this.#cell.setAttribute('aria-sort', ariaValue);
  }

  #readDirection(): ThDirection {
    const raw = (this.readProperty('direction') as string | undefined) ?? DEFAULT_DIRECTION;
    if (raw === 'asc' || raw === 'desc') return raw;
    return 'none';
  }

  #onActivate = (): void => {
    const current = this.#readDirection();
    // none → asc; asc → desc; desc → asc (matches MUI / shadcn UX).
    const next: 'asc' | 'desc' = current === 'asc' ? 'desc' : 'asc';
    this.dispatchEvent(new CustomEvent('sort', {
      bubbles: true,
      composed: true,
      detail: { direction: next },
    }));
  };

  #renderChevron(): SVGElement {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('part', 'icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const poly = document.createElementNS(SVG_NS, 'polyline');
    poly.setAttribute('points', '6 9 12 15 18 9');
    svg.appendChild(poly);
    return svg;
  }
}
