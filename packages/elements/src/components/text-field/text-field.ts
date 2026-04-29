import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './text-field.template.html?raw';
import styleCss from './text-field.css?inline';

export type TextFieldType
  = 'text' | 'email' | 'url' | 'tel' | 'password' | 'number' | 'search';

const DEFAULT_TYPE: TextFieldType = 'text';

// Attributes that forward straight onto the inner <input>. Each is mirrored
// whenever it changes on the host, so constraint validation stays in sync.
const FORWARDED_ATTRS = [
  'type',
  'placeholder',
  'required',
  'disabled',
  'readonly',
  'pattern',
  'minlength',
  'maxlength',
  'min',
  'max',
  'step',
  'autocomplete',
  'inputmode',
] as const;

type ForwardedAttr = typeof FORWARDED_ATTRS[number];

/**
 * Themable text field with built-in label, hint, and error slots. Participates
 * in HTML forms via `ElementInternals` (`static formAssociated = true`), so
 * submission captures `name`/`value` just like a native `<input>`. Constraint
 * validation is delegated to the inner input — set `required`, `pattern`,
 * `minlength`, etc. on the host and the component mirrors the input's
 * `validity` onto `internals.setValidity(...)`. When the input becomes
 * invalid, the host reflects `invalid` so CSS can style the border red
 * using the intent-danger tokens.
 *
 * @element foundry-text-field
 * @summary Labelled text input with hint, error, and form association.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {string} value - Current value. Two-way synced with the inner input.
 * @attr {'text' | 'email' | 'url' | 'tel' | 'password' | 'number' | 'search'} type -
 *   Input type. Defaults to `text`.
 * @attr {string} placeholder - Placeholder text.
 * @attr {boolean} required - Marks the field as required for validation.
 * @attr {boolean} disabled - Disables the inner input.
 * @attr {boolean} readonly - Makes the inner input readonly.
 * @attr {string} pattern - Regex pattern for constraint validation.
 * @attr {number} minlength - Minimum allowed length.
 * @attr {number} maxlength - Maximum allowed length.
 * @attr {string} min - Minimum value (for numeric types).
 * @attr {string} max - Maximum value (for numeric types).
 * @attr {string} step - Step increment (for numeric types).
 * @attr {string} autocomplete - Autocomplete hint forwarded to the input.
 * @attr {string} inputmode - Virtual-keyboard hint forwarded to the input.
 * @attr {boolean} invalid - Reflected. Present whenever the inner input's
 *   validity fails. Managed by the component; not set by consumers.
 *
 * Note: `has-label`, `has-hint`, and `has-error` are internal CSS hooks the
 * component sets automatically based on slot content. Not public API.
 *
 * @slot label - Required. The visible label text.
 * @slot hint - Optional helper copy shown below the input.
 * @slot error - Optional error message shown only when the field is invalid.
 *
 * @csspart container - The outer flex column wrapper.
 * @csspart label - The `<label>` element (linked to the input via aria-labelledby).
 * @csspart input - The native `<input>` element.
 * @csspart hint - The hint container.
 * @csspart error - The error container (visible only when invalid).
 *
 * @cssprop [--foundry-text-field-gap] - Vertical spacing between parts.
 * @cssprop [--foundry-text-field-label-font-size] - Label text size.
 * @cssprop [--foundry-text-field-label-font-weight] - Label font weight.
 * @cssprop [--foundry-text-field-label-color] - Label text color.
 * @cssprop [--foundry-text-field-padding] - Input padding.
 * @cssprop [--foundry-text-field-border-color] - Input border color.
 * @cssprop [--foundry-text-field-border-color-invalid] - Input border color when invalid.
 * @cssprop [--foundry-text-field-radius] - Input corner radius.
 * @cssprop [--foundry-text-field-background] - Input background color.
 * @cssprop [--foundry-text-field-foreground] - Input text color.
 * @cssprop [--foundry-text-field-focus-outline] - Focus outline color.
 * @cssprop [--foundry-text-field-focus-outline-invalid] - Focus outline when invalid.
 * @cssprop [--foundry-text-field-hint-font-size] - Hint text size.
 * @cssprop [--foundry-text-field-hint-color] - Hint text color.
 * @cssprop [--foundry-text-field-error-font-size] - Error text size.
 * @cssprop [--foundry-text-field-error-color] - Error text color.
 */
export class FoundryTextField extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true, default: '' },
    type: { type: String, reflect: true, default: DEFAULT_TYPE satisfies TextFieldType },
    placeholder: { type: String, reflect: true },
    required: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
    readonly: { type: Boolean, reflect: true, default: false },
    pattern: { type: String, reflect: true },
    minlength: { type: Number, reflect: true },
    maxlength: { type: Number, reflect: true },
    min: { type: String, reflect: true },
    max: { type: String, reflect: true },
    step: { type: String, reflect: true },
    autocomplete: { type: String, reflect: true },
    inputmode: { type: String, reflect: true },
    invalid: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-text-field'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTextField);
    }
  }

  #internals: ElementInternals | undefined;
  #input: HTMLInputElement | undefined;
  // Suppress the value propertyChanged feedback loop when we write the
  // property from inside the input listener.
  #applyingUserInput = false;

  override connected(): void {
    /* v8 ignore next -- re-connect path; attach only once per element */
    if (!this.#internals) {
      try {
        this.#internals = this.attachInternals();
      } catch {
        // jsdom (used by unit tests) doesn't fully implement ElementInternals.
        // Leave #internals undefined; form-association features are validated
        // in web-test-runner (real browser). All other behaviour still works.
      }
    }
    this.#input = this.refs['input'] as HTMLInputElement | undefined;
    /* v8 ignore next -- guard against a missing template ref; unreachable in practice */
    if (!this.#input) return;

    // Reflect the default type onto the host so selector-based styling and
    // consumer introspection work identically whether or not type was set.
    if (!this.hasAttribute('type')) this.setAttribute('type', DEFAULT_TYPE);

    this.#forwardAttributes();
    // Initial value sync (attribute may be set before connect).
    const initial = this.readProperty('value') as string;
    if (this.#input.value !== initial) this.#input.value = initial;
    this.#callSetFormValue(this.#input.value);

    this.#wireInputEvents();
    this.#wireSlotChanges();
    this.#syncValidity();
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #input is set */
    if (!this.#input) return;
    if (name === 'value') {
      if (this.#applyingUserInput) return;
      const v = this.readProperty('value') as string;
      if (this.#input.value !== v) this.#input.value = v;
      this.#callSetFormValue(v);
      this.#syncValidity();
    } else if ((FORWARDED_ATTRS as readonly string[]).includes(name)) {
      this.#forwardAttributes();
      this.#syncValidity();
    }
  }

  formResetCallback(): void {
    this.#applyingUserInput = false;
    (this as unknown as { value: string }).value = '';
    /* v8 ignore next -- defensive; form reset only fires after connect */
    if (this.#input) this.#input.value = '';
    this.#callSetFormValue('');
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
    return i?.validity ?? this.#input?.validity;
  }

  get validationMessage(): string {
    const i = this.#internals as unknown as { validationMessage?: string } | undefined;
    return i?.validationMessage ?? this.#input?.validationMessage ?? '';
  }

  checkValidity(): boolean {
    const fn = (this.#internals as unknown as { checkValidity?: () => boolean } | undefined)
      ?.checkValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    return this.#input?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    const fn = (this.#internals as unknown as { reportValidity?: () => boolean } | undefined)
      ?.reportValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    return this.#input?.reportValidity() ?? true;
  }

  override focus(options?: FocusOptions): void {
    this.#input?.focus(options);
  }

  #forwardAttributes(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    for (const attr of FORWARDED_ATTRS) {
      this.#forwardOne(attr);
    }
  }

  #forwardOne(attr: ForwardedAttr): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    const descriptor = FoundryTextField.properties[attr];
    const value = this.readProperty(attr);

    if (descriptor?.type === Boolean) {
      // Boolean attributes: presence = true.
      if (value) this.#input.setAttribute(attr, '');
      else this.#input.removeAttribute(attr);
      return;
    }

    if (value === null || value === undefined || value === '') {
      this.#input.removeAttribute(attr);
      return;
    }
    this.#input.setAttribute(attr, String(value));
  }

  #wireInputEvents(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    this.#input.addEventListener('input', () => {
      /* v8 ignore next -- defensive; listener only fires while #input exists */
      if (!this.#input) return;
      this.#applyingUserInput = true;
      (this as unknown as { value: string }).value = this.#input.value;
      this.#applyingUserInput = false;
      this.#callSetFormValue(this.#input.value);
      this.#syncValidity();
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    this.#input.addEventListener('change', () => {
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });
  }

  #callSetFormValue(value: string): void {
    const fn = (this.#internals as unknown as { setFormValue?: (v: string) => void } | undefined)
      ?.setFormValue;
    if (typeof fn === 'function') fn.call(this.#internals, value);
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
           a bare text node can only reach here via a default slot (which
           text-field doesn't have); kept for symmetry with alert's helper */
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
    if (!this.#input) return;
    const ids: string[] = [];
    if (this.hasAttribute('has-hint')) ids.push('hint');
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

  #syncValidity(): void {
    /* v8 ignore next -- defensive; called only from sync paths after connect */
    if (!this.#input) return;
    const v = this.#input.validity;
    const setValidity = (this.#internals as unknown as {
      setValidity?: (flags: ValidityStateFlags, message?: string, anchor?: HTMLElement) => void;
    } | undefined)?.setValidity;

    if (v.valid) {
      if (typeof setValidity === 'function') setValidity.call(this.#internals, {});
      (this as unknown as { invalid: boolean }).invalid = false;
    } else {
      if (typeof setValidity === 'function') {
        setValidity.call(this.#internals, v, this.#input.validationMessage, this.#input);
      }
      (this as unknown as { invalid: boolean }).invalid = true;
    }
    this.#syncDescribedBy();
  }
}
