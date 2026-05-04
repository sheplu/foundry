import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryPanel } from '../panel/panel.ts';
import { FoundryTab } from '../tab/tab.ts';
import templateHtml from './tabs.template.html?raw';
import styleCss from './tabs.css?inline';

export type TabsOrientation = 'horizontal' | 'vertical';

const DEFAULT_ORIENTATION: TabsOrientation = 'horizontal';

let nextHostId = 0;

/**
 * Accessible tabbed interface. Parent component that coordinates a set of
 * `<foundry-tab>` children (in the `tab` slot) with `<foundry-panel>`
 * children (in the default slot). Tabs and panels are auto-paired by DOM
 * order — the first tab activates the first panel, the second tab the
 * second panel, and so on.
 *
 * The component implements the WAI-ARIA APG **tabs pattern with manual
 * activation**: Arrow keys move focus between tabs but do not activate
 * them; Enter, Space, or click activates the focused tab. This pattern
 * is preferred when panel content is non-trivial to render (network
 * fetches, heavy DOM).
 *
 * Keyboard axis flips with `orientation`: horizontal uses Arrow Left /
 * Right; vertical uses Arrow Up / Down. Home / End always jump to the
 * first / last enabled tab. Disabled tabs are skipped.
 *
 * Stable IDs are generated per instance so assistive tech can
 * cross-reference each tab with its panel via `aria-controls` and
 * `aria-labelledby`. Consumer-supplied IDs are preserved.
 *
 * @element foundry-tabs
 * @summary Accessible tabbed interface with manual-activation semantics.
 *
 * @attr {string} value - The resolvedValue of the currently-active tab.
 *   Two-way synced; writing activates the matching tab. Reflects.
 * @attr {'horizontal' | 'vertical'} orientation - Tablist layout axis.
 *   Defaults to `horizontal`. Reflects.
 *
 * @slot tab - Holds `<foundry-tab>` children rendered in the tablist.
 * @slot - Default slot. Holds `<foundry-panel>` children rendered in the
 *   panel area.
 *
 * @csspart container - Outer wrapper (tablist + panels).
 * @csspart tablist - The tablist row/column.
 * @csspart panels - The panel-slot container.
 *
 * @fires change - Bubbles + composed. `event.detail.value` is the new
 *   active tab's value. Fires on user-initiated activation and
 *   programmatic `value` changes.
 *
 * @cssprop [--foundry-tabs-gap] - Gap between tablist and panels.
 * @cssprop [--foundry-tabs-tablist-border-color] - Tablist divider color.
 * @cssprop [--foundry-tabs-tablist-border-width] - Tablist divider width.
 */
export class FoundryTabs extends FoundryElement {
  static override properties = {
    value: { type: String, reflect: true, default: '' },
    orientation: {
      type: String,
      reflect: true,
      default: DEFAULT_ORIENTATION satisfies TabsOrientation,
    },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-tabs'): void {
    FoundryTab.define();
    FoundryPanel.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTabs);
    }
  }

  #tablist: HTMLElement | undefined;
  #tabSlot: HTMLSlotElement | undefined;
  #panelSlot: HTMLSlotElement | undefined;
  #tabs: FoundryTab[] = [];
  #panels: FoundryPanel[] = [];
  #idPrefix = '';
  // Suppress the `value` propertyChanged feedback loop when we flip the
  // property from inside user-input or slotchange paths.
  #applyingUserInput = false;
  // Tracks the last value that #applyValue actually committed. Used to
  // decide whether to emit `change` — decoupled from the `value` attribute
  // (which may have been written to before #applyValue ran) so emit logic
  // is based on observable pair-state change, not intermediate writes.
  #lastAppliedValue = '';

  override connected(): void {
    this.#tablist = this.refs['tablist'] as HTMLElement | undefined;
    this.#tabSlot = this.refs['tabSlot'] as HTMLSlotElement | undefined;
    this.#panelSlot = this.refs['panelSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#tablist || !this.#tabSlot || !this.#panelSlot) return;

    this.#idPrefix = `foundry-tabs-${++nextHostId}`;

    // Reflect default orientation + aria-orientation onto the host + tablist.
    if (!this.hasAttribute('orientation')) {
      this.setAttribute('orientation', DEFAULT_ORIENTATION);
    }
    this.#syncAriaOrientation();

    this.#tabSlot.addEventListener('slotchange', this.#onSlotChange);
    this.#panelSlot.addEventListener('slotchange', this.#onSlotChange);
    this.#tablist.addEventListener('keydown', this.#onTablistKeydown);
    this.#tablist.addEventListener('click', this.#onTablistClick);

    this.#readChildren();
    this.#applyValue(/* emitChange */ false);
  }

  override disconnected(): void {
    this.#tabSlot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#panelSlot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#tablist?.removeEventListener('keydown', this.#onTablistKeydown);
    this.#tablist?.removeEventListener('click', this.#onTablistClick);
  }

  override propertyChanged(name: string): void {
    if (this.#applyingUserInput) return;
    // Before connect, refs aren't wired yet. The initial value/orientation
    // are applied once in connected(); skip early attribute-change paths.
    if (!this.#tablist) return;
    if (name === 'value') {
      this.#applyValue(/* emitChange */ true);
    } else if (name === 'orientation') {
      this.#syncAriaOrientation();
    }
  }

  /** Snapshot of discovered `<foundry-tab>` children. */
  get tabs(): readonly FoundryTab[] {
    return this.#tabs;
  }

  /** Snapshot of discovered `<foundry-panel>` children. */
  get panels(): readonly FoundryPanel[] {
    return this.#panels;
  }

  #onSlotChange = (): void => {
    this.#readChildren();
    this.#applyValue(/* emitChange */ false);
  };

  #readChildren(): void {
    /* v8 ignore next -- defensive; connected() guarantees slots */
    if (!this.#tabSlot || !this.#panelSlot) return;

    const tabs: FoundryTab[] = [];
    for (const el of this.#tabSlot.assignedElements({ flatten: true })) {
      if (el instanceof FoundryTab) {
        if (!el.id) el.id = `${this.#idPrefix}-tab-${tabs.length}`;
        tabs.push(el);
      }
    }

    const panels: FoundryPanel[] = [];
    for (const el of this.#panelSlot.assignedElements({ flatten: true })) {
      if (el instanceof FoundryPanel) {
        if (!el.id) el.id = `${this.#idPrefix}-panel-${panels.length}`;
        panels.push(el);
      }
    }

    this.#tabs = tabs;
    this.#panels = panels;
    this.#wirePairs();
  }

  // Cross-link each tab with its paired panel (same index).
  #wirePairs(): void {
    const n = Math.max(this.#tabs.length, this.#panels.length);
    for (let i = 0; i < n; i += 1) {
      const tab = this.#tabs[i];
      const panel = this.#panels[i];
      if (tab && panel) {
        tab.setAttribute('aria-controls', panel.id);
        panel.setAttribute('aria-labelledby', tab.id);
      }
    }
  }

  // Resolve the active tab and toggle selected flags across every pair.
  // Emits a change event when `emitChange` is true AND the resolved value
  // differs from the last *applied* value (tracked via #lastAppliedValue).
  #applyValue(emitChange: boolean): void {
    // With no tabs yet (parent connected before slotted children upgraded),
    // do nothing — a subsequent slotchange will re-run #applyValue with the
    // real children, and we preserve the `value` attribute until then.
    if (this.#tabs.length === 0) return;

    const target = this.#resolveTarget();
    const newValue = target?.resolvedValue ?? '';
    const valueChanged = this.#lastAppliedValue !== newValue;

    // Keep the `value` attribute in sync without re-entering propertyChanged.
    const currentAttr = (this.readProperty('value') as string) ?? '';
    if (currentAttr !== newValue) {
      this.#applyingUserInput = true;
      (this as unknown as { value: string }).value = newValue;
      this.#applyingUserInput = false;
    }

    // Update tabs + panels.
    for (let i = 0; i < this.#tabs.length; i += 1) {
      const tab = this.#tabs[i];
      if (!tab) continue;
      const isSelected = tab === target;
      if ((tab as unknown as { selected: boolean }).selected !== isSelected) {
        (tab as unknown as { selected: boolean }).selected = isSelected;
      }
      const panel = this.#panels[i];
      if (panel) {
        const panelSelected = isSelected;
        if ((panel as unknown as { selected: boolean }).selected !== panelSelected) {
          (panel as unknown as { selected: boolean }).selected = panelSelected;
        }
      }
    }

    this.#lastAppliedValue = newValue;
    if (target) this.#scrollTabIntoView(target);

    if (valueChanged && emitChange) {
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: newValue },
      }));
    }
  }

  // Preference order: attribute value > first tab with `selected` > first enabled.
  #resolveTarget(): FoundryTab | undefined {
    const v = (this.readProperty('value') as string) ?? '';
    if (v !== '') {
      const match = this.#tabs.find(
        (t) => !t.hasAttribute('disabled') && t.resolvedValue === v,
      );
      if (match) return match;
    }
    const preselected = this.#tabs.find(
      (t) => t.hasAttribute('selected') && !t.hasAttribute('disabled'),
    );
    if (preselected) return preselected;
    return this.#tabs.find((t) => !t.hasAttribute('disabled'));
  }

  #scrollTabIntoView(tab: FoundryTab): void {
    /* v8 ignore next -- jsdom doesn't implement scrollIntoView meaningfully;
       real-browser behavior is verified by functional tests */
    tab.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }

  #syncAriaOrientation(): void {
    /* v8 ignore next -- defensive; tablist set in connected() */
    if (!this.#tablist) return;
    const o = (this.readProperty('orientation') as TabsOrientation) ?? DEFAULT_ORIENTATION;
    this.#tablist.setAttribute('aria-orientation', o);
  }

  // --- Interaction -----------------------------------------------------

  #onTablistClick = (event: MouseEvent): void => {
    const tab = this.#findTabFromEvent(event);
    if (!tab || tab.hasAttribute('disabled')) return;
    this.#activate(tab);
  };

  #onTablistKeydown = (event: KeyboardEvent): void => {
    const key = event.key;
    const orientation = (this.readProperty('orientation') as TabsOrientation)
      ?? DEFAULT_ORIENTATION;

    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const inactiveKey = orientation === 'vertical' ? 'ArrowLeft' : 'ArrowUp';
    const inactiveAltKey = orientation === 'vertical' ? 'ArrowRight' : 'ArrowDown';

    if (key === prevKey) {
      event.preventDefault();
      this.#moveFocus(-1);
      return;
    }
    if (key === nextKey) {
      event.preventDefault();
      this.#moveFocus(1);
      return;
    }
    // Off-axis arrows are no-ops (the WAI-ARIA APG explicitly does not
    // reassign them — they would confuse screen-reader users).
    if (key === inactiveKey || key === inactiveAltKey) return;

    if (key === 'Home') {
      event.preventDefault();
      this.#focusTab(this.#firstEnabled());
      return;
    }
    if (key === 'End') {
      event.preventDefault();
      this.#focusTab(this.#lastEnabled());
      return;
    }
    if (key === 'Enter' || key === ' ') {
      const focused = this.#focusedTab();
      if (focused && !focused.hasAttribute('disabled')) {
        event.preventDefault();
        this.#activate(focused);
      }
    }
  };

  #findTabFromEvent(event: Event): FoundryTab | undefined {
    const path = event.composedPath();
    for (const node of path) {
      if (node instanceof FoundryTab && this.#tabs.includes(node)) return node;
    }
    return undefined;
  }

  #enabled(): FoundryTab[] {
    return this.#tabs.filter((t) => !t.hasAttribute('disabled'));
  }

  #firstEnabled(): FoundryTab | undefined {
    return this.#enabled()[0];
  }

  #lastEnabled(): FoundryTab | undefined {
    const e = this.#enabled();
    return e[e.length - 1];
  }

  // Element currently holding focus among our tabs (may be undefined).
  #focusedTab(): FoundryTab | undefined {
    const root = this.getRootNode() as Document | ShadowRoot;
    const active = (root as Document | ShadowRoot).activeElement;
    return this.#tabs.find((t) => t === active);
  }

  // Move focus among enabled tabs by delta, wrapping. Manual-activation:
  // this does NOT activate the focused tab.
  #moveFocus(delta: 1 | -1): void {
    const enabled = this.#enabled();
    if (enabled.length === 0) return;
    const current = this.#focusedTab();
    const currentIdx = current && enabled.includes(current)
      ? enabled.indexOf(current)
      : -1;
    const nextIdx = currentIdx === -1
      ? (delta > 0 ? 0 : enabled.length - 1)
      : (currentIdx + delta + enabled.length) % enabled.length;
    this.#focusTab(enabled[nextIdx]);
  }

  #focusTab(tab: FoundryTab | undefined): void {
    if (!tab) return;
    // Manual-activation: focused tab becomes tabbable so Shift+Tab can
    // still return to the previous control.
    tab.focus();
  }

  #activate(tab: FoundryTab): void {
    if ((this.readProperty('value') as string) === tab.resolvedValue) {
      // Same tab — no state change, but make sure focus lands on it (click
      // on an already-active tab is still a legitimate focus intent).
      tab.focus();
      return;
    }
    // Programmatic value write → triggers #applyValue via propertyChanged.
    (this as unknown as { value: string }).value = tab.resolvedValue;
    tab.focus();
  }
}
