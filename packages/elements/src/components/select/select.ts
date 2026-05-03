import { FoundryElement } from '../../core/foundry-element.ts';
import { PopoverController } from '../../core/popover-controller.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryOption } from '../option/option.ts';
import templateHtml from './select.template.html?raw';
import styleCss from './select.css?inline';

const DEFAULT_OFFSET = 4;
const TYPEAHEAD_RESET_MS = 500;

let nextListboxId = 0;

/**
 * Themable select form control. Renders a dropdown-style trigger that
 * displays the current selection's label (or a placeholder when none) and
 * a listbox surface opened on click / keyboard. Participates in HTML forms
 * via `ElementInternals` (`static formAssociated = true`).
 *
 * Children are `<foundry-option>` elements; the select discovers them via
 * `slotchange` on the listbox's default slot. `value` is the source of
 * truth — options reflect `selected` based on whether their
 * `resolvedValue` matches.
 *
 * **Open behavior.** The listbox uses the HTML Popover API
 * (`popover="auto"`) so light-dismiss is browser-native: outside click and
 * Escape close it, and another `auto` popover pre-empts this one. The
 * `PopoverController` positions the surface with flip+shift, keeping the
 * host's `open` attribute in sync.
 *
 * **Keyboard (WAI-ARIA listbox pattern).**
 *   - Closed: Enter / Space / ArrowDown / ArrowUp / Home / End → open.
 *   - Open: Arrow keys move the active descendant (skipping disabled
 *     options); Home / End jump to first / last; printable keys start a
 *     typeahead search (resets after 500 ms of inactivity); Enter / Space
 *     commit the active option; Escape closes without committing.
 *
 * Active descendant is tracked via `aria-activedescendant` on the trigger
 * so focus stays on the trigger — the listbox surface is never tabbed
 * through, matching native `<select>` and the WAI-ARIA APG listbox pattern.
 *
 * @element foundry-select
 * @summary Labelled dropdown form control with form association and
 *   keyboard listbox navigation.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {string} value - Current selection. Two-way: reading shows the
 *   selected option's value; writing selects a matching option.
 * @attr {string} placeholder - Text shown when no option is selected.
 * @attr {boolean} required - Marks the field as required. Empty + required
 *   reports `valueMissing`.
 * @attr {boolean} disabled - Disables the trigger; form participation
 *   suppressed. While disabled, the listbox cannot be opened.
 * @attr {boolean} invalid - Reflected. Managed internally; not set by
 *   consumers.
 * @attr {boolean} open - Reflected. Tracks listbox open state; managed by
 *   the component + browser light-dismiss. Consumers read for styling.
 *
 * @slot label - Optional label text above the trigger.
 * @slot - Default slot. `<foundry-option>` children.
 * @slot hint - Optional hint text below the trigger.
 * @slot error - Optional error message shown when `invalid`.
 *
 * @csspart container - Outer flex wrapper (label + control + hint/error
 *   + listbox).
 * @csspart label - The label row.
 * @csspart control - The clickable trigger (native `<button>` inside shadow).
 * @csspart display - The inline wrapper for `value` + `placeholder`.
 * @csspart value - The selected option's label text.
 * @csspart placeholder - The placeholder text (shown when empty).
 * @csspart icon - The chevron-down indicator.
 * @csspart listbox - The popover surface containing slotted options.
 * @csspart hint - The hint row.
 * @csspart error - The error row (visible only when invalid).
 *
 * @cssprop [--foundry-select-gap] - Vertical spacing between parts.
 * @cssprop [--foundry-select-label-font-size] - Label text size.
 * @cssprop [--foundry-select-label-font-weight] - Label font weight.
 * @cssprop [--foundry-select-label-color] - Label text color.
 * @cssprop [--foundry-select-padding] - Trigger padding.
 * @cssprop [--foundry-select-border-color] - Trigger border color.
 * @cssprop [--foundry-select-border-color-invalid] - Trigger border when invalid.
 * @cssprop [--foundry-select-radius] - Trigger corner radius.
 * @cssprop [--foundry-select-background] - Trigger background.
 * @cssprop [--foundry-select-foreground] - Trigger text color.
 * @cssprop [--foundry-select-placeholder-color] - Placeholder text color.
 * @cssprop [--foundry-select-focus-outline] - Focus outline color.
 * @cssprop [--foundry-select-focus-outline-invalid] - Focus outline when invalid.
 * @cssprop [--foundry-select-icon-size] - Chevron icon size.
 * @cssprop [--foundry-select-icon-color] - Chevron icon color.
 * @cssprop [--foundry-select-hint-font-size] - Hint text size.
 * @cssprop [--foundry-select-hint-color] - Hint text color.
 * @cssprop [--foundry-select-error-font-size] - Error text size.
 * @cssprop [--foundry-select-error-color] - Error text color.
 * @cssprop [--foundry-select-listbox-padding] - Listbox padding.
 * @cssprop [--foundry-select-listbox-border-color] - Listbox border color.
 * @cssprop [--foundry-select-listbox-radius] - Listbox corner radius.
 * @cssprop [--foundry-select-listbox-background] - Listbox background.
 * @cssprop [--foundry-select-listbox-foreground] - Listbox text color.
 * @cssprop [--foundry-select-listbox-shadow] - Listbox drop shadow.
 * @cssprop [--foundry-select-listbox-min-inline-size] - Listbox min width.
 */
export class FoundrySelect extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true, default: '' },
    placeholder: { type: String, reflect: true },
    required: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
    invalid: { type: Boolean, reflect: true, default: false },
    open: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-select'): void {
    FoundryOption.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundrySelect);
    }
  }

  #internals: ElementInternals | undefined;
  #control: HTMLButtonElement | undefined;
  #valueEl: HTMLElement | undefined;
  #placeholderEl: HTMLElement | undefined;
  #listbox: HTMLElement | undefined;
  #optionsSlot: HTMLSlotElement | undefined;
  #options: FoundryOption[] = [];
  #selected: FoundryOption | undefined;
  #active: FoundryOption | undefined;
  #controller: PopoverController | undefined;
  #listboxId = '';
  #optionIdPrefix = '';
  // Initial value snapshot, captured on first connect so formResetCallback
  // can restore exactly what the author declared in HTML.
  #initialValue = '';
  // Native light-dismiss fires on pointerdown before click; capture open
  // state so the click handler can distinguish "clicked trigger to close"
  // from "clicked trigger to open."
  #wasOpenAtPointerdown = false;
  // Swallow the browser-synthesised click that follows an Enter / Space
  // keypress on the focused <button>. The keydown handler has already
  // processed the key; re-running show() from click would race the commit.
  #suppressNextClick = false;
  // Typeahead buffer + reset timer; behaves like native <select>.
  #typeaheadBuffer = '';
  #typeaheadTimer: ReturnType<typeof setTimeout> | undefined;

  override connected(): void {
    /* v8 ignore next -- re-connect path; attach only once per element */
    if (!this.#internals) {
      try {
        this.#internals = this.attachInternals();
      } catch {
        // jsdom (used by unit tests) doesn't fully implement ElementInternals.
        // Leave #internals undefined; form-association features are validated
        // in web-test-runner (real browser).
      }
    }

    this.#control = this.refs['control'] as HTMLButtonElement | undefined;
    this.#valueEl = this.refs['value'] as HTMLElement | undefined;
    this.#placeholderEl = this.refs['placeholder'] as HTMLElement | undefined;
    this.#listbox = this.refs['listbox'] as HTMLElement | undefined;
    this.#optionsSlot = this.refs['optionsSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- guard against missing template refs; unreachable in practice */
    if (!this.#control || !this.#listbox || !this.#optionsSlot) return;

    this.#initialValue = (this.readProperty('value') as string) ?? '';

    const id = ++nextListboxId;
    this.#listboxId = `foundry-select-listbox-${id}`;
    this.#optionIdPrefix = `foundry-select-option-${id}-`;
    this.#listbox.id = this.#listboxId;
    this.#control.setAttribute('aria-controls', this.#listboxId);

    this.#controller = new PopoverController({
      host: this,
      surface: this.#listbox,
      getAnchor: () => this.#control,
      getPlacement: () => 'bottom',
      offset: DEFAULT_OFFSET,
    });
    this.#controller.attach();

    // Native toggle event keeps #open + aria-expanded in sync when the
    // browser dismisses the popover (outside click, Escape, stack pre-emption).
    this.#listbox.addEventListener('toggle', this.#onListboxToggle);
    this.#control.addEventListener('pointerdown', this.#onTriggerPointerdown);
    this.#control.addEventListener('click', this.#onTriggerClick);
    this.#control.addEventListener('keydown', this.#onTriggerKeydown);
    this.#listbox.addEventListener('click', this.#onListboxClick);
    this.#listbox.addEventListener('pointermove', this.#onListboxPointerMove);

    this.#optionsSlot.addEventListener('slotchange', this.#onSlotChange);
    this.#readOptions();
    this.#applyValue();
    this.#wireSlotChanges();
    this.#syncDisabled();
    this.#syncPlaceholder();
    this.#syncValidity();
  }

  override disconnected(): void {
    this.#optionsSlot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#listbox?.removeEventListener('toggle', this.#onListboxToggle);
    this.#control?.removeEventListener('pointerdown', this.#onTriggerPointerdown);
    this.#control?.removeEventListener('click', this.#onTriggerClick);
    this.#control?.removeEventListener('keydown', this.#onTriggerKeydown);
    this.#listbox?.removeEventListener('click', this.#onListboxClick);
    this.#listbox?.removeEventListener('pointermove', this.#onListboxPointerMove);
    this.#clearTypeahead();
    this.#controller?.detach();
    this.#controller = undefined;
  }

  override propertyChanged(name: string): void {
    if (name === 'value') {
      this.#applyValue();
    } else if (name === 'placeholder') {
      this.#syncPlaceholder();
    } else if (name === 'required') {
      this.#syncValidity();
    } else if (name === 'disabled') {
      this.#syncDisabled();
      // Disabling a select while open would leave it hanging; close it.
      if (this.readProperty('disabled') && this.#controller?.isOpen) {
        this.#controller.hide();
      }
    }
  }

  formResetCallback(): void {
    (this as unknown as { value: string }).value = this.#initialValue;
  }

  formDisabledCallback(disabled: boolean): void {
    (this as unknown as { disabled: boolean }).disabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
    (this as unknown as { value: string }).value = state ?? '';
  }

  get form(): HTMLFormElement | null {
    const f = this.#internals as unknown as { form?: HTMLFormElement } | undefined;
    return f?.form ?? null;
  }

  get validity(): ValidityState | undefined {
    const i = this.#internals as unknown as { validity?: ValidityState } | undefined;
    return i?.validity;
  }

  get validationMessage(): string {
    const i = this.#internals as unknown as { validationMessage?: string } | undefined;
    return i?.validationMessage ?? '';
  }

  checkValidity(): boolean {
    const fn = (this.#internals as unknown as { checkValidity?: () => boolean } | undefined)
      ?.checkValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    return true;
  }

  reportValidity(): boolean {
    const fn = (this.#internals as unknown as { reportValidity?: () => boolean } | undefined)
      ?.reportValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    return true;
  }

  override focus(options?: FocusOptions): void {
    this.#control?.focus(options);
  }

  /** Currently-selected `<foundry-option>` or undefined when nothing matches. */
  get selectedOption(): FoundryOption | undefined {
    return this.#selected;
  }

  /** Snapshot of discovered `<foundry-option>` children. */
  get options(): readonly FoundryOption[] {
    return this.#options;
  }

  /** Open the listbox. No-op when disabled or already open. */
  show(): void {
    if (this.readProperty('disabled')) return;
    if (!this.#controller || this.#controller.isOpen) return;
    // Seed active descendant from the current selection (or first enabled).
    this.#setActive(this.#selected ?? this.#firstEnabled());
    this.#controller.show();
  }

  /** Close the listbox. No-op when already closed. */
  hide(): void {
    if (!this.#controller?.isOpen) return;
    this.#controller.hide();
  }

  /** Toggle the listbox open/closed. */
  toggle(): void {
    if (this.#controller?.isOpen) this.hide();
    else this.show();
  }

  #onSlotChange = (): void => {
    this.#readOptions();
    this.#applyValue();
    // Active descendant may now point at a removed option — re-resolve.
    if (this.#active && !this.#options.includes(this.#active)) {
      this.#setActive(this.#selected ?? this.#firstEnabled());
    }
  };

  #readOptions(): void {
    /* v8 ignore next -- defensive; connected() guarantees #optionsSlot */
    if (!this.#optionsSlot) return;
    const assigned = this.#optionsSlot.assignedElements({ flatten: true });
    const next: FoundryOption[] = [];
    for (const el of assigned) {
      if (el instanceof FoundryOption) {
        if (!el.id) el.id = `${this.#optionIdPrefix}${next.length}`;
        next.push(el);
      }
    }
    this.#options = next;
  }

  #applyValue(): void {
    const v = (this.readProperty('value') as string) ?? '';
    const next = v === '' ? undefined : this.#options.find((o) => o.resolvedValue === v);

    for (const opt of this.#options) {
      const shouldSelect = opt === next;
      if ((opt as unknown as { selected: boolean }).selected !== shouldSelect) {
        (opt as unknown as { selected: boolean }).selected = shouldSelect;
      }
    }

    this.#selected = next;
    this.toggleAttribute('has-value', Boolean(next));
    if (this.#valueEl) {
      this.#valueEl.textContent = next ? (next.textContent ?? '').trim() : '';
    }

    this.#reportFormValue();
    this.#syncValidity();
  }

  #syncPlaceholder(): void {
    if (!this.#placeholderEl) return;
    const p = (this.readProperty('placeholder') as string | undefined) ?? '';
    this.#placeholderEl.textContent = p;
  }

  #syncDisabled(): void {
    if (!this.#control) return;
    const d = Boolean(this.readProperty('disabled'));
    if (d) this.#control.setAttribute('disabled', '');
    else this.#control.removeAttribute('disabled');
  }

  #wireSlotChanges(): void {
    this.#wireSlot('labelSlot', 'has-label');
    this.#wireSlot('hintSlot', 'has-hint');
    this.#wireSlot('errorSlot', 'has-error');
  }

  #wireSlot(refName: string, hostAttr: string): void {
    const slot = this.refs[refName] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these slot refs */
    if (!slot) return;
    const sync = (): void => {
      const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        /* v8 ignore next -- named slots only accept elements with slot=, so
           bare text nodes can't reach here in practice */
        return (n.textContent ?? '').trim().length > 0;
      });
      this.toggleAttribute(hostAttr, hasContent);
      this.#syncDescribedBy();
    };
    slot.addEventListener('slotchange', sync);
    sync();
  }

  #syncDescribedBy(): void {
    /* v8 ignore next -- defensive; called only from sync paths after connect */
    if (!this.#control) return;
    const ids: string[] = [];
    if (this.hasAttribute('has-hint')) ids.push('hint');
    const isInvalid = Boolean(this.readProperty('invalid'));
    const hasError = this.hasAttribute('has-error');
    if (isInvalid && hasError) {
      ids.push('err');
      this.#control.setAttribute('aria-errormessage', 'err');
    } else {
      this.#control.removeAttribute('aria-errormessage');
    }
    if (ids.length === 0) this.#control.removeAttribute('aria-describedby');
    else this.#control.setAttribute('aria-describedby', ids.join(' '));
    this.#control.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
  }

  #reportFormValue(): void {
    const v = (this.readProperty('value') as string) ?? '';
    const fn = (this.#internals as unknown as {
      setFormValue?: (v: string | null | FormData | File) => void;
    } | undefined)?.setFormValue;
    if (typeof fn === 'function') fn.call(this.#internals, v === '' ? null : v);
  }

  #syncValidity(): void {
    const required = Boolean(this.readProperty('required'));
    const v = (this.readProperty('value') as string) ?? '';
    const missing = required && v === '';
    const setValidity = (this.#internals as unknown as {
      setValidity?: (flags: ValidityStateFlags, message?: string, anchor?: HTMLElement) => void;
    } | undefined)?.setValidity;

    if (missing) {
      if (typeof setValidity === 'function') {
        setValidity.call(
          this.#internals,
          { valueMissing: true },
          'Please select an option.',
          this.#control,
        );
      }
      (this as unknown as { invalid: boolean }).invalid = true;
    } else {
      if (typeof setValidity === 'function') setValidity.call(this.#internals, {});
      (this as unknown as { invalid: boolean }).invalid = false;
    }
    this.#syncDescribedBy();
  }

  // --- Open/close wiring -----------------------------------------------

  #onListboxToggle = (event: Event): void => {
    const next = (event as Event & { newState?: string }).newState;
    if (next === 'open') {
      (this as unknown as { open: boolean }).open = true;
      this.#control?.setAttribute('aria-expanded', 'true');
      // Scroll the active option into view now that the listbox is in the
      // top layer and has real layout.
      if (this.#active) this.#scrollActiveIntoView();
    } else if (next === 'closed') {
      (this as unknown as { open: boolean }).open = false;
      this.#control?.setAttribute('aria-expanded', 'false');
      this.#setActive(undefined);
      this.#clearTypeahead();
    }
  };

  #onTriggerPointerdown = (): void => {
    this.#wasOpenAtPointerdown = this.#controller?.isOpen ?? false;
  };

  #onTriggerClick = (): void => {
    if (this.#suppressNextClick) {
      this.#suppressNextClick = false;
      return;
    }
    if (this.readProperty('disabled')) return;
    if (this.#wasOpenAtPointerdown) {
      // The browser's light-dismiss already closed the listbox on pointerdown.
      this.#wasOpenAtPointerdown = false;
      return;
    }
    this.show();
  };

  #onTriggerKeydown = (event: KeyboardEvent): void => {
    if (this.readProperty('disabled')) return;
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
        this.#suppressNextClick = true;
        this.show();
        if (key === 'Home') this.#setActive(this.#firstEnabled());
        else if (key === 'End') this.#setActive(this.#lastEnabled());
        return;
      }
      // Typeahead on a closed listbox opens + jumps, matching native <select>.
      if (this.#isTypeaheadKey(event)) {
        event.preventDefault();
        this.#suppressNextClick = true;
        this.show();
        this.#applyTypeahead(key);
      }
      return;
    }

    switch (key) {
      case 'Escape':
        event.preventDefault();
        this.hide();
        return;
      case 'Tab':
        // Tab commits the active option and closes (matches native <select>
        // focus behavior). Do NOT preventDefault — let focus move on.
        if (this.#active && !this.#active.hasAttribute('disabled')) {
          this.#commit(this.#active);
        }
        this.hide();
        return;
      case 'Enter':
        event.preventDefault();
        this.#suppressNextClick = true;
        if (this.#active && !this.#active.hasAttribute('disabled')) {
          this.#commit(this.#active);
        }
        this.hide();
        return;
      case ' ':
        // Space commits when the typeahead buffer is empty; extends the
        // buffer when it isn't (matches native <select>'s "New York" case).
        event.preventDefault();
        if (this.#typeaheadBuffer === '') {
          this.#suppressNextClick = true;
          if (this.#active && !this.#active.hasAttribute('disabled')) {
            this.#commit(this.#active);
          }
          this.hide();
        } else {
          this.#applyTypeahead(' ');
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
        return;
      default:
        if (this.#isTypeaheadKey(event)) {
          event.preventDefault();
          this.#applyTypeahead(key);
        }
    }
  };

  #onListboxClick = (event: MouseEvent): void => {
    const option = this.#findOptionFromEvent(event);
    if (!option || option.hasAttribute('disabled')) return;
    this.#commit(option);
    this.hide();
    // Return focus to the trigger so the keyboard flow resumes cleanly.
    this.#control?.focus();
  };

  #onListboxPointerMove = (event: PointerEvent): void => {
    const option = this.#findOptionFromEvent(event);
    if (!option || option === this.#active) return;
    if (option.hasAttribute('disabled')) return;
    this.#setActive(option);
  };

  #findOptionFromEvent(event: Event): FoundryOption | undefined {
    const path = event.composedPath();
    for (const node of path) {
      if (node instanceof FoundryOption && this.#options.includes(node)) return node;
    }
    return undefined;
  }

  // --- Keyboard helpers -----------------------------------------------

  #moveActive(delta: 1 | -1): void {
    const enabled = this.#enabledOptions();
    if (enabled.length === 0) return;
    const current = this.#active && enabled.includes(this.#active)
      ? enabled.indexOf(this.#active)
      : delta > 0 ? -1 : enabled.length;
    const nextIdx = (current + delta + enabled.length) % enabled.length;
    this.#setActive(enabled[nextIdx]);
  }

  #setActive(option: FoundryOption | undefined): void {
    if (this.#active === option) return;
    if (this.#active) {
      (this.#active as unknown as { active: boolean }).active = false;
    }
    this.#active = option;
    if (option) {
      (option as unknown as { active: boolean }).active = true;
      this.#control?.setAttribute('aria-activedescendant', option.id);
      if (this.#controller?.isOpen) this.#scrollActiveIntoView();
    } else {
      this.#control?.removeAttribute('aria-activedescendant');
    }
  }

  #scrollActiveIntoView(): void {
    /* v8 ignore next -- jsdom doesn't implement scrollIntoView meaningfully;
       real-browser behavior is verified by functional tests */
    this.#active?.scrollIntoView?.({ block: 'nearest' });
  }

  #enabledOptions(): FoundryOption[] {
    return this.#options.filter((o) => !o.hasAttribute('disabled'));
  }

  #firstEnabled(): FoundryOption | undefined {
    return this.#enabledOptions()[0];
  }

  #lastEnabled(): FoundryOption | undefined {
    const e = this.#enabledOptions();
    return e[e.length - 1];
  }

  #commit(option: FoundryOption): void {
    const v = option.resolvedValue;
    if ((this.readProperty('value') as string) !== v) {
      (this as unknown as { value: string }).value = v;
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }

  // --- Typeahead -------------------------------------------------------

  #isTypeaheadKey(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) return false;
    if (event.key.length !== 1) return false;
    // Printable keys: letters, digits, symbols. Whitespace only counts as
    // typeahead when already building a buffer (to match "New York" style).
    if (event.key === ' ' && this.#typeaheadBuffer === '') return false;
    return true;
  }

  #applyTypeahead(char: string): void {
    const lowered = char.toLowerCase();
    // A "cycling" press is a repeat of the same single char while the buffer
    // already holds exactly that char — that pattern advances past the
    // current active without growing the buffer. Multi-char buffers search
    // from the current active so the user can build a longer prefix without
    // skipping a matching option.
    const cycling = this.#typeaheadBuffer === lowered;
    if (!cycling) this.#typeaheadBuffer += lowered;
    this.#scheduleTypeaheadReset();

    const enabled = this.#enabledOptions();
    if (enabled.length === 0) return;
    const match = this.#findTypeaheadMatch(enabled, cycling);
    if (match) this.#setActive(match);
  }

  #findTypeaheadMatch(enabled: FoundryOption[], cycling: boolean): FoundryOption | undefined {
    const buf = this.#typeaheadBuffer;
    const activeIdx = this.#active && enabled.includes(this.#active)
      ? enabled.indexOf(this.#active)
      : -1;
    const startIdx = activeIdx === -1 ? 0 : activeIdx + (cycling ? 1 : 0);
    const rotated = [...enabled.slice(startIdx), ...enabled.slice(0, startIdx)];
    return rotated.find((o) => (o.textContent ?? '').trim().toLowerCase().startsWith(buf));
  }

  #scheduleTypeaheadReset(): void {
    if (this.#typeaheadTimer !== undefined) clearTimeout(this.#typeaheadTimer);
    this.#typeaheadTimer = setTimeout(() => {
      this.#typeaheadBuffer = '';
      this.#typeaheadTimer = undefined;
    }, TYPEAHEAD_RESET_MS);
  }

  #clearTypeahead(): void {
    this.#typeaheadBuffer = '';
    if (this.#typeaheadTimer !== undefined) {
      clearTimeout(this.#typeaheadTimer);
      this.#typeaheadTimer = undefined;
    }
  }
}
