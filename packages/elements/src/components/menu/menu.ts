import { FoundryElement } from '../../core/foundry-element.ts';
import { PopoverController } from '../../core/popover-controller.ts';
import { type PopoverPlacement } from '../../core/position.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryMenuitem } from '../menuitem/menuitem.ts';
import templateHtml from './menu.template.html?raw';
import styleCss from './menu.css?inline';

const DEFAULT_PLACEMENT: PopoverPlacement = 'bottom';
const DEFAULT_OFFSET = 4;

let nextId = 0;

/**
 * Action menu — a popover surface of `<foundry-menuitem>` children anchored
 * to a consumer-slotted trigger. Clicking (or Enter/Space-activating) an
 * item fires a bubbling + composed `select` event with `detail.value` and
 * auto-closes the menu; consumers can `preventDefault()` the event to keep
 * the menu open (e.g. multi-select filter menus).
 *
 * Behavior mirrors the WAI-ARIA menu pattern:
 *  - Click the trigger to open; click outside (browser light-dismiss) or
 *    press Escape (browser light-dismiss) to close.
 *  - Arrow keys move the active descendant (skipping disabled items);
 *    Home/End jump to first/last.
 *  - Enter / Space on the focused trigger open the menu (seeded on the
 *    first enabled item); the same keys invoke the active item once open.
 *
 * @element foundry-menu
 * @summary Action menu with popover surface, keyboard navigation, and
 *   `select` event dispatch.
 *
 * @attr {boolean} open - Reflected. Tracks popover open state; managed by
 *   the component + browser light-dismiss.
 * @attr {'top' | 'bottom' | 'left' | 'right'} placement - Preferred
 *   anchoring side. Default `bottom`.
 *
 * @slot - The trigger element. First assigned element is wired;
 *   additional slotted content is ignored for interaction.
 * @slot items - Holds `<foundry-menuitem>` children.
 *
 * @csspart surface - The popover root (`role="menu"`).
 *
 * @fires select - Bubbles + composed. `event.detail.value` is the invoked
 *   item's resolvedValue. Cancelable: `preventDefault()` suppresses the
 *   auto-close.
 *
 * @cssprop [--foundry-menu-background] - Surface background.
 * @cssprop [--foundry-menu-foreground] - Surface text color.
 * @cssprop [--foundry-menu-padding] - Surface inner padding.
 * @cssprop [--foundry-menu-radius] - Surface corner radius.
 * @cssprop [--foundry-menu-border-color] - Surface border color.
 * @cssprop [--foundry-menu-border-width] - Surface border width.
 * @cssprop [--foundry-menu-shadow] - Surface drop shadow.
 * @cssprop [--foundry-menu-offset] - Distance between trigger and surface.
 * @cssprop [--foundry-menu-min-inline-size] - Minimum surface width.
 * @cssprop [--foundry-menu-max-block-size] - Maximum surface height.
 * @cssprop [--foundry-menu-transition] - Surface fade duration.
 */
export class FoundryMenu extends FoundryElement {
  static override properties = {
    open: { type: Boolean, reflect: true, default: false },
    placement: {
      type: String,
      reflect: true,
      default: DEFAULT_PLACEMENT satisfies PopoverPlacement,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-menu'): void {
    FoundryMenuitem.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryMenu);
    }
  }

  #surface: HTMLElement | undefined;
  #triggerSlot: HTMLSlotElement | undefined;
  #itemsSlot: HTMLSlotElement | undefined;
  #trigger: HTMLElement | undefined;
  #items: FoundryMenuitem[] = [];
  #active: FoundryMenuitem | undefined;
  #controller: PopoverController | undefined;
  #surfaceId = '';
  #itemIdPrefix = '';
  // When the trigger is clicked while the menu is open, popover="auto"'s
  // light-dismiss fires on pointerdown and closes the surface. Without
  // the capture here the click handler would re-open it immediately.
  #wasOpenAtPointerdown = false;
  // Swallow the browser-synthesised click that follows Enter / Space on
  // a focused <button> trigger — the keydown handler already opened
  // the menu; the click would run show() again.
  #suppressNextTriggerClick = false;

  override connected(): void {
    this.#surface = this.refs['surface'] as HTMLElement | undefined;
    this.#triggerSlot = this.refs['triggerSlot'] as HTMLSlotElement | undefined;
    this.#itemsSlot = this.refs['itemsSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#surface || !this.#triggerSlot || !this.#itemsSlot) return;

    const id = ++nextId;
    this.#surfaceId = `foundry-menu-${id}`;
    this.#itemIdPrefix = `foundry-menu-${id}-item-`;
    this.#surface.id = this.#surfaceId;

    if (!this.hasAttribute('placement')) {
      this.setAttribute('placement', DEFAULT_PLACEMENT);
    }

    this.#controller = new PopoverController({
      host: this,
      surface: this.#surface,
      getAnchor: () => this.#trigger,
      getPlacement: () =>
        (this.readProperty('placement') as PopoverPlacement) ?? DEFAULT_PLACEMENT,
      offset: DEFAULT_OFFSET,
    });
    this.#controller.attach();

    this.#triggerSlot.addEventListener('slotchange', this.#onTriggerSlotChange);
    this.#itemsSlot.addEventListener('slotchange', this.#onItemsSlotChange);
    this.#surface.addEventListener('toggle', this.#onSurfaceToggle);
    this.#surface.addEventListener('click', this.#onSurfaceClick);
    this.#surface.addEventListener('pointermove', this.#onSurfacePointerMove);

    this.#resolveTrigger();
    this.#readItems();
  }

  override disconnected(): void {
    this.#detachTriggerWiring();
    this.#triggerSlot?.removeEventListener('slotchange', this.#onTriggerSlotChange);
    this.#itemsSlot?.removeEventListener('slotchange', this.#onItemsSlotChange);
    this.#surface?.removeEventListener('toggle', this.#onSurfaceToggle);
    this.#surface?.removeEventListener('click', this.#onSurfaceClick);
    this.#surface?.removeEventListener('pointermove', this.#onSurfacePointerMove);
    this.#controller?.detach();
    this.#controller = undefined;
  }

  override propertyChanged(name: string): void {
    if (name === 'placement') {
      if (this.#controller?.isOpen) this.#controller.reposition();
    }
  }

  /** Snapshot of discovered `<foundry-menuitem>` children. */
  get items(): readonly FoundryMenuitem[] {
    return this.#items;
  }

  /** Open the menu. No-op if already open. */
  show(): void {
    if (!this.#controller || this.#controller.isOpen) return;
    this.#setActive(this.#firstEnabled());
    this.#controller.show();
  }

  /** Close the menu. No-op if already closed. */
  hide(): void {
    if (!this.#controller?.isOpen) return;
    this.#controller.hide();
  }

  /** Flip the menu open/closed. */
  toggle(): void {
    if (this.#controller?.isOpen) this.hide();
    else this.show();
  }

  // --- Trigger wiring (popover pattern) -------------------------------

  #onTriggerSlotChange = (): void => {
    this.#detachTriggerWiring();
    this.#resolveTrigger();
  };

  #resolveTrigger(): void {
    /* v8 ignore next -- defensive; connected() guarantees #triggerSlot */
    if (!this.#triggerSlot) return;
    const assigned = this.#triggerSlot.assignedElements();
    const next = assigned[0] instanceof HTMLElement ? assigned[0] : undefined;
    this.#trigger = next;
    if (!next) return;

    next.addEventListener('pointerdown', this.#onTriggerPointerdown);
    next.addEventListener('click', this.#onTriggerClick);
    next.addEventListener('keydown', this.#onTriggerKeydown);
    next.setAttribute('aria-haspopup', 'menu');
    next.setAttribute('aria-controls', this.#surfaceId);
    next.setAttribute('aria-expanded', 'false');
  }

  #detachTriggerWiring(): void {
    const t = this.#trigger;
    if (!t) return;
    t.removeEventListener('pointerdown', this.#onTriggerPointerdown);
    t.removeEventListener('click', this.#onTriggerClick);
    t.removeEventListener('keydown', this.#onTriggerKeydown);
    if (t.getAttribute('aria-controls') === this.#surfaceId) {
      t.removeAttribute('aria-controls');
    }
    t.removeAttribute('aria-haspopup');
    t.removeAttribute('aria-expanded');
    t.removeAttribute('aria-activedescendant');
    this.#trigger = undefined;
  }

  #onTriggerPointerdown = (): void => {
    this.#wasOpenAtPointerdown = this.#controller?.isOpen ?? false;
  };

  #onTriggerClick = (): void => {
    if (this.#suppressNextTriggerClick) {
      this.#suppressNextTriggerClick = false;
      return;
    }
    if (this.#wasOpenAtPointerdown) {
      this.#wasOpenAtPointerdown = false;
      return;
    }
    this.show();
  };

  #onTriggerKeydown = (event: KeyboardEvent): void => {
    const key = event.key;
    const isOpen = this.#controller?.isOpen ?? false;

    if (!isOpen) {
      if (
        key === 'ArrowDown'
        || key === 'ArrowUp'
        || key === 'Enter'
        || key === ' '
        || key === 'Home'
        || key === 'End'
      ) {
        event.preventDefault();
        this.#suppressNextTriggerClick = true;
        this.show();
        if (key === 'End' || key === 'ArrowUp') {
          this.#setActive(this.#lastEnabled());
        }
      }
      return;
    }

    switch (key) {
      case 'Escape':
        // Let the browser handle light-dismiss; still preventDefault
        // so nothing else intercepts.
        event.preventDefault();
        this.hide();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.#suppressNextTriggerClick = true;
        if (this.#active && !this.#active.hasAttribute('disabled')) {
          this.#invoke(this.#active);
        }
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.#moveActive(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.#moveActive(-1);
        return;
      case 'Home':
        event.preventDefault();
        this.#setActive(this.#firstEnabled());
        return;
      case 'End':
        event.preventDefault();
        this.#setActive(this.#lastEnabled());
    }
  };

  // --- Surface event wiring -------------------------------------------

  #onSurfaceToggle = (event: Event): void => {
    const next = (event as Event & { newState?: string }).newState;
    if (next === 'open') {
      this.#trigger?.setAttribute('aria-expanded', 'true');
    } else if (next === 'closed') {
      this.#trigger?.setAttribute('aria-expanded', 'false');
      this.#trigger?.removeAttribute('aria-activedescendant');
      this.#setActive(undefined);
    }
  };

  #onSurfaceClick = (event: MouseEvent): void => {
    const item = this.#findItemFromEvent(event);
    if (!item || item.hasAttribute('disabled')) return;
    this.#invoke(item);
  };

  #onSurfacePointerMove = (event: PointerEvent): void => {
    const item = this.#findItemFromEvent(event);
    if (!item || item === this.#active) return;
    if (item.hasAttribute('disabled')) return;
    this.#setActive(item);
  };

  #findItemFromEvent(event: Event): FoundryMenuitem | undefined {
    const path = event.composedPath();
    for (const node of path) {
      if (node instanceof FoundryMenuitem && this.#items.includes(node)) return node;
    }
    return undefined;
  }

  // --- Items + active descendant --------------------------------------

  #onItemsSlotChange = (): void => {
    this.#readItems();
    // If the active item was removed, clear the highlight.
    if (this.#active && !this.#items.includes(this.#active)) {
      this.#setActive(this.#controller?.isOpen ? this.#firstEnabled() : undefined);
    }
  };

  #readItems(): void {
    /* v8 ignore next -- defensive; connected() guarantees #itemsSlot */
    if (!this.#itemsSlot) return;
    const assigned = this.#itemsSlot.assignedElements({ flatten: true });
    const items: FoundryMenuitem[] = [];
    for (const el of assigned) {
      if (el instanceof FoundryMenuitem) {
        if (!el.id) el.id = `${this.#itemIdPrefix}${items.length}`;
        items.push(el);
      }
    }
    this.#items = items;
  }

  #moveActive(delta: 1 | -1): void {
    const enabled = this.#enabledItems();
    if (enabled.length === 0) return;
    const current = this.#active && enabled.includes(this.#active)
      ? enabled.indexOf(this.#active)
      : delta > 0 ? -1 : enabled.length;
    const nextIdx = (current + delta + enabled.length) % enabled.length;
    this.#setActive(enabled[nextIdx]);
  }

  #setActive(item: FoundryMenuitem | undefined): void {
    if (this.#active === item) return;
    if (this.#active) {
      (this.#active as unknown as { active: boolean }).active = false;
    }
    this.#active = item;
    if (item) {
      (item as unknown as { active: boolean }).active = true;
      this.#trigger?.setAttribute('aria-activedescendant', item.id);
      if (this.#controller?.isOpen) this.#scrollActiveIntoView();
    } else {
      this.#trigger?.removeAttribute('aria-activedescendant');
    }
  }

  #scrollActiveIntoView(): void {
    /* v8 ignore next -- jsdom doesn't implement scrollIntoView meaningfully;
       real-browser behavior is verified by functional tests */
    this.#active?.scrollIntoView?.({ block: 'nearest' });
  }

  #enabledItems(): FoundryMenuitem[] {
    return this.#items.filter((i) => !i.hasAttribute('disabled'));
  }

  #firstEnabled(): FoundryMenuitem | undefined {
    return this.#enabledItems()[0];
  }

  #lastEnabled(): FoundryMenuitem | undefined {
    const e = this.#enabledItems();
    return e[e.length - 1];
  }

  // Emit the cancelable `select` event. Auto-close unless the consumer
  // calls preventDefault() — that veto lets multi-select menus stay open.
  #invoke(item: FoundryMenuitem): void {
    const event = new CustomEvent('select', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { value: item.resolvedValue },
    });
    this.dispatchEvent(event);
    if (event.defaultPrevented) return;
    this.hide();
    this.#trigger?.focus();
  }
}
