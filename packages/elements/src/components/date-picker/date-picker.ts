import { FoundryElement } from '../../core/foundry-element.ts';
import { PopoverController } from '../../core/popover-controller.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import {
  addDays,
  addMonths,
  detectLocale,
  formatISO,
  formatMonthYear,
  formatWeekdays,
  getMonthGrid,
  getWeekStart,
  isInRange,
  isSameDay,
  parseISO,
} from './date-picker.utils.ts';
import templateHtml from './date-picker.template.html?raw';
import styleCss from './date-picker.css?inline';

const DEFAULT_OFFSET = 4;

let nextId = 0;

type CommitSource = 'pick' | 'enter' | 'blur';

/**
 * Themable date picker: an editable text input paired with a popover
 * calendar grid. Implements the WAI-ARIA 1.2 dialog-with-grid pattern.
 * Users can type a date in `YYYY-MM-DD` format OR pick from the grid;
 * either commits to the same form-submitted value.
 *
 * **Value semantics.** `value` is always either `''` (unset) or an ISO
 * `YYYY-MM-DD` string representing a calendar date in local time (no
 * timezone conversion). Typing fires `input` on every keystroke; the
 * value is only updated on the host (and submitted to the form) when
 * the typed text parses to a real, in-range calendar date.
 *
 * **Open behavior.** The calendar uses the HTML Popover API
 * (`popover="auto"`) so light-dismiss is browser-native: outside click
 * and Escape close it, and another `auto` popover pre-empts this one.
 *
 * **Keyboard.**
 *   - In input: ArrowDown opens; Enter commits typed value; Escape closes.
 *   - In grid: Arrow* moves day-by-day; PageUp/PageDown ± month;
 *     Shift+PageUp/PageDown ± year; Home/End start/end of week;
 *     Enter/Space commits + closes; Escape closes without committing.
 *
 * @element foundry-date-picker
 * @summary Editable input + popover calendar with form association.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {string} value - ISO `YYYY-MM-DD`. Empty when unset.
 * @attr {string} placeholder - Forwarded onto the inner input. Defaults to `YYYY-MM-DD`.
 * @attr {string} min - ISO date. Constrains both typing and the grid.
 * @attr {string} max - ISO date. Same.
 * @attr {boolean} required - Reflected. Empty + required reports `valueMissing`.
 * @attr {boolean} disabled - Reflected. Disables the inner input + closes the popover.
 * @attr {boolean} readonly - Reflected. Forwarded onto the inner input.
 * @attr {boolean} open - Reflected. Tracks popover open state.
 * @attr {boolean} invalid - Reflected. Managed internally.
 *
 * @slot label - Visible label rendered above the input.
 * @slot helper - Helper text rendered below the input.
 * @slot error - Error message shown when invalid.
 *
 * @csspart container - The outer flex column wrapper.
 * @csspart label - The `<label>` element.
 * @csspart input - The native `<input>` element.
 * @csspart surface - The popover surface anchored under the input.
 * @csspart header - The header row (prev / month-label / next).
 * @csspart prev - The previous-month button.
 * @csspart next - The next-month button.
 * @csspart month-label - The month + year text.
 * @csspart weekdays - The weekday header row.
 * @csspart grid - The 6×7 day grid.
 * @csspart cell - Each day cell button.
 * @csspart helper - The helper-text row.
 * @csspart error - The error-text row.
 *
 * @cssprop [--foundry-date-picker-cell-size] - Width/height of grid + nav cells.
 * @cssprop [--foundry-date-picker-cell-radius] - Corner radius of day cells.
 * @cssprop [--foundry-date-picker-cell-hover-background] - Hover background.
 * @cssprop [--foundry-date-picker-cell-selected-background] - Selected background.
 * @cssprop [--foundry-date-picker-cell-selected-color] - Selected text color.
 * @cssprop [--foundry-date-picker-cell-today-border] - Today-cell ring color.
 * @cssprop [--foundry-date-picker-cell-disabled-color] - Out-of-range text color.
 * @cssprop [--foundry-date-picker-cell-outside-color] - Prev/next-month text color.
 */
export class FoundryDatePicker extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true, default: '' },
    placeholder: { type: String, reflect: true, default: 'YYYY-MM-DD' },
    min: { type: String, reflect: true, default: '' },
    max: { type: String, reflect: true, default: '' },
    required: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
    readonly: { type: Boolean, reflect: true, default: false },
    open: { type: Boolean, reflect: true, default: false },
    invalid: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-date-picker'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryDatePicker);
    }
  }

  #internals: ElementInternals | undefined;
  #input: HTMLInputElement | undefined;
  #surface: HTMLElement | undefined;
  #prev: HTMLButtonElement | undefined;
  #next: HTMLButtonElement | undefined;
  #monthLabel: HTMLElement | undefined;
  #weekdays: HTMLElement | undefined;
  #grid: HTMLElement | undefined;
  #controller: PopoverController | undefined;
  #dialogId = '';
  #monthLabelId = '';
  #locale = 'en-US';
  #weekStart: 0 | 1 = 0;
  #viewYear = 0;
  #viewMonth = 0;
  #activeDate: Date | undefined;
  #minDate: Date | null = null;
  #maxDate: Date | null = null;
  #initialValue = '';
  #lastCommittedValue = '';
  // Suppress the value propertyChanged feedback loop when we write the
  // property from inside the input listener.
  #applyingUserInput = false;
  // Set right before commit refocuses the input, so the focus listener
  // does not re-open the popover we just dismissed.
  #suppressNextFocusOpen = false;
  #validityMessage = '';

  override connected(): void {
    /* v8 ignore next -- re-connect path; attach only once per element */
    if (!this.#internals) {
      try {
        this.#internals = this.attachInternals();
      } catch {
        // jsdom (used by unit tests) doesn't fully implement ElementInternals.
      }
    }

    this.#input = this.refs['input'] as HTMLInputElement | undefined;
    this.#surface = this.refs['surface'] as HTMLElement | undefined;
    this.#prev = this.refs['prev'] as HTMLButtonElement | undefined;
    this.#next = this.refs['next'] as HTMLButtonElement | undefined;
    this.#monthLabel = this.refs['monthLabel'] as HTMLElement | undefined;
    this.#weekdays = this.refs['weekdays'] as HTMLElement | undefined;
    this.#grid = this.refs['grid'] as HTMLElement | undefined;
    /* v8 ignore next 2 -- guard against missing template refs; unreachable in practice */
    if (!this.#input || !this.#surface || !this.#prev || !this.#next) return;
    if (!this.#monthLabel || !this.#weekdays || !this.#grid) return;

    this.#initialValue = (this.readProperty('value') as string) ?? '';
    this.#lastCommittedValue = this.#initialValue;

    const id = ++nextId;
    this.#dialogId = `foundry-date-picker-${id}-dialog`;
    this.#monthLabelId = `foundry-date-picker-${id}-month`;
    this.#surface.id = this.#dialogId;
    this.#monthLabel.id = this.#monthLabelId;
    this.#input.setAttribute('aria-controls', this.#dialogId);
    this.#surface.setAttribute('aria-labelledby', this.#monthLabelId);
    this.#grid.setAttribute('aria-labelledby', this.#monthLabelId);

    this.#locale = detectLocale();
    this.#weekStart = getWeekStart(this.#locale);
    this.#renderWeekdays();
    this.#refreshBounds();

    if (this.#input.value !== this.#initialValue) {
      this.#input.value = this.#initialValue;
    }
    this.#initViewMonth();

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
    this.#prev.addEventListener('click', this.#onPrevClick);
    this.#next.addEventListener('click', this.#onNextClick);
    this.#grid.addEventListener('click', this.#onGridClick);
    this.#grid.addEventListener('keydown', this.#onGridKeydown);

    this.#forwardInputAttrs();
    this.#wireSlotChanges();
    this.#renderGrid();
    this.#callSetFormValue(this.#initialValue);
    this.#syncValidity();
  }

  override disconnected(): void {
    this.#surface?.removeEventListener('toggle', this.#onSurfaceToggle);
    this.#input?.removeEventListener('input', this.#onInputInput);
    this.#input?.removeEventListener('keydown', this.#onInputKeydown);
    this.#input?.removeEventListener('blur', this.#onInputBlur);
    this.#input?.removeEventListener('focus', this.#onInputFocus);
    this.#prev?.removeEventListener('click', this.#onPrevClick);
    this.#next?.removeEventListener('click', this.#onNextClick);
    this.#grid?.removeEventListener('click', this.#onGridClick);
    this.#grid?.removeEventListener('keydown', this.#onGridKeydown);
    this.#controller?.detach();
    this.#controller = undefined;
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #input is set */
    if (!this.#input) return;
    if (name === 'value') {
      if (this.#applyingUserInput) return;
      const v = this.#readString('value');
      if (this.#input.value !== v) this.#input.value = v;
      this.#initViewMonth();
      this.#renderGrid();
      this.#callSetFormValue(v);
      this.#syncValidity();
    } else if (name === 'min' || name === 'max') {
      this.#refreshBounds();
      this.#renderGrid();
      this.#syncValidity();
    } else if (name === 'disabled') {
      this.#forwardInputAttrs();
      if (this.readProperty('disabled') && this.#controller?.isOpen) {
        this.#controller.hide();
      }
    } else if (name === 'placeholder' || name === 'readonly' || name === 'required') {
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
    this.#initViewMonth();
    this.#renderGrid();
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
    return i?.validationMessage ?? this.#validityMessage;
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

  /** Open the popover. No-op when disabled, readonly, or already open. */
  show(): void {
    if (this.readProperty('disabled') || this.readProperty('readonly')) return;
    if (!this.#controller || this.#controller.isOpen) return;
    this.#controller.show();
  }

  /** Close the popover. No-op when already closed. */
  hide(): void {
    if (!this.#controller?.isOpen) return;
    this.#controller.hide();
  }

  // --- Property accessors --------------------------------------------

  #readString(name: string): string {
    const v = this.readProperty(name);
    /* v8 ignore next -- declared properties always default to a string */
    return typeof v === 'string' ? v : '';
  }

  #refreshBounds(): void {
    this.#minDate = parseISO(this.#readString('min'));
    this.#maxDate = parseISO(this.#readString('max'));
  }

  // --- View-month state ----------------------------------------------

  #initViewMonth(): void {
    const parsed = parseISO(this.#readString('value'));
    const ref = parsed ?? new Date();
    this.#viewYear = ref.getFullYear();
    this.#viewMonth = ref.getMonth();
    this.#activeDate = parsed ?? new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  }

  #shiftView(deltaMonths: number): void {
    const d = addMonths(new Date(this.#viewYear, this.#viewMonth, 1), deltaMonths);
    this.#viewYear = d.getFullYear();
    this.#viewMonth = d.getMonth();
    this.#renderGrid();
  }

  // --- Render ---------------------------------------------------------

  #renderWeekdays(): void {
    /* v8 ignore next -- defensive; #weekdays is set after connect */
    if (!this.#weekdays) return;
    const labels = formatWeekdays(this.#locale, this.#weekStart);
    this.#weekdays.replaceChildren();
    for (const label of labels) {
      const span = document.createElement('span');
      span.textContent = label;
      this.#weekdays.appendChild(span);
    }
  }

  #renderGrid(): void {
    /* v8 ignore next -- defensive; #grid set after connect */
    if (!this.#grid || !this.#monthLabel) return;
    const minDate = this.#minDate;
    const maxDate = this.#maxDate;
    const valueDate = parseISO(this.#readString('value'));
    const today = new Date();
    const cells = getMonthGrid(this.#viewYear, this.#viewMonth, this.#weekStart);

    this.#monthLabel.textContent = formatMonthYear(
      new Date(this.#viewYear, this.#viewMonth, 1),
      this.#locale,
    );

    this.#grid.replaceChildren();
    const active = this.#activeDate ?? valueDate ?? new Date();

    for (let row = 0; row < 6; row += 1) {
      const rowEl = document.createElement('div');
      rowEl.setAttribute('role', 'row');
      for (let col = 0; col < 7; col += 1) {
        const date = cells[row * 7 + col];
        /* v8 ignore next -- defensive; getMonthGrid always returns 42 cells */
        if (!date) continue;
        const cell = document.createElement('button');
        cell.setAttribute('part', 'cell');
        cell.setAttribute('role', 'gridcell');
        cell.setAttribute('type', 'button');
        cell.dataset['iso'] = formatISO(date);
        cell.textContent = String(date.getDate());

        const outside = date.getMonth() !== this.#viewMonth;
        if (outside) cell.dataset['outside'] = 'true';

        const inRange = isInRange(date, minDate, maxDate);
        if (!inRange) {
          cell.setAttribute('aria-disabled', 'true');
          cell.tabIndex = -1;
        } else {
          cell.setAttribute('aria-disabled', 'false');
        }

        const selected = valueDate ? isSameDay(date, valueDate) : false;
        cell.setAttribute('aria-selected', selected ? 'true' : 'false');

        if (isSameDay(date, today)) cell.setAttribute('aria-current', 'date');

        const isActive = isSameDay(date, active);
        cell.tabIndex = isActive && inRange ? 0 : -1;

        rowEl.appendChild(cell);
      }
      this.#grid.appendChild(rowEl);
    }
  }

  #focusActiveCell(): void {
    /* v8 ignore next -- defensive; grid set after connect */
    if (!this.#grid || !this.#activeDate) return;
    const iso = formatISO(this.#activeDate);
    const cell = this.#grid.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
    cell?.focus();
  }

  // --- Slot wiring ----------------------------------------------------

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
    this.#forwardString('name');
    this.#forwardBoolean('required');
    this.#forwardBoolean('disabled');
    this.#forwardBoolean('readonly');
  }

  #forwardString(attr: 'placeholder' | 'name'): void {
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
    /* v8 ignore next -- defensive; called from sync paths after connect */
    if (!this.#input) return;
    const required = Boolean(this.readProperty('required'));
    const typed = this.#input.value;
    const minStr = this.#readString('min');
    const maxStr = this.#readString('max');
    const minDate = this.#minDate;
    const maxDate = this.#maxDate;

    let flags: ValidityStateFlags = {};
    let message = '';

    if (typed === '') {
      if (required) {
        flags = { valueMissing: true };
        message = 'Please fill out this field.';
      }
    } else {
      const parsed = parseISO(typed);
      if (!parsed) {
        flags = { badInput: true };
        message = 'Please enter a valid date in YYYY-MM-DD format.';
      } else if (minDate && parsed < minDate) {
        flags = { rangeUnderflow: true };
        message = `Value must be ${minStr} or later.`;
      } else if (maxDate && parsed > maxDate) {
        flags = { rangeOverflow: true };
        message = `Value must be ${maxStr} or earlier.`;
      }
    }

    const setValidity = (this.#internals as unknown as {
      setValidity?: (flags: ValidityStateFlags, message?: string, anchor?: HTMLElement) => void;
    } | undefined)?.setValidity;

    const hasFlag = Object.values(flags).some(Boolean);
    if (hasFlag) {
      if (typeof setValidity === 'function') {
        setValidity.call(this.#internals, flags, message, this.#input);
      }
      this.#validityMessage = message;
      (this as unknown as { invalid: boolean }).invalid = true;
    } else {
      if (typeof setValidity === 'function') setValidity.call(this.#internals, {});
      this.#validityMessage = '';
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
      this.#initViewMonth();
      this.#renderGrid();
      // Defer focus until the cell is actually in the DOM and visible.
      queueMicrotask(() => this.#focusActiveCell());
    } else if (next === 'closed') {
      (this as unknown as { open: boolean }).open = false;
      this.#input?.setAttribute('aria-expanded', 'false');
    }
  };

  // --- Input event flow -----------------------------------------------

  #onInputFocus = (): void => {
    if (this.#suppressNextFocusOpen) {
      this.#suppressNextFocusOpen = false;
      return;
    }
  };

  #onInputInput = (): void => {
    /* v8 ignore next -- defensive; listener only fires while #input exists */
    if (!this.#input) return;
    const next = this.#input.value;
    const parsed = parseISO(next);
    this.#applyingUserInput = true;
    if (parsed && isInRange(parsed, this.#minDate, this.#maxDate)) {
      (this as unknown as { value: string }).value = next;
      this.#viewYear = parsed.getFullYear();
      this.#viewMonth = parsed.getMonth();
      this.#activeDate = parsed;
      this.#callSetFormValue(next);
      this.#renderGrid();
    } else {
      // Mid-type — capture text in form value for partial submissions.
      this.#callSetFormValue(next);
    }
    this.#applyingUserInput = false;
    this.#syncValidity();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  };

  #onInputBlur = (): void => {
    queueMicrotask(() => {
      this.#commitFreeText('blur');
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
        return;
      }
      if (key === 'Enter') {
        event.preventDefault();
        this.#commitFreeText('enter');
      }
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      this.hide();
    }
  };

  // --- Prev/next nav --------------------------------------------------

  #onPrevClick = (): void => {
    this.#shiftView(-1);
  };

  #onNextClick = (): void => {
    this.#shiftView(1);
  };

  // --- Grid event flow ------------------------------------------------

  #onGridClick = (event: MouseEvent): void => {
    const cell = this.#findCellFromEvent(event);
    if (!cell) return;
    if (cell.getAttribute('aria-disabled') === 'true') return;
    const iso = cell.dataset['iso'];
    /* v8 ignore next -- defensive; rendered cells always have data-iso */
    if (!iso) return;
    this.#commitISO(iso, 'pick');
  };

  #findCellFromEvent(event: Event): HTMLButtonElement | undefined {
    const path = event.composedPath();
    for (const node of path) {
      if (
        node instanceof HTMLButtonElement
        && node.getAttribute('part') === 'cell'
      ) {
        return node;
      }
    }
    return undefined;
  }

  #onGridKeydown = (event: KeyboardEvent): void => {
    /* v8 ignore next -- defensive; activeDate is set during render */
    if (!this.#activeDate) return;
    const key = event.key;
    let next: Date | undefined;
    let handled = true;

    switch (key) {
      case 'ArrowLeft':
        next = addDays(this.#activeDate, -1);
        break;
      case 'ArrowRight':
        next = addDays(this.#activeDate, 1);
        break;
      case 'ArrowUp':
        next = addDays(this.#activeDate, -7);
        break;
      case 'ArrowDown':
        next = addDays(this.#activeDate, 7);
        break;
      case 'Home': {
        const dow = (this.#activeDate.getDay() - this.#weekStart + 7) % 7;
        next = addDays(this.#activeDate, -dow);
        break;
      }
      case 'End': {
        const dow = (this.#activeDate.getDay() - this.#weekStart + 7) % 7;
        next = addDays(this.#activeDate, 6 - dow);
        break;
      }
      case 'PageUp':
        next = event.shiftKey
          ? addMonths(this.#activeDate, -12)
          : addMonths(this.#activeDate, -1);
        break;
      case 'PageDown':
        next = event.shiftKey
          ? addMonths(this.#activeDate, 12)
          : addMonths(this.#activeDate, 1);
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar': {
        event.preventDefault();
        if (isInRange(this.#activeDate, this.#minDate, this.#maxDate)) {
          this.#commitISO(formatISO(this.#activeDate), 'pick');
        }
        return;
      }
      case 'Escape':
        event.preventDefault();
        this.hide();
        this.#suppressNextFocusOpen = true;
        this.#input?.focus();
        return;
      default:
        handled = false;
    }

    if (!handled || !next) return;
    event.preventDefault();
    this.#activeDate = next;
    if (next.getFullYear() !== this.#viewYear || next.getMonth() !== this.#viewMonth) {
      this.#viewYear = next.getFullYear();
      this.#viewMonth = next.getMonth();
    }
    this.#renderGrid();
    this.#focusActiveCell();
  };

  // --- Commit flow ----------------------------------------------------

  #commitISO(iso: string, source: CommitSource): void {
    /* v8 ignore next -- defensive; #input is set after connected() */
    if (!this.#input) return;
    this.#input.value = iso;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = iso;
    this.#applyingUserInput = false;
    const parsed = parseISO(iso);
    /* v8 ignore next -- iso is always a valid ISO string from a rendered cell */
    if (parsed) {
      this.#viewYear = parsed.getFullYear();
      this.#viewMonth = parsed.getMonth();
      this.#activeDate = parsed;
    }
    this.#callSetFormValue(iso);
    this.#renderGrid();
    this.#syncValidity();
    this.#lastCommittedValue = iso;
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: iso, source },
      }),
    );
    this.hide();
    this.#suppressNextFocusOpen = true;
    this.#input.focus();
  }

  #commitFreeText(source: 'enter' | 'blur'): void {
    /* v8 ignore next -- defensive; #input is set after connected() */
    if (!this.#input) return;
    const typed = this.#input.value;
    if (typed === '') {
      if (this.#lastCommittedValue !== '') {
        this.#applyingUserInput = true;
        (this as unknown as { value: string }).value = '';
        this.#applyingUserInput = false;
        this.#callSetFormValue('');
        this.#lastCommittedValue = '';
        this.#syncValidity();
        this.dispatchEvent(
          new CustomEvent('change', {
            bubbles: true,
            composed: true,
            detail: { value: '', source },
          }),
        );
      }
      return;
    }
    const parsed = parseISO(typed);
    if (!parsed || !isInRange(parsed, this.#minDate, this.#maxDate)) {
      this.#syncValidity();
      return;
    }
    const iso = formatISO(parsed);
    if (iso === this.#lastCommittedValue) return;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = iso;
    this.#applyingUserInput = false;
    this.#callSetFormValue(iso);
    this.#lastCommittedValue = iso;
    this.#syncValidity();
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: iso, source },
      }),
    );
  }
}
