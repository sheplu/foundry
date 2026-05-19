import { FoundryElement } from '../../core/foundry-element.ts';
import { PopoverController } from '../../core/popover-controller.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryOption } from '../option/option.ts';
import templateHtml from './combobox.template.html?raw';
import styleCss from './combobox.css?inline';

const DEFAULT_OFFSET = 4;

let nextId = 0;

/**
 * Themable free-text combobox: an `<input>` paired with a listbox of
 * `<foundry-option>` suggestions. Implements the WAI-ARIA 1.2
 * combobox-with-listbox pattern. Whatever the user types becomes the
 * submitted value — options are suggestions only, not constraints.
 *
 * **Free-form value semantics.** Typing fires `input` and writes
 * `value` on every keystroke (so a mid-type form submission captures the
 * current text). Clicking an option, pressing Enter, or blurring "commits"
 * the value and fires `change` with `event.detail.source` indicating the
 * commit channel (`option` | `enter` | `blur`).
 *
 * **Open behavior.** The listbox uses the HTML Popover API
 * (`popover="auto"`) so light-dismiss is browser-native: outside click and
 * Escape close it, and another `auto` popover pre-empts this one. The
 * `PopoverController` positions the surface with flip+shift, keeping the
 * host's `open` attribute in sync.
 *
 * **Keyboard.**
 *   - Closed: ArrowDown / ArrowUp open the listbox; ArrowDown seeds active
 *     on the first enabled visible option, ArrowUp on the last.
 *   - Open: ArrowDown / ArrowUp cycle the active descendant (wrapping,
 *     skipping disabled / hidden); Home / End jump to first / last visible;
 *     Enter commits the active option (or, with no active, the typed text);
 *     Escape closes without undoing the typed text; Tab commits the typed
 *     free-text and lets focus move on.
 *
 * Active descendant is tracked via `aria-activedescendant` on the input so
 * focus stays on the input — the listbox surface is never tabbed through,
 * matching the WAI-ARIA APG combobox-with-listbox pattern.
 *
 * @element foundry-combobox
 * @summary Free-text combobox with option suggestions and form association.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {string} value - Free-text value. Two-way synced with the inner input.
 * @attr {string} placeholder - Forwarded onto the inner input.
 * @attr {boolean} required - Reflected. Empty + required reports `valueMissing`.
 * @attr {boolean} disabled - Reflected. Disables the inner input + closes the listbox.
 * @attr {boolean} readonly - Reflected. Forwarded onto the inner input.
 * @attr {string} autocomplete - Forwarded onto the inner input.
 * @attr {boolean} open - Reflected. Tracks listbox open state; managed by
 *   the component + browser light-dismiss. Consumers read for styling.
 * @attr {boolean} invalid - Reflected. Managed internally; not set by consumers.
 *
 * @slot - Default slot. `<foundry-option>` children.
 * @slot label - Visible label rendered above the input.
 * @slot helper - Helper text rendered below the input.
 * @slot error - Error message shown when invalid.
 *
 * @csspart container - The outer flex column wrapper.
 * @csspart label - The `<label>` element.
 * @csspart input - The native `<input>` element (combobox trigger + value).
 * @csspart surface - The popover surface anchored under the input.
 * @csspart no-results - The empty-state row shown when the filter matches nothing.
 * @csspart helper - The helper-text row.
 * @csspart error - The error-text row (visible only when invalid).
 *
 * @cssprop [--foundry-combobox-gap] - Vertical spacing between parts.
 * @cssprop [--foundry-combobox-label-font-size] - Label text size.
 * @cssprop [--foundry-combobox-label-font-weight] - Label font weight.
 * @cssprop [--foundry-combobox-label-color] - Label text color.
 * @cssprop [--foundry-combobox-padding] - Input padding.
 * @cssprop [--foundry-combobox-border-color] - Input border color.
 * @cssprop [--foundry-combobox-border-color-invalid] - Input border when invalid.
 * @cssprop [--foundry-combobox-radius] - Input corner radius.
 * @cssprop [--foundry-combobox-background] - Input background.
 * @cssprop [--foundry-combobox-foreground] - Input text color.
 * @cssprop [--foundry-combobox-placeholder-color] - Placeholder text color.
 * @cssprop [--foundry-combobox-focus-outline] - Focus outline color.
 * @cssprop [--foundry-combobox-focus-outline-invalid] - Focus outline when invalid.
 * @cssprop [--foundry-combobox-helper-font-size] - Helper text size.
 * @cssprop [--foundry-combobox-helper-color] - Helper text color.
 * @cssprop [--foundry-combobox-error-font-size] - Error text size.
 * @cssprop [--foundry-combobox-error-color] - Error text color.
 * @cssprop [--foundry-combobox-surface-padding] - Listbox surface padding.
 * @cssprop [--foundry-combobox-surface-border-color] - Listbox surface border.
 * @cssprop [--foundry-combobox-surface-radius] - Listbox surface corner radius.
 * @cssprop [--foundry-combobox-surface-background] - Listbox surface background.
 * @cssprop [--foundry-combobox-surface-foreground] - Listbox surface text color.
 * @cssprop [--foundry-combobox-surface-shadow] - Listbox surface shadow.
 * @cssprop [--foundry-combobox-surface-min-inline-size] - Listbox surface min width.
 * @cssprop [--foundry-combobox-no-results-color] - No-results text color.
 * @cssprop [--foundry-combobox-no-results-font-size] - No-results font size.
 */
export class FoundryCombobox extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true, default: '' },
    placeholder: { type: String, reflect: true },
    required: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
    readonly: { type: Boolean, reflect: true, default: false },
    autocomplete: { type: String, reflect: true },
    open: { type: Boolean, reflect: true, default: false },
    invalid: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-combobox'): void {
    FoundryOption.define();
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryCombobox);
    }
  }

  #internals: ElementInternals | undefined;
  #input: HTMLInputElement | undefined;
  #surface: HTMLElement | undefined;
  #optionsSlot: HTMLSlotElement | undefined;
  #noResults: HTMLElement | undefined;
  #options: FoundryOption[] = [];
  #active: FoundryOption | undefined;
  #controller: PopoverController | undefined;
  #listboxId = '';
  #optionIdPrefix = '';
  #initialValue = '';
  #lastCommittedValue = '';
  // Suppress the value propertyChanged feedback loop when we write the
  // property from inside the input listener.
  #applyingUserInput = false;
  // Set right before #commitOption() refocuses the input, so the focus
  // listener does not re-open the listbox we just dismissed.
  #suppressNextFocusOpen = false;

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

    this.#input = this.refs['input'] as HTMLInputElement | undefined;
    this.#surface = this.refs['surface'] as HTMLElement | undefined;
    this.#optionsSlot = this.refs['optionsSlot'] as HTMLSlotElement | undefined;
    this.#noResults = this.refs['noResults'] as HTMLElement | undefined;
    /* v8 ignore next -- guard against missing template refs; unreachable in practice */
    if (!this.#input || !this.#surface || !this.#optionsSlot) return;

    this.#initialValue = (this.readProperty('value') as string) ?? '';
    this.#lastCommittedValue = this.#initialValue;

    const id = ++nextId;
    this.#listboxId = `foundry-combobox-${id}-listbox`;
    this.#optionIdPrefix = `foundry-combobox-${id}-option-`;
    this.#surface.id = this.#listboxId;
    this.#input.setAttribute('aria-controls', this.#listboxId);

    // Initial input value sync (attribute may be set before connect).
    if (this.#input.value !== this.#initialValue) {
      this.#input.value = this.#initialValue;
    }

    this.#controller = new PopoverController({
      host: this,
      surface: this.#surface,
      getAnchor: () => this.#input,
      getPlacement: () => 'bottom',
      offset: DEFAULT_OFFSET,
    });
    this.#controller.attach();

    this.#surface.addEventListener('toggle', this.#onSurfaceToggle);
    this.#input.addEventListener('input', this.#onInputInput);
    this.#input.addEventListener('keydown', this.#onInputKeydown);
    this.#input.addEventListener('blur', this.#onInputBlur);
    this.#input.addEventListener('focus', this.#onInputFocus);
    this.#surface.addEventListener('click', this.#onSurfaceClick);
    this.#surface.addEventListener('pointermove', this.#onSurfacePointerMove);
    this.#optionsSlot.addEventListener('slotchange', this.#onSlotChange);

    this.#readOptions();
    this.#forwardInputAttrs();
    this.#wireSlotChanges();
    this.#applyFilter(this.#input.value);
    this.#callSetFormValue(this.#input.value);
    this.#syncValidity();
  }

  override disconnected(): void {
    this.#optionsSlot?.removeEventListener('slotchange', this.#onSlotChange);
    this.#surface?.removeEventListener('toggle', this.#onSurfaceToggle);
    this.#surface?.removeEventListener('click', this.#onSurfaceClick);
    this.#surface?.removeEventListener('pointermove', this.#onSurfacePointerMove);
    this.#input?.removeEventListener('input', this.#onInputInput);
    this.#input?.removeEventListener('keydown', this.#onInputKeydown);
    this.#input?.removeEventListener('blur', this.#onInputBlur);
    this.#input?.removeEventListener('focus', this.#onInputFocus);
    this.#controller?.detach();
    this.#controller = undefined;
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #input is set */
    if (!this.#input) return;
    if (name === 'value') {
      if (this.#applyingUserInput) return;
      const v = (this.readProperty('value') as string) ?? '';
      if (this.#input.value !== v) this.#input.value = v;
      this.#callSetFormValue(v);
      this.#applyFilter(v);
      this.#syncValidity();
    } else if (name === 'disabled') {
      this.#forwardInputAttrs();
      // Disabling while open would leave the listbox dangling.
      if (this.readProperty('disabled') && this.#controller?.isOpen) {
        this.#controller.hide();
      }
    } else if (
      name === 'placeholder'
      || name === 'readonly'
      || name === 'autocomplete'
      || name === 'required'
    ) {
      this.#forwardInputAttrs();
      if (name === 'required') this.#syncValidity();
    } else if (name === 'invalid') {
      this.#syncDescribedBy();
    }
  }

  formResetCallback(): void {
    this.#applyingUserInput = false;
    (this as unknown as { value: string }).value = this.#initialValue;
    /* v8 ignore next -- defensive; reset only fires after connect */
    if (this.#input) this.#input.value = this.#initialValue;
    this.#lastCommittedValue = this.#initialValue;
    this.#callSetFormValue(this.#initialValue);
    this.#syncValidity();
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
    this.#input?.focus(options);
  }

  /** Snapshot of discovered `<foundry-option>` children. */
  get options(): readonly FoundryOption[] {
    return this.#options;
  }

  /** Open the listbox. No-op when disabled, readonly, or already open. */
  show(): void {
    if (this.readProperty('disabled') || this.readProperty('readonly')) return;
    if (!this.#controller || this.#controller.isOpen) return;
    this.#controller.show();
  }

  /** Close the listbox. No-op when already closed. */
  hide(): void {
    if (!this.#controller?.isOpen) return;
    this.#controller.hide();
  }

  // --- Slot + option management ---------------------------------------

  #onSlotChange = (): void => {
    this.#readOptions();
    /* v8 ignore next -- defensive; #input is set after connect */
    if (this.#input) this.#applyFilter(this.#input.value);
    if (this.#active && !this.#options.includes(this.#active)) {
      this.#setActive(this.#firstEnabledVisible());
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

  #wireSlotChanges(): void {
    this.#wireSlot('labelSlot', 'has-label');
    this.#wireSlot('helperSlot', 'has-helper');
    this.#wireSlot('errorSlot', 'has-error');
  }

  #wireSlot(refName: string, hostAttr: string): void {
    const slot = this.refs[refName] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these slot refs */
    if (!slot) return;
    const sync = (): void => {
      /* v8 ignore start -- the text-node branch in the predicate is unreachable
         for named slots; consumers always assign element children with slot= */
      const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        return (n.textContent ?? '').trim().length > 0;
      });
      /* v8 ignore stop */
      this.toggleAttribute(hostAttr, hasContent);
      this.#syncDescribedBy();
    };
    slot.addEventListener('slotchange', sync);
    sync();
  }

  // --- Input forwarding + ARIA ----------------------------------------

  #forwardInputAttrs(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    this.#forwardString('placeholder');
    this.#forwardString('autocomplete');
    this.#forwardString('name');
    this.#forwardBoolean('required');
    this.#forwardBoolean('disabled');
    this.#forwardBoolean('readonly');
  }

  #forwardString(attr: 'placeholder' | 'autocomplete' | 'name'): void {
    /* v8 ignore next -- defensive; #input is set by connected() */
    if (!this.#input) return;
    const value = this.readProperty(attr);
    if (value === null || value === undefined || value === '') {
      this.#input.removeAttribute(attr);
    } else {
      this.#input.setAttribute(attr, String(value));
    }
  }

  #forwardBoolean(attr: 'required' | 'disabled' | 'readonly'): void {
    /* v8 ignore next -- defensive; #input is set by connected() */
    if (!this.#input) return;
    const value = Boolean(this.readProperty(attr));
    if (value) this.#input.setAttribute(attr, '');
    else this.#input.removeAttribute(attr);
  }

  #syncDescribedBy(): void {
    /* v8 ignore next -- defensive; called only from sync paths after connect */
    if (!this.#input) return;
    const ids: string[] = [];
    if (this.hasAttribute('has-helper')) ids.push('hint');
    const isInvalid = Boolean(this.readProperty('invalid'));
    const hasError = this.hasAttribute('has-error');
    if (isInvalid && hasError) {
      ids.push('err');
      this.#input.setAttribute('aria-errormessage', 'err');
    } else {
      this.#input.removeAttribute('aria-errormessage');
    }
    if (ids.length === 0) this.#input.removeAttribute('aria-describedby');
    else this.#input.setAttribute('aria-describedby', ids.join(' '));
    this.#input.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
  }

  // --- Form association ----------------------------------------------

  #callSetFormValue(value: string): void {
    const fn = (this.#internals as unknown as {
      setFormValue?: (v: string | null | FormData | File) => void;
    } | undefined)?.setFormValue;
    if (typeof fn === 'function') fn.call(this.#internals, value === '' ? null : value);
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
          'Please fill out this field.',
          this.#input,
        );
      }
      (this as unknown as { invalid: boolean }).invalid = true;
    } else {
      if (typeof setValidity === 'function') setValidity.call(this.#internals, {});
      (this as unknown as { invalid: boolean }).invalid = false;
    }
    this.#syncDescribedBy();
  }

  // --- Open/close wiring ----------------------------------------------

  #onSurfaceToggle = (event: Event): void => {
    const next = (event as Event & { newState?: string }).newState;
    if (next === 'open') {
      (this as unknown as { open: boolean }).open = true;
      this.#input?.setAttribute('aria-expanded', 'true');
    } else if (next === 'closed') {
      (this as unknown as { open: boolean }).open = false;
      this.#input?.setAttribute('aria-expanded', 'false');
      this.#setActive(undefined);
    }
  };

  // --- Input event flow -----------------------------------------------

  #onInputFocus = (): void => {
    // After a commit we refocus the input; skip the auto-open in that case.
    if (this.#suppressNextFocusOpen) {
      this.#suppressNextFocusOpen = false;
      return;
    }
    // Open the listbox on focus when there are visible options to suggest.
    // Skip when readonly / disabled (defensive — the OS already prevents
    // focus on disabled inputs).
    /* v8 ignore next -- defensive; disabled input cannot receive focus */
    if (this.readProperty('disabled') || this.readProperty('readonly')) return;
    if (this.#visibleEnabledOptions().length > 0) this.show();
  };

  #onInputInput = (): void => {
    /* v8 ignore next -- defensive; listener only fires while #input exists */
    if (!this.#input) return;
    const next = this.#input.value;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = next;
    this.#applyingUserInput = false;
    this.#callSetFormValue(next);
    this.#applyFilter(next);
    this.#syncValidity();
    // Open the listbox on first keystroke if it isn't already, but only
    // when there's something to suggest. Empty list = stay closed.
    if (!this.#controller?.isOpen && this.#visibleEnabledOptions().length > 0) {
      this.show();
    }
    // Re-emit input on the host so consumers can listen for type-ahead
    // UX (search-as-you-type, debounce, etc.) without crossing the
    // shadow boundary.
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  };

  #onInputBlur = (): void => {
    // Native click on a slotted option fires blur on the input *before*
    // the click reaches the surface — which would close the listbox and
    // cancel the option commit. Defer the blur commit so a same-tick
    // option click can run #commitOption() first.
    queueMicrotask(() => {
      if (this.#controller?.isOpen) {
        this.#commitFreeText('blur');
        this.hide();
      }
    });
  };

  #onInputKeydown = (event: KeyboardEvent): void => {
    if (this.readProperty('disabled') || this.readProperty('readonly')) return;
    const key = event.key;
    /* v8 ignore next -- defensive; controller is set after connected() */
    const isOpen = this.#controller?.isOpen ?? false;

    if (!isOpen) {
      if (key === 'ArrowDown') {
        event.preventDefault();
        this.show();
        if (this.#controller?.isOpen) this.#setActive(this.#firstEnabledVisible());
        return;
      }
      if (key === 'ArrowUp') {
        event.preventDefault();
        this.show();
        if (this.#controller?.isOpen) this.#setActive(this.#lastEnabledVisible());
        return;
      }
      // Enter on a closed combobox commits whatever's currently typed.
      if (key === 'Enter') {
        event.preventDefault();
        this.#commitFreeText('enter');
      }
      return;
    }

    switch (key) {
      case 'Escape':
        event.preventDefault();
        this.hide();
        return;
      case 'Tab':
        // Tab commits free-text and closes — does NOT preventDefault, so
        // focus moves on naturally.
        this.#commitFreeText('blur');
        this.hide();
        return;
      case 'Enter':
        event.preventDefault();
        if (this.#active && !this.#active.hasAttribute('disabled')) {
          this.#commitOption(this.#active);
        } else {
          this.#commitFreeText('enter');
          this.hide();
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
        this.#setActive(this.#firstEnabledVisible());
        return;
      case 'End':
        event.preventDefault();
        this.#setActive(this.#lastEnabledVisible());
        return;
      /* v8 ignore next -- printable keys flow through the input event handler */
      default:
        return;
    }
  };

  #onSurfaceClick = (event: MouseEvent): void => {
    const option = this.#findOptionFromEvent(event);
    if (!option || option.hasAttribute('disabled')) return;
    this.#commitOption(option);
  };

  #onSurfacePointerMove = (event: PointerEvent): void => {
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

  // --- Active descendant helpers --------------------------------------

  #moveActive(delta: 1 | -1): void {
    const enabled = this.#visibleEnabledOptions();
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
      this.#input?.setAttribute('aria-activedescendant', option.id);
    } else {
      this.#input?.removeAttribute('aria-activedescendant');
    }
  }

  #visibleEnabledOptions(): FoundryOption[] {
    return this.#options.filter(
      (o) => !o.hasAttribute('disabled') && !o.hasAttribute('hidden'),
    );
  }

  #firstEnabledVisible(): FoundryOption | undefined {
    return this.#visibleEnabledOptions()[0];
  }

  #lastEnabledVisible(): FoundryOption | undefined {
    const e = this.#visibleEnabledOptions();
    return e[e.length - 1];
  }

  // --- Filter ---------------------------------------------------------

  #applyFilter(rawQuery: string): void {
    const query = rawQuery.trim().toLowerCase();
    let visibleCount = 0;
    for (const opt of this.#options) {
      /* v8 ignore next -- defensive null-text fallback; foundry-option always has text */
      const text = (opt.textContent ?? '').trim().toLowerCase();
      const visible = query === '' || text.includes(query);
      opt.toggleAttribute('hidden', !visible);
      if (visible) visibleCount += 1;
    }
    /* v8 ignore next -- defensive; #noResults always set from the template */
    if (this.#noResults) {
      this.#noResults.hidden = visibleCount > 0;
    }
    // Drop active if it became hidden — only re-seed while open.
    if (this.#active && this.#active.hasAttribute('hidden')) {
      this.#setActive(this.#controller?.isOpen ? this.#firstEnabledVisible() : undefined);
    }
  }

  // --- Commit flow ----------------------------------------------------

  #commitOption(option: FoundryOption): void {
    /* v8 ignore next -- defensive; #input is set after connected() */
    if (!this.#input) return;
    const v = option.resolvedValue;
    const text = (option.textContent ?? '').trim();
    this.#input.value = text;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = v;
    this.#applyingUserInput = false;
    this.#callSetFormValue(v);
    this.#applyFilter(text);
    this.#syncValidity();
    this.#lastCommittedValue = v;
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: v, source: 'option' },
      }),
    );
    this.hide();
    this.#suppressNextFocusOpen = true;
    this.#input.focus();
  }

  #commitFreeText(source: 'enter' | 'blur'): void {
    const v = (this.readProperty('value') as string) ?? '';
    if (v === this.#lastCommittedValue) return;
    this.#lastCommittedValue = v;
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: v, source },
      }),
    );
  }
}
