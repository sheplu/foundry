import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './table.template.html?raw';
import styleCss from './table.css?inline';

export type TableVariant = 'default' | 'striped';

const DEFAULT_VARIANT: TableVariant = 'default';
const DEFAULT_LABEL = 'Data table';

/**
 * Themed table primitive. Wraps consumer-provided `<foundry-thead>`,
 * `<foundry-tbody>`, `<foundry-tr>`, `<foundry-th>`, and `<foundry-td>`
 * children in a native `<table>` so screen readers + keyboard navigation
 * see a real table (better than CSS `display: table` workarounds for row
 * spanning, header association, and column-by-column announcements).
 *
 * The host coordinates one-column-sorted-at-a-time: when any descendant
 * `<foundry-th>` fires a `sort` event, the table clears `direction` on
 * every other sortable header in its subtree. Consumers manage the data
 * + write the new direction back onto the active cell.
 *
 * @element foundry-table
 * @summary Themed semantic table with sort coordination across header cells.
 *
 * @attr {'default' | 'striped'} variant - Visual treatment.
 *   `striped` adds alternating row backgrounds. Defaults to `default`.
 *   Reflects.
 * @attr {boolean} bordered - Outer border + cell dividers. Reflects.
 * @attr {boolean} compact - Tighter row padding. Reflects.
 * @attr {string} label - Accessible label forwarded as `aria-label` on the
 *   inner `<table>`. Defaults to `Data table`.
 *
 * @slot - `<foundry-thead>` / `<foundry-tbody>` / `<foundry-tr>` children.
 *
 * @csspart table - The inner native `<table>` element.
 *
 * @cssprop [--foundry-table-background] - Table background color.
 * @cssprop [--foundry-table-foreground] - Table text color.
 * @cssprop [--foundry-table-border-color] - Border color (bordered variant).
 * @cssprop [--foundry-table-radius] - Outer corner radius.
 * @cssprop [--foundry-table-stripe-color] - Striped-row background.
 * @cssprop [--foundry-table-row-padding-compact] - Compact row padding.
 */
export class FoundryTable extends FoundryElement {
  static override properties = {
    variant: {
      type: String,
      reflect: true,
      default: DEFAULT_VARIANT satisfies TableVariant,
    },
    bordered: { type: Boolean, reflect: true, default: false },
    compact: { type: Boolean, reflect: true, default: false },
    label: { type: String, reflect: true, default: DEFAULT_LABEL },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-table'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTable);
    }
  }

  #table: HTMLTableElement | undefined;

  override connected(): void {
    this.#table = this.refs['table'] as HTMLTableElement | undefined;
    /* v8 ignore next -- defensive; template always provides the table ref */
    if (!this.#table) return;

    if (!this.hasAttribute('variant')) {
      this.setAttribute('variant', DEFAULT_VARIANT);
    }
    this.#syncLabel();

    // Sort events bubble + compose from <foundry-th> children. Listen at
    // the host so we can clear sibling directions to enforce the
    // one-column-sorted-at-a-time UX.
    this.addEventListener('sort', this.#onSort);
  }

  override disconnected(): void {
    this.removeEventListener('sort', this.#onSort);
  }

  override propertyChanged(name: string): void {
    if (name === 'label') {
      this.#syncLabel();
    }
  }

  #syncLabel(): void {
    /* v8 ignore next -- defensive; #table set in connected() */
    if (!this.#table) return;
    /* v8 ignore next -- defensive; label has a property default */
    const label = (this.readProperty('label') as string | undefined) || DEFAULT_LABEL;
    this.#table.setAttribute('aria-label', label);
  }

  #onSort = (event: Event): void => {
    const originator = event.target;
    if (!(originator instanceof HTMLElement)) return;
    // Clear `direction` on every other sortable header in the subtree —
    // the consumer's listener will write the new direction onto the
    // originator after sorting their data.
    const headers = this.querySelectorAll('foundry-th');
    for (const th of headers) {
      if (th === originator) continue;
      if (th.hasAttribute('sortable')) {
        th.setAttribute('direction', 'none');
      }
    }
  };
}
