import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import {
  addStep,
  clamp,
  formatNumber,
  isOnGrid,
  parseNumber,
  snapToGrid,
} from './number-stepper.utils.ts';
import templateHtml from './number-stepper.template.html?raw';
import styleCss from './number-stepper.css?inline';

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;
const PAGE_MULTIPLIER = 10;

type CommitSource = 'increment' | 'decrement' | 'type' | 'key';

/**
 * Themable number stepper: an editable text input flanked by `−` / `+`
 * buttons. Implements the WAI-ARIA spinbutton pattern with full
 * constraint validation (`valueMissing`, `badInput`, `rangeUnderflow`,
 * `rangeOverflow`, `stepMismatch`) and float-safe step arithmetic so
 * `0.1 + 0.2 → 0.3` instead of `0.30000000000000004`.
 *
 * **Value semantics.** `value` is the raw numeric string (`'42'`,
 * `'3.5'`) or `''` when unset. Typing fires `input` on every keystroke;
 * on commit (button click, key, blur) the value is snapped to the step
 * grid, clamped to `[min, max]`, and re-formatted to step precision.
 *
 * **Press-and-hold.** Holding the `−` or `+` button auto-repeats the
 * increment after a 400ms initial delay at an 80ms cadence. Releasing,
 * leaving the button, or hitting a boundary stops the repeat.
 *
 * **Keyboard** (in the input):
 *   - `ArrowUp` / `ArrowDown`: ± step.
 *   - `PageUp` / `PageDown`: ± 10 × step.
 *   - `Home` / `End`: snap to min / max (when finite).
 *
 * @element foundry-number-stepper
 * @summary Spinbutton input with explicit ± controls and form association.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {string} value - Numeric string. Empty when unset.
 * @attr {string} placeholder - Forwarded onto the inner input.
 * @attr {number} min - Lower bound. Omit for unbounded.
 * @attr {number} max - Upper bound. Omit for unbounded.
 * @attr {number} step - Step increment. Defaults to `1`.
 * @attr {boolean} required - Reflected. Empty + required reports `valueMissing`.
 * @attr {boolean} disabled - Reflected. Disables input + both buttons.
 * @attr {boolean} readonly - Reflected. Input not editable; buttons inert.
 * @attr {boolean} invalid - Reflected. Managed internally.
 *
 * @slot label - Visible label rendered above the controls.
 * @slot helper - Helper text rendered below the controls.
 * @slot error - Error message shown when invalid.
 *
 * @csspart container - The outer flex column wrapper.
 * @csspart label - The `<label>` element.
 * @csspart controls - The `[ − ] [ input ] [ + ]` row.
 * @csspart decrement - The `−` button.
 * @csspart input - The native `<input>` element.
 * @csspart increment - The `+` button.
 * @csspart helper - The helper-text row.
 * @csspart error - The error-text row.
 *
 * @cssprop [--foundry-number-stepper-button-size] - Square size of the ± buttons.
 * @cssprop [--foundry-number-stepper-button-background] - Button background color.
 * @cssprop [--foundry-number-stepper-button-color] - Button foreground color.
 * @cssprop [--foundry-number-stepper-button-border] - Button border color.
 * @cssprop [--foundry-number-stepper-button-radius] - Outer corner radius.
 * @cssprop [--foundry-number-stepper-button-hover-background] - Hover background.
 * @cssprop [--foundry-number-stepper-button-disabled-opacity] - Disabled opacity.
 * @cssprop [--foundry-number-stepper-controls-gap] - Gap between input and buttons.
 * @cssprop [--foundry-number-stepper-padding] - Input padding.
 * @cssprop [--foundry-number-stepper-border-color] - Input border color.
 * @cssprop [--foundry-number-stepper-border-color-invalid] - Border color when invalid.
 * @cssprop [--foundry-number-stepper-background] - Input background.
 * @cssprop [--foundry-number-stepper-foreground] - Input text color.
 * @cssprop [--foundry-number-stepper-focus-outline] - Focus outline color.
 * @cssprop [--foundry-number-stepper-focus-outline-invalid] - Focus outline when invalid.
 * @cssprop [--foundry-number-stepper-helper-color] - Helper text color.
 * @cssprop [--foundry-number-stepper-error-color] - Error text color.
 */
export class FoundryNumberStepper extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true, default: '' },
    placeholder: { type: String, reflect: true },
    min: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    step: { type: Number, reflect: true, default: 1 },
    required: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
    readonly: { type: Boolean, reflect: true, default: false },
    invalid: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-number-stepper'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryNumberStepper);
    }
  }

  #internals: ElementInternals | undefined;
  #input: HTMLInputElement | undefined;
  #dec: HTMLButtonElement | undefined;
  #inc: HTMLButtonElement | undefined;
  #initialValue = '';
  #applyingUserInput = false;
  #repeatDelay: ReturnType<typeof setTimeout> | undefined;
  #repeatInterval: ReturnType<typeof setInterval> | undefined;
  #validityMessage = '';

  override connected(): void {
    /* v8 ignore next -- re-connect path; attach only once per element */
    if (!this.#internals) {
      try {
        this.#internals = this.attachInternals();
      } catch {
        // jsdom doesn't fully implement ElementInternals.
      }
    }

    this.#input = this.refs['input'] as HTMLInputElement | undefined;
    this.#dec = this.refs['dec'] as HTMLButtonElement | undefined;
    this.#inc = this.refs['inc'] as HTMLButtonElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#input || !this.#dec || !this.#inc) return;

    this.#initialValue = this.#readString('value');
    if (this.#input.value !== this.#initialValue) {
      this.#input.value = this.#initialValue;
    }

    this.#input.addEventListener('input', this.#onInputInput);
    this.#input.addEventListener('keydown', this.#onInputKeydown);
    this.#input.addEventListener('blur', this.#onInputBlur);
    this.#dec.addEventListener('pointerdown', this.#onDecPointerDown);
    this.#dec.addEventListener('pointerup', this.#stopRepeat);
    this.#dec.addEventListener('pointerleave', this.#stopRepeat);
    this.#dec.addEventListener('pointercancel', this.#stopRepeat);
    this.#dec.addEventListener('click', this.#onDecClick);
    this.#inc.addEventListener('pointerdown', this.#onIncPointerDown);
    this.#inc.addEventListener('pointerup', this.#stopRepeat);
    this.#inc.addEventListener('pointerleave', this.#stopRepeat);
    this.#inc.addEventListener('pointercancel', this.#stopRepeat);
    this.#inc.addEventListener('click', this.#onIncClick);

    this.#forwardInputAttrs();
    this.#wireSlotChanges();
    this.#syncSpinbuttonAria();
    this.#syncButtonsDisabled();
    this.#callSetFormValue(this.#initialValue);
    this.#syncValidity();
  }

  override disconnected(): void {
    this.#stopRepeat();
    this.#input?.removeEventListener('input', this.#onInputInput);
    this.#input?.removeEventListener('keydown', this.#onInputKeydown);
    this.#input?.removeEventListener('blur', this.#onInputBlur);
    this.#dec?.removeEventListener('pointerdown', this.#onDecPointerDown);
    this.#dec?.removeEventListener('pointerup', this.#stopRepeat);
    this.#dec?.removeEventListener('pointerleave', this.#stopRepeat);
    this.#dec?.removeEventListener('pointercancel', this.#stopRepeat);
    this.#dec?.removeEventListener('click', this.#onDecClick);
    this.#inc?.removeEventListener('pointerdown', this.#onIncPointerDown);
    this.#inc?.removeEventListener('pointerup', this.#stopRepeat);
    this.#inc?.removeEventListener('pointerleave', this.#stopRepeat);
    this.#inc?.removeEventListener('pointercancel', this.#stopRepeat);
    this.#inc?.removeEventListener('click', this.#onIncClick);
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #input is set */
    if (!this.#input) return;
    if (name === 'value') {
      if (this.#applyingUserInput) return;
      const v = this.#readString('value');
      // v8 ignore next: propertyChanged only fires on real change; input is always stale.
      /* v8 ignore next */
      if (this.#input.value !== v) this.#input.value = v;
      this.#callSetFormValue(v);
      this.#syncSpinbuttonAria();
      this.#syncButtonsDisabled();
      this.#syncValidity();
    } else if (name === 'min' || name === 'max' || name === 'step') {
      this.#syncSpinbuttonAria();
      this.#syncButtonsDisabled();
      this.#syncValidity();
    } else if (name === 'disabled') {
      this.#stopRepeat();
      this.#forwardInputAttrs();
      this.#syncButtonsDisabled();
    } else if (name === 'readonly' || name === 'placeholder' || name === 'required') {
      this.#forwardInputAttrs();
      if (name === 'required') this.#syncValidity();
    } else if (name === 'name') {
      this.#forwardInputAttrs();
    } else if (name === 'invalid') {
      this.#syncDescribedBy();
    }
  }

  formResetCallback(): void {
    this.#applyingUserInput = false;
    (this as unknown as { value: string }).value = this.#initialValue;
    /* v8 ignore next -- defensive; reset only fires after connect */
    if (this.#input) this.#input.value = this.#initialValue;
    this.#callSetFormValue(this.#initialValue);
    this.#syncSpinbuttonAria();
    this.#syncButtonsDisabled();
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
    /* v8 ignore next -- jsdom shim doesn't expose checkValidity */
    if (typeof fn === 'function') return fn.call(this.#internals);
    return true;
  }

  reportValidity(): boolean {
    const fn = (this.#internals as unknown as { reportValidity?: () => boolean } | undefined)
      ?.reportValidity;
    /* v8 ignore next -- jsdom shim doesn't expose reportValidity */
    if (typeof fn === 'function') return fn.call(this.#internals);
    return true;
  }

  override focus(options?: FocusOptions): void {
    this.#input?.focus(options);
  }

  // --- Property accessors --------------------------------------------

  #readString(name: string): string {
    const v = this.readProperty(name);
    /* v8 ignore next 2 -- declared properties always default to a string */
    if (typeof v !== 'string') return v == null ? '' : String(v);
    return v;
  }

  #readMin(): number {
    const raw = this.readProperty('min');
    if (raw === null || raw === undefined || raw === '') return Number.NEGATIVE_INFINITY;
    const n = Number(raw);
    return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
  }

  #readMax(): number {
    const raw = this.readProperty('max');
    if (raw === null || raw === undefined || raw === '') return Number.POSITIVE_INFINITY;
    const n = Number(raw);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  }

  #readStep(): number {
    const raw = this.readProperty('step');
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  // --- Input forwarding + ARIA ---------------------------------------

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

  #syncSpinbuttonAria(): void {
    /* v8 ignore next -- defensive; called only from sync paths after connect */
    if (!this.#input) return;
    this.#input.setAttribute('role', 'spinbutton');
    const min = this.#readMin();
    const max = this.#readMax();
    if (Number.isFinite(min)) this.#input.setAttribute('aria-valuemin', String(min));
    else this.#input.removeAttribute('aria-valuemin');
    if (Number.isFinite(max)) this.#input.setAttribute('aria-valuemax', String(max));
    else this.#input.removeAttribute('aria-valuemax');
    const v = this.#readString('value');
    const parsed = parseNumber(v);
    if (parsed !== null) {
      this.#input.setAttribute('aria-valuenow', String(parsed));
      this.#input.removeAttribute('aria-valuetext');
    } else {
      this.#input.removeAttribute('aria-valuenow');
      this.#input.setAttribute('aria-valuetext', 'empty');
    }
  }

  #syncButtonsDisabled(): void {
    /* v8 ignore next -- defensive; #dec / #inc set after connect */
    if (!this.#dec || !this.#inc) return;
    const hostDisabled = Boolean(this.readProperty('disabled'));
    const hostReadonly = Boolean(this.readProperty('readonly'));
    if (hostDisabled || hostReadonly) {
      this.#dec.disabled = true;
      this.#inc.disabled = true;
      return;
    }
    const v = parseNumber(this.#readString('value'));
    const min = this.#readMin();
    const max = this.#readMax();
    if (v === null) {
      this.#dec.disabled = false;
      this.#inc.disabled = false;
      return;
    }
    this.#dec.disabled = v <= min;
    this.#inc.disabled = v >= max;
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

  // --- Slot wiring ---------------------------------------------------

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
      /* v8 ignore start -- the text-node branch is unreachable for named slots */
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

  // --- Form association ----------------------------------------------

  #callSetFormValue(value: string): void {
    const fn = (this.#internals as unknown as {
      setFormValue?: (v: string | null | FormData | File) => void;
    } | undefined)?.setFormValue;
    /* v8 ignore next -- jsdom shim doesn't expose setFormValue */
    if (typeof fn === 'function') fn.call(this.#internals, value === '' ? null : value);
  }

  #syncValidity(): void {
    /* v8 ignore next -- defensive; called from sync paths after connect */
    if (!this.#input) return;
    const required = Boolean(this.readProperty('required'));
    const typed = this.#input.value;
    const min = this.#readMin();
    const max = this.#readMax();
    const step = this.#readStep();

    let flags: ValidityStateFlags = {};
    let message = '';

    if (typed === '') {
      if (required) {
        flags = { valueMissing: true };
        message = 'Please fill out this field.';
      }
    } else {
      const parsed = parseNumber(typed);
      if (parsed === null) {
        flags = { badInput: true };
        message = 'Please enter a number.';
      } else if (Number.isFinite(min) && parsed < min) {
        flags = { rangeUnderflow: true };
        message = `Value must be ${min} or greater.`;
      } else if (Number.isFinite(max) && parsed > max) {
        flags = { rangeOverflow: true };
        message = `Value must be ${max} or less.`;
      } else if (!isOnGrid(parsed, Number.isFinite(min) ? min : 0, step)) {
        flags = { stepMismatch: true };
        message = 'Please enter a value that matches the step.';
      }
    }

    const setValidity = (this.#internals as unknown as {
      setValidity?: (flags: ValidityStateFlags, message?: string, anchor?: HTMLElement) => void;
    } | undefined)?.setValidity;

    const hasFlag = Object.values(flags).some(Boolean);
    if (hasFlag) {
      /* v8 ignore next 3 -- jsdom shim doesn't expose setValidity */
      if (typeof setValidity === 'function') {
        setValidity.call(this.#internals, flags, message, this.#input);
      }
      this.#validityMessage = message;
      (this as unknown as { invalid: boolean }).invalid = true;
    } else {
      /* v8 ignore next -- jsdom shim doesn't expose setValidity */
      if (typeof setValidity === 'function') setValidity.call(this.#internals, {});
      this.#validityMessage = '';
      (this as unknown as { invalid: boolean }).invalid = false;
    }
    this.#syncDescribedBy();
  }

  // --- Input event flow ----------------------------------------------

  #onInputInput = (): void => {
    /* v8 ignore next -- defensive; listener only fires while #input exists */
    if (!this.#input) return;
    const next = this.#input.value;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = next;
    this.#applyingUserInput = false;
    this.#callSetFormValue(next);
    this.#syncSpinbuttonAria();
    this.#syncButtonsDisabled();
    this.#syncValidity();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  };

  #onInputBlur = (): void => {
    this.#commitTyped('type');
  };

  #onInputKeydown = (event: KeyboardEvent): void => {
    if (this.readProperty('disabled') || this.readProperty('readonly')) return;
    const key = event.key;
    const step = this.#readStep();
    const min = this.#readMin();
    const max = this.#readMax();

    let target: number | undefined;
    let handled = true;

    const current = parseNumber(this.#readString('value'));
    const base = current ?? (Number.isFinite(min) ? min : 0);

    switch (key) {
      case 'ArrowUp':
        target = addStep(base, step, 1);
        break;
      case 'ArrowDown':
        target = addStep(base, step, -1);
        break;
      case 'PageUp':
        target = addStep(base, step * PAGE_MULTIPLIER, 1);
        break;
      case 'PageDown':
        target = addStep(base, step * PAGE_MULTIPLIER, -1);
        break;
      case 'Home':
        if (Number.isFinite(min)) target = min;
        else handled = false;
        break;
      case 'End':
        if (Number.isFinite(max)) target = max;
        else handled = false;
        break;
      default:
        handled = false;
    }

    if (!handled || target === undefined) return;
    event.preventDefault();
    const clamped = clamp(target, min, max);
    this.#commitNumeric(clamped, 'key');
  };

  // --- Buttons -------------------------------------------------------

  #onDecPointerDown = (event: PointerEvent): void => {
    if (this.#dec?.disabled) return;
    if (event.button !== 0) return;
    this.#startRepeat(-1);
  };

  #onIncPointerDown = (event: PointerEvent): void => {
    if (this.#inc?.disabled) return;
    if (event.button !== 0) return;
    this.#startRepeat(1);
  };

  #onDecClick = (event: MouseEvent): void => {
    // Synthetic clicks (keyboard activation) do not produce pointerdown/up.
    // A real click after pointerdown will see a still-empty pointerType,
    // but the increment already happened in #startRepeat — guard via
    // detail (real clicks have detail > 0).
    if (event.detail !== 0) return;
    if (this.#dec?.disabled) return;
    this.#applyDelta(-1);
  };

  #onIncClick = (event: MouseEvent): void => {
    if (event.detail !== 0) return;
    if (this.#inc?.disabled) return;
    this.#applyDelta(1);
  };

  #startRepeat(sign: 1 | -1): void {
    this.#stopRepeat();
    this.#applyDelta(sign);
    this.#repeatDelay = setTimeout(() => {
      this.#repeatInterval = setInterval(() => {
        this.#applyDelta(sign);
        if (this.#atBoundary(sign)) this.#stopRepeat();
      }, REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }

  #stopRepeat = (): void => {
    if (this.#repeatDelay !== undefined) {
      clearTimeout(this.#repeatDelay);
      this.#repeatDelay = undefined;
    }
    if (this.#repeatInterval !== undefined) {
      clearInterval(this.#repeatInterval);
      this.#repeatInterval = undefined;
    }
  };

  #atBoundary(sign: 1 | -1): boolean {
    const v = parseNumber(this.#readString('value'));
    /* v8 ignore next -- only reachable mid-repeat; #applyDelta seeds value before this is called */
    if (v === null) return false;
    if (sign === 1) return v >= this.#readMax();
    return v <= this.#readMin();
  }

  #applyDelta(sign: 1 | -1): void {
    const step = this.#readStep();
    const min = this.#readMin();
    const max = this.#readMax();
    const current = parseNumber(this.#readString('value'));
    const base = current ?? (Number.isFinite(min) ? min : 0);
    const next = clamp(addStep(base, step, sign), min, max);
    if (current !== null && next === current) return;
    this.#commitNumeric(next, sign === 1 ? 'increment' : 'decrement');
  }

  // --- Commit flow ---------------------------------------------------

  #commitNumeric(n: number, source: CommitSource): void {
    /* v8 ignore next -- defensive; #input set after connect */
    if (!this.#input) return;
    const step = this.#readStep();
    const formatted = formatNumber(n, step);
    this.#input.value = formatted;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = formatted;
    this.#applyingUserInput = false;
    this.#callSetFormValue(formatted);
    this.#syncSpinbuttonAria();
    this.#syncButtonsDisabled();
    this.#syncValidity();
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: formatted, source },
      }),
    );
  }

  #commitTyped(source: CommitSource): void {
    /* v8 ignore next -- defensive; #input set after connect */
    if (!this.#input) return;
    const typed = this.#input.value;
    if (typed === '') {
      this.dispatchEvent(
        new CustomEvent('change', {
          bubbles: true,
          composed: true,
          detail: { value: '', source },
        }),
      );
      return;
    }
    const parsed = parseNumber(typed);
    if (parsed === null) {
      // Keep typed text in the input; let validity flag the badInput state.
      this.dispatchEvent(
        new CustomEvent('change', {
          bubbles: true,
          composed: true,
          detail: { value: typed, source },
        }),
      );
      return;
    }
    const step = this.#readStep();
    const min = this.#readMin();
    const anchor = Number.isFinite(min) ? min : 0;
    const snapped = snapToGrid(parsed, anchor, step);
    const clamped = clamp(snapped, min, this.#readMax());
    const formatted = formatNumber(clamped, step);
    if (this.#input.value !== formatted) this.#input.value = formatted;
    this.#applyingUserInput = true;
    (this as unknown as { value: string }).value = formatted;
    this.#applyingUserInput = false;
    this.#callSetFormValue(formatted);
    this.#syncSpinbuttonAria();
    this.#syncButtonsDisabled();
    this.#syncValidity();
    this.dispatchEvent(
      new CustomEvent('change', {
        bubbles: true,
        composed: true,
        detail: { value: formatted, source },
      }),
    );
  }
}
