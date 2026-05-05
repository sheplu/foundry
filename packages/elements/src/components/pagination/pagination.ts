import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './pagination.template.html?raw';
import styleCss from './pagination.css?inline';

const DEFAULT_PAGE = 1;
const DEFAULT_TOTAL = 1;
const DEFAULT_SIBLING_COUNT = 1;
const DEFAULT_PREV_LABEL = 'Previous';
const DEFAULT_NEXT_LABEL = 'Next';
const DEFAULT_PAGE_LABEL = 'Go to page';
const DEFAULT_ELLIPSIS_LABEL = 'More pages';

type Token = number | 'ellipsis-start' | 'ellipsis-end';

/**
 * Controlled page selector. Renders a `<nav>` with a prev button,
 * numbered page buttons (with ellipsis truncation), and a next button.
 * Consumers own the `page` attribute; the component emits a `change`
 * event with `detail.page` when the user activates a page, and the
 * consumer writes the new value back.
 *
 * Truncation rule: always show page 1 and page `total`, plus
 * `siblingCount` neighbors on each side of the current page, with
 * ellipses filling the gaps. Totals ≤ 7 render every page.
 *
 * Prev/next are always present; they're `disabled` at page 1 and page
 * `total` respectively. Keyboard: Arrow-Left/Right move focus across
 * enabled buttons; Home/End jump to first/last; Enter / Space / click
 * activate the focused button.
 *
 * @element foundry-pagination
 * @summary Controlled page selector with truncated page-number list.
 *
 * @attr {number} page - Current 1-indexed page. Default 1. Reflects.
 * @attr {number} total - Total number of pages (≥ 1). Default 1. Reflects.
 * @attr {number} sibling-count - Neighbors of current page to always show.
 *   Default 1. Reflects.
 * @attr {string} prev-label - Screen-reader label for the prev button.
 *   Default `Previous`.
 * @attr {string} next-label - Screen-reader label for the next button.
 *   Default `Next`.
 * @attr {string} page-label - Prefix for per-button aria-labels
 *   (`"{page-label} 3"`). Default `Go to page`.
 * @attr {string} ellipsis-label - aria-label for the `…` separator.
 *   Default `More pages`.
 *
 * @csspart nav - The outer `<nav>` wrapper.
 * @csspart list - The inline `<ul>`.
 * @csspart prev - The prev button.
 * @csspart next - The next button.
 * @csspart page - Any numbered page button.
 * @csspart page-current - The currently-active page button (carries
 *   `aria-current="page"`, in addition to the `page` part).
 * @csspart ellipsis - The `…` separator span.
 * @csspart icon - Chevron SVG inside prev/next.
 *
 * @fires change - Bubbles + composed. `event.detail.page` is the new
 *   1-indexed page. Fires on click/Enter/Space activation; does not
 *   fire on arrow-only focus movement.
 *
 * @cssprop [--foundry-pagination-gap] - Spacing between buttons.
 * @cssprop [--foundry-pagination-button-size] - Square size of each button.
 * @cssprop [--foundry-pagination-radius] - Button corner radius.
 * @cssprop [--foundry-pagination-background] - Idle background.
 * @cssprop [--foundry-pagination-background-hover] - Hover background.
 * @cssprop [--foundry-pagination-foreground] - Idle foreground.
 * @cssprop [--foundry-pagination-border-color] - Button border color.
 * @cssprop [--foundry-pagination-focus-outline] - Focus ring color.
 * @cssprop [--foundry-pagination-font-weight] - Idle font weight.
 * @cssprop [--foundry-pagination-background-current] - Current-page fill.
 * @cssprop [--foundry-pagination-foreground-current] - Current-page text.
 * @cssprop [--foundry-pagination-font-weight-current] - Current-page weight.
 */
export class FoundryPagination extends FoundryElement {
  static override properties = {
    page: { type: Number, reflect: true, default: DEFAULT_PAGE },
    total: { type: Number, reflect: true, default: DEFAULT_TOTAL },
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

  static define(tag = 'foundry-pagination'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryPagination);
    }
  }

  #list: HTMLUListElement | undefined;

  override connected(): void {
    this.#list = this.refs['list'] as HTMLUListElement | undefined;
    /* v8 ignore next -- defensive; template always provides the list */
    if (!this.#list) return;

    this.#list.addEventListener('click', this.#onClick);
    this.#list.addEventListener('keydown', this.#onKeydown);
    this.#render();
  }

  override disconnected(): void {
    this.#list?.removeEventListener('click', this.#onClick);
    this.#list?.removeEventListener('keydown', this.#onKeydown);
  }

  override propertyChanged(name: string): void {
    if (
      name === 'page'
      || name === 'total'
      || name === 'siblingCount'
      || name === 'prevLabel'
      || name === 'nextLabel'
      || name === 'pageLabel'
      || name === 'ellipsisLabel'
    ) {
      this.#render();
    }
  }

  // --- Core: compute the tokens to render ------------------------------

  #computeTokens(page: number, total: number, siblingCount: number): Token[] {
    // Pages we always want to render: 1, total, and current ± sibling.
    // When those ranges abut (or overlap), skip the ellipsis.
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const leftSibling = Math.max(page - siblingCount, 1);
    const rightSibling = Math.min(page + siblingCount, total);

    // Show ellipsis only when there's a gap ≥ 2 between the boundary and
    // the sibling range. If the gap is exactly 1, expand to render that
    // page instead of the ellipsis (cleaner visually).
    const showLeftEllipsis = leftSibling > 3;
    const showRightEllipsis = rightSibling < total - 2;

    const tokens: Token[] = [];

    // Left edge
    if (!showLeftEllipsis) {
      for (let i = 1; i < leftSibling; i += 1) tokens.push(i);
    } else {
      tokens.push(1);
      tokens.push('ellipsis-start');
    }

    // Middle range (sibling window around current).
    for (let i = leftSibling; i <= rightSibling; i += 1) tokens.push(i);

    // Right edge
    if (!showRightEllipsis) {
      for (let i = rightSibling + 1; i <= total; i += 1) tokens.push(i);
    } else {
      tokens.push('ellipsis-end');
      tokens.push(total);
    }

    return tokens;
  }

  // --- Render ---------------------------------------------------------

  #render(): void {
    /* v8 ignore next -- defensive; connected() guarantees #list */
    if (!this.#list) return;

    const { page, total, siblingCount } = this.#readSettings();
    const prevLabel = (this.readProperty('prevLabel') as string) ?? DEFAULT_PREV_LABEL;
    const nextLabel = (this.readProperty('nextLabel') as string) ?? DEFAULT_NEXT_LABEL;
    const pageLabel = (this.readProperty('pageLabel') as string) ?? DEFAULT_PAGE_LABEL;
    const ellipsisLabel
      = (this.readProperty('ellipsisLabel') as string) ?? DEFAULT_ELLIPSIS_LABEL;

    const tokens = this.#computeTokens(page, total, siblingCount);

    this.#list.textContent = '';

    // Outer nav's aria-label uses prevLabel/nextLabel context; the list
    // itself is generic. A dedicated aria-label on nav makes the screen
    // reader announce "Pagination navigation".
    const nav = this.refs['nav'] as HTMLElement | undefined;
    nav?.setAttribute('aria-label', 'pagination');

    // Prev
    this.#list.appendChild(
      this.#renderButton({
        part: 'prev',
        label: prevLabel,
        icon: 'left',
        page: page - 1,
        disabled: page <= 1,
      }),
    );

    // Page / ellipsis tokens.
    for (const token of tokens) {
      if (token === 'ellipsis-start' || token === 'ellipsis-end') {
        this.#list.appendChild(this.#renderEllipsis(ellipsisLabel));
        continue;
      }
      this.#list.appendChild(
        this.#renderPageButton(token, token === page, pageLabel),
      );
    }

    // Next
    this.#list.appendChild(
      this.#renderButton({
        part: 'next',
        label: nextLabel,
        icon: 'right',
        page: page + 1,
        disabled: page >= total,
      }),
    );
  }

  #renderButton(opts: {
    part: 'prev' | 'next';
    label: string;
    icon: 'left' | 'right';
    page: number;
    disabled: boolean;
  }): HTMLLIElement {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('part', opts.part);
    button.setAttribute('aria-label', opts.label);
    button.dataset['page'] = String(opts.page);
    if (opts.disabled) {
      button.setAttribute('disabled', '');
      button.setAttribute('aria-disabled', 'true');
    }
    button.appendChild(this.#renderChevron(opts.icon));
    li.appendChild(button);
    return li;
  }

  #renderPageButton(n: number, isCurrent: boolean, labelPrefix: string): HTMLLIElement {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute(
      'part',
      isCurrent ? 'page page-current' : 'page',
    );
    button.setAttribute('aria-label', `${labelPrefix} ${n}`);
    button.textContent = String(n);
    button.dataset['page'] = String(n);
    if (isCurrent) {
      button.setAttribute('aria-current', 'page');
    }
    li.appendChild(button);
    return li;
  }

  #renderEllipsis(label: string): HTMLLIElement {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.setAttribute('part', 'ellipsis');
    span.setAttribute('aria-label', label);
    span.textContent = '…';
    li.appendChild(span);
    return li;
  }

  #renderChevron(direction: 'left' | 'right'): SVGElement {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('part', 'icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const poly = document.createElementNS(svgNS, 'polyline');
    poly.setAttribute(
      'points',
      direction === 'left' ? '15 18 9 12 15 6' : '9 6 15 12 9 18',
    );
    svg.appendChild(poly);
    return svg;
  }

  // --- Interaction ---------------------------------------------------

  #onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('button[data-page]');
    if (!(button instanceof HTMLButtonElement)) return;
    if (button.hasAttribute('disabled')) return;
    const requested = Number(button.dataset['page']);
    if (!Number.isFinite(requested)) return;

    const { page, total } = this.#readSettings();
    const clamped = Math.max(1, Math.min(total, Math.trunc(requested)));
    if (clamped === page) return; // Click on current page is a no-op.

    this.dispatchEvent(new CustomEvent('change', {
      bubbles: true,
      composed: true,
      detail: { page: clamped },
    }));
  };

  #onKeydown = (event: KeyboardEvent): void => {
    /* v8 ignore next -- defensive; keydown fires only while list exists */
    if (!this.#list) return;
    const buttons = this.#focusableButtons();
    /* v8 ignore next -- defensive; list always contains prev/next */
    if (buttons.length === 0) return;
    const active = event.target instanceof HTMLElement ? event.target : null;
    if (!active || !buttons.includes(active as HTMLButtonElement)) return;

    const key = event.key;
    if (key === 'ArrowRight') {
      event.preventDefault();
      this.#moveFocus(buttons, active as HTMLButtonElement, 1);
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      this.#moveFocus(buttons, active as HTMLButtonElement, -1);
    } else if (key === 'Home') {
      event.preventDefault();
      buttons[0]?.focus();
    } else if (key === 'End') {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    }
  };

  #focusableButtons(): HTMLButtonElement[] {
    /* v8 ignore next -- defensive; #list is always set after connect */
    if (!this.#list) return [];
    return Array.from(
      this.#list.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
    );
  }

  #moveFocus(
    buttons: HTMLButtonElement[],
    from: HTMLButtonElement,
    delta: 1 | -1,
  ): void {
    const idx = buttons.indexOf(from);
    /* v8 ignore next -- defensive; caller guarantees from is in the list */
    if (idx === -1) return;
    const nextIdx = (idx + delta + buttons.length) % buttons.length;
    buttons[nextIdx]?.focus();
  }

  // --- Helpers -------------------------------------------------------

  #readSettings(): { page: number; total: number; siblingCount: number } {
    const rawTotal = Number(this.readProperty('total') ?? DEFAULT_TOTAL);
    const total = Number.isFinite(rawTotal) && rawTotal >= 1
      ? Math.trunc(rawTotal)
      : DEFAULT_TOTAL;
    const rawPage = Number(this.readProperty('page') ?? DEFAULT_PAGE);
    const pageCandidate = Number.isFinite(rawPage) ? Math.trunc(rawPage) : DEFAULT_PAGE;
    const page = Math.max(1, Math.min(total, pageCandidate));
    const rawSibling = Number(
      this.readProperty('siblingCount') ?? DEFAULT_SIBLING_COUNT,
    );
    const siblingCount = Number.isFinite(rawSibling) && rawSibling >= 0
      ? Math.trunc(rawSibling)
      : DEFAULT_SIBLING_COUNT;
    return { page, total, siblingCount };
  }
}
