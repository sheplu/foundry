import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './button-group.template.html?raw';
import styleCss from './button-group.css?inline';

export type ButtonGroupMode = 'single' | 'multiple';
export type ButtonGroupOrientation = 'horizontal' | 'vertical';

const DEFAULT_ORIENTATION: ButtonGroupOrientation = 'horizontal';
const DEFAULT_LABEL = 'Button group';

type ChildButton = HTMLElement & { value?: string };

function childValue(el: Element): string {
  return el.getAttribute('value') ?? '';
}

/**
 * Visually groups `<foundry-button>` (or native `<button>`) children with
 * shared borders and flush edges. Opts into toggle behaviour via `mode`:
 * `single` coordinates radio-like pressed state across children; `multiple`
 * allows any subset to be pressed at once. With no `mode`, the group is
 * purely presentational.
 *
 * Selection state lives on the host as the reflected `value` attribute
 * (single string for `mode="single"`, comma-separated list for
 * `mode="multiple"`). The group projects the current selection onto each
 * child via `aria-pressed="true" | "false"`, which also drives the visual
 * pressed treatment in CSS.
 *
 * Each child remains a genuine tab stop (no roving tabindex). Arrow keys
 * (ArrowLeft / ArrowRight, or Up / Down when `orientation="vertical"`) move
 * focus across enabled children as a convenience; they do not activate
 * (manual activation, matching tabs).
 *
 * @element foundry-button-group
 * @summary Grouped buttons with optional single/multi-select toggle coordination.
 *
 * @attr {'single' | 'multiple'} mode - When set, the group coordinates pressed
 *   state across its children. When unset, the group is presentational only.
 *   Reflects.
 * @attr {string} value - Current selection. In `mode="single"`, the single
 *   pressed child's `value`. In `mode="multiple"`, a comma-separated list.
 *   Reflects.
 * @attr {'horizontal' | 'vertical'} orientation - Layout direction.
 *   Defaults to `horizontal`. Reflects.
 * @attr {boolean} disabled - Disables the whole group (pointer-events off +
 *   dimmed). Reflects.
 * @attr {string} label - Accessible label forwarded as `aria-label` on the host.
 *   Defaults to `Button group`. The host also carries `role="radiogroup"`
 *   when `mode="single"` (conveying one-of-N) or `role="group"` otherwise.
 *
 * @slot - Button children. Each should carry a `value` attribute so the group
 *   can identify it.
 *
 * @fires change - Bubbles + composed. Fires on user activation of a child in
 *   a toggle mode. `detail.value` is a string (`mode="single"`) or string[]
 *   (`mode="multiple"`). Does not fire when re-clicking the currently-pressed
 *   child in `mode="single"`, nor on arrow-only focus movement.
 *
 * @cssprop [--foundry-button-group-gap] - Gap between children (defaults to 0).
 * @cssprop [--foundry-button-group-pressed-background] - Pressed-child background.
 * @cssprop [--foundry-button-group-pressed-foreground] - Pressed-child foreground.
 */
export class FoundryButtonGroup extends FoundryElement {
  static override properties = {
    mode: { type: String, reflect: true },
    value: { type: String, reflect: true },
    orientation: {
      type: String,
      reflect: true,
      default: DEFAULT_ORIENTATION satisfies ButtonGroupOrientation,
    },
    disabled: { type: Boolean, reflect: true, default: false },
    label: { type: String, reflect: true, default: DEFAULT_LABEL },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-button-group'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryButtonGroup);
    }
  }

  #slot: HTMLSlotElement | undefined;
  #children: ChildButton[] = [];
  #applyingUserInput = false;

  override connected(): void {
    this.#slot = this.refs['slot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides the slot */
    if (!this.#slot) return;

    // Reflect default orientation onto the host so selector-based styling
    // works identically whether or not orientation was explicitly set.
    if (!this.hasAttribute('orientation')) {
      this.setAttribute('orientation', DEFAULT_ORIENTATION);
    }

    this.#syncRole();
    this.#syncLabel();
    this.#syncOrientation();

    this.#slot.addEventListener('slotchange', this.#onSlotChange);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.#onKeydown);

    this.#readChildren();
    this.#applyValue(false);
  }

  override disconnected(): void {
    this.#slot?.removeEventListener('slotchange', this.#onSlotChange);
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.#onKeydown);
  }

  override propertyChanged(name: string): void {
    if (name === 'mode') {
      this.#syncRole();
      this.#syncOrientation();
      this.#applyValue(false);
    } else if (name === 'value') {
      if (this.#applyingUserInput) return;
      this.#applyValue(false);
    } else if (name === 'orientation') {
      this.#syncOrientation();
    } else if (name === 'label') {
      this.#syncLabel();
    }
    // `disabled` is purely visual (CSS); no extra work on change.
  }

  #syncRole(): void {
    const mode = this.readProperty('mode') as ButtonGroupMode | undefined;
    // For `single`, `radiogroup` conveys one-of-N semantics. For `multiple`
    // and presentation, `group` (a plain landmark) keeps the host a neutral
    // container — each child's `aria-pressed` carries the selection state,
    // which the ARIA toggle-button pattern expects on a non-listbox parent.
    if (mode === 'single') {
      this.setAttribute('role', 'radiogroup');
    } else {
      this.setAttribute('role', 'group');
    }
  }

  #syncLabel(): void {
    const label = (this.readProperty('label') as string | undefined) || DEFAULT_LABEL;
    this.setAttribute('aria-label', label);
  }

  #syncOrientation(): void {
    const orientation
      = (this.readProperty('orientation') as ButtonGroupOrientation | undefined)
        ?? DEFAULT_ORIENTATION;
    // aria-orientation is only valid on roles that accept it (radiogroup,
    // toolbar, tablist, menu, menubar, tree, listbox, scrollbar, separator,
    // slider). For `mode="single"` the host is a radiogroup — forward it.
    // For `group` / presentation, omit it so axe doesn't flag invalid usage.
    const mode = this.readProperty('mode') as ButtonGroupMode | undefined;
    if (mode === 'single') {
      this.setAttribute('aria-orientation', orientation);
    } else {
      this.removeAttribute('aria-orientation');
    }
  }

  #onSlotChange = (): void => {
    this.#readChildren();
    this.#applyValue(false);
  };

  #readChildren(): void {
    /* v8 ignore next -- defensive; connected() guarantees the slot */
    if (!this.#slot) return;
    const nodes = this.#slot.assignedElements({ flatten: true });
    this.#children = nodes.filter(
      (el): el is ChildButton => el.matches('button, foundry-button'),
    ) as ChildButton[];
  }

  #readSelection(): string[] {
    const raw = (this.readProperty('value') as string | undefined) ?? '';
    if (raw === '') return [];
    const mode = this.readProperty('mode') as ButtonGroupMode | undefined;
    if (mode === 'multiple') {
      return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    }
    return [raw];
  }

  #writeSelection(values: string[]): void {
    const mode = this.readProperty('mode') as ButtonGroupMode | undefined;
    const serialized = mode === 'multiple' ? values.join(',') : (values[0] ?? '');
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = serialized;
    this.#applyingUserInput = false;
  }

  #applyValue(emitChange: boolean): void {
    // When children haven't been distributed yet (host connected before slots
    // populate), skip the pass — a subsequent slotchange will re-run with the
    // real children, and the initial `value` attribute is preserved meanwhile.
    if (this.#children.length === 0) return;

    const mode = this.readProperty('mode') as ButtonGroupMode | undefined;
    const selection = new Set(this.#readSelection());

    // Clamp: drop selected values that don't match any current child.
    const childValues = new Set(this.#children.map(childValue).filter((v) => v !== ''));
    let changed = false;
    for (const v of [...selection]) {
      if (!childValues.has(v)) {
        selection.delete(v);
        changed = true;
      }
    }

    // Project pressed state onto each child (only when a mode is active).
    // `pressed` is tri-state on FoundryButton (absent / "true" / "false") —
    // the child forwards it to its inner native button as aria-pressed, so
    // the toggle-button ARIA pattern is satisfied on a real button role.
    for (const child of this.#children) {
      if (mode) {
        const pressed = selection.has(childValue(child));
        child.setAttribute('pressed', pressed ? 'true' : 'false');
      } else {
        child.removeAttribute('pressed');
      }
    }

    if (changed) {
      this.#writeSelection([...selection]);
    }

    if (emitChange) {
      const serialized = [...selection];
      this.dispatchEvent(new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: {
          value: mode === 'multiple' ? serialized : (serialized[0] ?? ''),
        },
      }));
    }
  }

  #onClick = (event: MouseEvent): void => {
    const mode = this.readProperty('mode') as ButtonGroupMode | undefined;
    if (!mode) return;
    if (this.hasAttribute('disabled')) return;

    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest('button, foundry-button');
    if (!button || !this.#children.includes(button as ChildButton)) return;
    if (button.hasAttribute('disabled')) return;

    const v = childValue(button);
    if (v === '') return;

    const selection = new Set(this.#readSelection());
    if (mode === 'single') {
      if (selection.has(v)) return; // Re-click current = no-op.
      selection.clear();
      selection.add(v);
    } else {
      if (selection.has(v)) selection.delete(v);
      else selection.add(v);
    }

    this.#writeSelection([...selection]);
    this.#applyValue(true);
  };

  #onKeydown = (event: KeyboardEvent): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('button, foundry-button');
    if (!button || !this.#children.includes(button as ChildButton)) return;

    const orientation
      = (this.readProperty('orientation') as ButtonGroupOrientation | undefined)
        ?? DEFAULT_ORIENTATION;
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

    if (event.key === nextKey) {
      event.preventDefault();
      this.#moveFocus(button as ChildButton, 1);
    } else if (event.key === prevKey) {
      event.preventDefault();
      this.#moveFocus(button as ChildButton, -1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.#focusFirstEnabled(0, 1);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.#focusFirstEnabled(this.#children.length - 1, -1);
    }
  };

  #focusableChildren(): ChildButton[] {
    return this.#children.filter((c) => !c.hasAttribute('disabled'));
  }

  #moveFocus(from: ChildButton, delta: 1 | -1): void {
    const buttons = this.#focusableChildren();
    /* v8 ignore next -- defensive; no enabled children */
    if (buttons.length === 0) return;
    const idx = buttons.indexOf(from);
    /* v8 ignore next -- defensive; caller just matched on it */
    if (idx === -1) return;
    const next = (idx + delta + buttons.length) % buttons.length;
    buttons[next]?.focus();
  }

  #focusFirstEnabled(start: number, step: 1 | -1): void {
    const n = this.#children.length;
    for (let i = 0; i < n; i += 1) {
      const idx = start + i * step;
      if (idx < 0 || idx >= n) break;
      const c = this.#children[idx];
      if (c && !c.hasAttribute('disabled')) {
        c.focus();
        return;
      }
    }
  }
}
