import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryPagination } from '../pagination/pagination.ts';
import templateHtml from './table-pagination.template.html?raw';
import styleCss from './table-pagination.css?inline';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SIBLING_COUNT = 1;
const DEFAULT_PREV_LABEL = 'Previous';
const DEFAULT_NEXT_LABEL = 'Next';
const DEFAULT_PAGE_LABEL = 'Go to page';
const DEFAULT_ELLIPSIS_LABEL = 'More pages';

/**
 * Client-side paginated table wrapper. Wraps a single `<foundry-table>` in
 * its default slot, hides rows that aren't on the current page, and renders
 * a `<foundry-pagination>` below the table that drives the active page.
 *
 * Auto-counts rows: the wrapper queries `<foundry-tr>` descendants of the
 * slotted `<foundry-tbody>` and computes `total = ceil(rows / pageSize)`.
 * Consumer provides only `page-size` (default 10) and optionally writes
 * `page` to navigate programmatically.
 *
 * Sort-reset: when a `sort` event bubbles from a child `<foundry-th>`, the
 * wrapper resets `page` to 1 (matches MUI / shadcn UX). Consumers can
 * stop the propagation in their own listener if they want to keep the
 * current page after a sort.
 *
 * Mutation handling: a `MutationObserver` rooted at the slotted table
 * picks up consumer-driven row mutations (add / remove / replace) so the
 * wrapper recomputes `total` and re-applies row visibility automatically.
 *
 * @element foundry-table-pagination
 * @summary Paginated wrapper for `<foundry-table>` — one component, no JS needed.
 *
 * @attr {number} page - Current 1-indexed page. Defaults to 1. Reflects.
 * @attr {number} page-size - Rows per page. Defaults to 10. Reflects (camel: `pageSize`).
 * @attr {number} sibling-count - Forwarded to the inner `<foundry-pagination>`.
 *   Reflects (camel: `siblingCount`).
 * @attr {string} prev-label - Forwarded to the inner pagination.
 * @attr {string} next-label - Forwarded.
 * @attr {string} page-label - Forwarded.
 * @attr {string} ellipsis-label - Forwarded.
 *
 * @slot - The `<foundry-table>` element with all its rows.
 *
 * @csspart wrapper - The outer flex column.
 * @csspart pagination-row - The flex row holding the pagination.
 * @csspart pagination - The inner `<foundry-pagination>`.
 *
 * @fires change - Bubbles + composed. Re-emitted from the inner pagination
 *   so consumers can listen on the wrapper. `event.detail.page` is the new
 *   1-indexed page.
 *
 * @cssprop [--foundry-table-pagination-gap] - Vertical gap between table + pagination.
 * @cssprop [--foundry-table-pagination-align] - Horizontal alignment of the
 *   pagination row (`flex-start` / `center` / `flex-end`). Defaults to `flex-end`.
 */
export class FoundryTablePagination extends FoundryElement {
  static override properties = {
    page: { type: Number, reflect: true, default: DEFAULT_PAGE },
    pageSize: { type: Number, reflect: true, default: DEFAULT_PAGE_SIZE },
    siblingCount: {
      type: Number,
      reflect: true,
      default: DEFAULT_SIBLING_COUNT,
    },
    prevLabel: { type: String, reflect: true, default: DEFAULT_PREV_LABEL },
    nextLabel: { type: String, reflect: true, default: DEFAULT_NEXT_LABEL },
    pageLabel: { type: String, reflect: true, default: DEFAULT_PAGE_LABEL },
    ellipsisLabel: {
      type: String,
      reflect: true,
      default: DEFAULT_ELLIPSIS_LABEL,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-table-pagination'): void {
    FoundryPagination.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTablePagination);
    }
  }

  #slot: HTMLSlotElement | undefined;
  #pagination: FoundryPagination | undefined;
  #table: HTMLElement | undefined;
  #rows: HTMLElement[] = [];
  #rowMutationObserver: MutationObserver | undefined;
  // Suppress feedback loops when we write `page` from inside the
  // pagination-change path.
  #applyingUserInput = false;

  override connected(): void {
    this.#slot = this.refs['slot'] as HTMLSlotElement | undefined;
    this.#pagination = this.refs['pagination'] as FoundryPagination | undefined;
    /* v8 ignore next -- defensive; template always provides slot + pagination */
    if (!this.#slot || !this.#pagination) return;

    this.#slot.addEventListener('slotchange', this.#onSlotChange);
    this.#pagination.addEventListener('change', this.#onPaginationChange);
    this.addEventListener('sort', this.#onSort);

    this.#syncPaginationLabels();
    this.#onSlotChange();
  }

  override disconnected(): void {
    this.#slot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#pagination?.removeEventListener('change', this.#onPaginationChange);
    this.removeEventListener('sort', this.#onSort);
    this.#rowMutationObserver?.disconnect();
    this.#rowMutationObserver = undefined;
  }

  override propertyChanged(name: string): void {
    if (name === 'page' || name === 'pageSize') {
      if (this.#applyingUserInput) return;
      this.#applyPagination();
    } else if (
      name === 'siblingCount'
      || name === 'prevLabel'
      || name === 'nextLabel'
      || name === 'pageLabel'
      || name === 'ellipsisLabel'
    ) {
      this.#syncPaginationLabels();
    }
  }

  /** Number of pages derived from current row count + page size. */
  get totalPages(): number {
    const rows = this.#rows.length;
    const size = this.#readPageSize();
    return Math.max(1, Math.ceil(rows / size));
  }

  /** Snapshot of `<foundry-tr>` elements currently shown on the active page. */
  get visibleRows(): readonly HTMLElement[] {
    return this.#rows.filter((r) => !r.hasAttribute('hidden'));
  }

  // --- Slot + mutation observer -------------------------------------

  #onSlotChange = (): void => {
    /* v8 ignore next -- defensive; #slot always set after connect */
    if (!this.#slot) return;
    const assigned = this.#slot.assignedElements({ flatten: true });
    this.#table = assigned.find(
      (el) => el.tagName.toLowerCase() === 'foundry-table',
    ) as HTMLElement | undefined;

    this.#rowMutationObserver?.disconnect();
    if (this.#table) {
      this.#rowMutationObserver = new MutationObserver(() => {
        this.#refreshRows();
        this.#applyPagination();
      });
      this.#rowMutationObserver.observe(this.#table, {
        childList: true,
        subtree: true,
      });
    } else {
      this.#rowMutationObserver = undefined;
    }

    this.#refreshRows();
    this.#applyPagination();
  };

  #refreshRows(): void {
    if (!this.#table) {
      this.#rows = [];
      return;
    }
    this.#rows = Array.from(
      this.#table.querySelectorAll<HTMLElement>('foundry-tbody foundry-tr'),
    );
  }

  // --- Pagination ----------------------------------------------------

  #applyPagination(): void {
    /* v8 ignore next -- defensive; connected() guarantees #pagination */
    if (!this.#pagination) return;

    const size = this.#readPageSize();
    const total = this.#rows.length;
    const totalPages = Math.max(1, Math.ceil(total / size));

    // Clamp page to valid range.
    let page = this.#readPage();
    if (page < 1) page = 1;
    else if (page > totalPages) page = totalPages;

    // Sync clamped value back to the host attribute (without re-entering
    // propertyChanged → applyPagination).
    if ((this.readProperty('page') as number) !== page) {
      this.#applyingUserInput = true;
      (this as unknown as { page: number }).page = page;
      this.#applyingUserInput = false;
    }

    // Hide rows outside the [start, end) window.
    const start = (page - 1) * size;
    const end = start + size;
    for (let i = 0; i < this.#rows.length; i += 1) {
      const row = this.#rows[i];
      if (!row) continue;
      const inWindow = i >= start && i < end;
      row.toggleAttribute('hidden', !inWindow);
    }

    // Update the inner pagination's total + page, suppressing its own
    // change-event re-entry while we set them.
    this.#applyingUserInput = true;
    (this.#pagination as unknown as { total: number }).total = totalPages;
    (this.#pagination as unknown as { page: number }).page = page;
    this.#applyingUserInput = false;
  }

  #onPaginationChange = (event: Event): void => {
    if (this.#applyingUserInput) return;
    const detail = (event as CustomEvent<{ page: number }>).detail;
    this.#applyingUserInput = true;
    (this as unknown as { page: number }).page = detail.page;
    this.#applyingUserInput = false;
    this.#applyPagination();
    // Re-dispatch the change event from the host so consumers can listen
    // on the wrapper instead of reaching into the shadow root.
    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { page: detail.page },
    }));
  };

  #onSort = (event: Event): void => {
    // Sort events bubble from <foundry-th sortable> children inside the
    // slotted table. Resetting to page 1 matches MUI / shadcn behavior.
    const target = event.target;
    /* v8 ignore next -- defensive; sort events always carry an Element target */
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName.toLowerCase() !== 'foundry-th') return;
    if ((this.readProperty('page') as number) === 1) return;
    this.#applyingUserInput = true;
    (this as unknown as { page: number }).page = 1;
    this.#applyingUserInput = false;
    this.#applyPagination();
  };

  // --- Helpers -------------------------------------------------------

  #syncPaginationLabels(): void {
    /* v8 ignore next -- defensive; connected() guarantees #pagination */
    if (!this.#pagination) return;
    const sibling = Number(this.readProperty('siblingCount'));
    if (Number.isFinite(sibling) && sibling >= 0) {
      (this.#pagination as unknown as { siblingCount: number }).siblingCount
        = Math.trunc(sibling);
    }
    /* v8 ignore start -- empty-label fallbacks are uninteresting; defaults
       apply when consumers don't override */
    (this.#pagination as unknown as { prevLabel: string }).prevLabel
      = (this.readProperty('prevLabel') as string) || DEFAULT_PREV_LABEL;
    (this.#pagination as unknown as { nextLabel: string }).nextLabel
      = (this.readProperty('nextLabel') as string) || DEFAULT_NEXT_LABEL;
    (this.#pagination as unknown as { pageLabel: string }).pageLabel
      = (this.readProperty('pageLabel') as string) || DEFAULT_PAGE_LABEL;
    (this.#pagination as unknown as { ellipsisLabel: string }).ellipsisLabel
      = (this.readProperty('ellipsisLabel') as string) || DEFAULT_ELLIPSIS_LABEL;
    /* v8 ignore stop */
  }

  #readPageSize(): number {
    const raw = Number(this.readProperty('pageSize'));
    if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_PAGE_SIZE;
    return Math.trunc(raw);
  }

  #readPage(): number {
    const raw = Number(this.readProperty('page'));
    /* v8 ignore next -- defensive; attribute coercion filters NaN to null
       which Number() turns into 0 (a finite value); kept for symmetry */
    if (!Number.isFinite(raw)) return DEFAULT_PAGE;
    return Math.trunc(raw);
  }
}
