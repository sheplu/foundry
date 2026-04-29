import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './textarea.template.html?raw';
import styleCss from './textarea.css?inline';

// Attributes that forward straight onto the inner <textarea>. Each is
// mirrored whenever it changes on the host, so constraint validation stays
// in sync.
const FORWARDED_ATTRS = [
  'placeholder',
  'required',
  'disabled',
  'readonly',
  'minlength',
  'maxlength',
  'autocomplete',
  'inputmode',
  'rows',
] as const;

type ForwardedAttr = typeof FORWARDED_ATTRS[number];

/**
 * Themable multi-line text field with built-in label, hint, and error
 * slots. Near-clone of `<foundry-text-field>`, wrapping a `<textarea>`
 * instead of `<input>`. Participates in HTML forms via `ElementInternals`
 * (`static formAssociated = true`), so submission captures `name`/`value`
 * just like a native `<textarea>`. Constraint validation is delegated to
 * the inner element — set `required`, `minlength`, `maxlength` on the
 * host and the component mirrors the textarea's `validity` onto
 * `internals.setValidity(...)`. When invalid, the host reflects `invalid`
 * so CSS can style the border red using the intent-danger tokens.
 *
 * @element foundry-textarea
 * @summary Labelled multi-line text field with hint, error, and form association.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {string} value - Current value. Two-way synced with the inner textarea.
 * @attr {string} placeholder - Placeholder text.
 * @attr {boolean} required - Marks the field as required for validation.
 * @attr {boolean} disabled - Disables the inner textarea.
 * @attr {boolean} readonly - Makes the inner textarea readonly.
 * @attr {number} minlength - Minimum allowed length.
 * @attr {number} maxlength - Maximum allowed length.
 * @attr {string} autocomplete - Autocomplete hint forwarded to the textarea.
 * @attr {string} inputmode - Virtual-keyboard hint forwarded to the textarea.
 * @attr {number} rows - Visible row count on the inner textarea. Defaults to `3`.
 * @attr {boolean} invalid - Reflected. Present whenever the inner textarea's
 *   validity fails. Managed by the component; not set by consumers.
 *
 * Note: `has-label`, `has-hint`, and `has-error` are internal CSS hooks the
 * component sets automatically based on slot content. Not public API.
 *
 * @slot label - Required. The visible label text.
 * @slot hint - Optional helper copy shown below the textarea.
 * @slot error - Optional error message shown only when the field is invalid.
 *
 * @csspart container - The outer flex column wrapper.
 * @csspart label - The `<label>` element (linked to the textarea via aria-labelledby).
 * @csspart input - The native `<textarea>` element. Named `input` for consistency
 *   with `<foundry-text-field>` so ::part(input) works across both controls.
 * @csspart hint - The hint container.
 * @csspart error - The error container (visible only when invalid).
 *
 * @cssprop [--foundry-textarea-gap] - Vertical spacing between parts.
 * @cssprop [--foundry-textarea-label-font-size] - Label text size.
 * @cssprop [--foundry-textarea-label-font-weight] - Label font weight.
 * @cssprop [--foundry-textarea-label-color] - Label text color.
 * @cssprop [--foundry-textarea-padding] - Textarea padding.
 * @cssprop [--foundry-textarea-border-color] - Textarea border color.
 * @cssprop [--foundry-textarea-border-color-invalid] - Textarea border color when invalid.
 * @cssprop [--foundry-textarea-radius] - Textarea corner radius.
 * @cssprop [--foundry-textarea-background] - Textarea background color.
 * @cssprop [--foundry-textarea-foreground] - Textarea text color.
 * @cssprop [--foundry-textarea-focus-outline] - Focus outline color.
 * @cssprop [--foundry-textarea-focus-outline-invalid] - Focus outline when invalid.
 * @cssprop [--foundry-textarea-hint-font-size] - Hint text size.
 * @cssprop [--foundry-textarea-hint-color] - Hint text color.
 * @cssprop [--foundry-textarea-error-font-size] - Error text size.
 * @cssprop [--foundry-textarea-error-color] - Error text color.
 * @cssprop [--foundry-textarea-resize] - `resize` property. Defaults to `vertical`.
 * @cssprop [--foundry-textarea-min-block-size] - Minimum height. Defaults to `4em`.
 */
export class FoundryTextarea extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true, default: '' },
    placeholder: { type: String, reflect: true },
    required: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
    readonly: { type: Boolean, reflect: true, default: false },
    minlength: { type: Number, reflect: true },
    maxlength: { type: Number, reflect: true },
    autocomplete: { type: String, reflect: true },
    inputmode: { type: String, reflect: true },
    rows: { type: Number, reflect: true, default: 3 },
    invalid: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-textarea'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryTextarea);
    }
  }

  #internals: ElementInternals | undefined;
  #textarea: HTMLTextAreaElement | undefined;
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
    this.#textarea = this.refs['input'] as HTMLTextAreaElement | undefined;
    /* v8 ignore next -- guard against a missing template ref; unreachable in practice */
    if (!this.#textarea) return;

    this.#forwardAttributes();
    // Initial value sync (attribute may be set before connect).
    const initial = this.readProperty('value') as string;
    if (this.#textarea.value !== initial) this.#textarea.value = initial;
    this.#callSetFormValue(this.#textarea.value);

    this.#wireInputEvents();
    this.#wireSlotChanges();
    this.#syncValidity();
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #textarea is set */
    if (!this.#textarea) return;
    if (name === 'value') {
      if (this.#applyingUserInput) return;
      const v = this.readProperty('value') as string;
      if (this.#textarea.value !== v) this.#textarea.value = v;
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
    if (this.#textarea) this.#textarea.value = '';
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
    return i?.validity ?? this.#textarea?.validity;
  }

  get validationMessage(): string {
    const i = this.#internals as unknown as { validationMessage?: string } | undefined;
    return i?.validationMessage ?? this.#textarea?.validationMessage ?? '';
  }

  checkValidity(): boolean {
    const fn = (this.#internals as unknown as { checkValidity?: () => boolean } | undefined)
      ?.checkValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    return this.#textarea?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    const fn = (this.#internals as unknown as { reportValidity?: () => boolean } | undefined)
      ?.reportValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    return this.#textarea?.reportValidity() ?? true;
  }

  override focus(options?: FocusOptions): void {
    this.#textarea?.focus(options);
  }

  #forwardAttributes(): void {
    /* v8 ignore next -- defensive; connected() guarantees #textarea */
    if (!this.#textarea) return;
    for (const attr of FORWARDED_ATTRS) {
      this.#forwardOne(attr);
    }
  }

  #forwardOne(attr: ForwardedAttr): void {
    /* v8 ignore next -- defensive; connected() guarantees #textarea */
    if (!this.#textarea) return;
    const descriptor = FoundryTextarea.properties[attr];
    const value = this.readProperty(attr);

    if (descriptor?.type === Boolean) {
      // Boolean attributes: presence = true.
      if (value) this.#textarea.setAttribute(attr, '');
      else this.#textarea.removeAttribute(attr);
      return;
    }

    if (value === null || value === undefined || value === '') {
      this.#textarea.removeAttribute(attr);
      return;
    }
    this.#textarea.setAttribute(attr, String(value));
  }

  #wireInputEvents(): void {
    /* v8 ignore next -- defensive; connected() guarantees #textarea */
    if (!this.#textarea) return;
    this.#textarea.addEventListener('input', () => {
      /* v8 ignore next -- defensive; listener only fires while #textarea exists */
      if (!this.#textarea) return;
      this.#applyingUserInput = true;
      (this as unknown as { value: string }).value = this.#textarea.value;
      this.#applyingUserInput = false;
      this.#callSetFormValue(this.#textarea.value);
      this.#syncValidity();
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    this.#textarea.addEventListener('change', () => {
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
           textarea doesn't have); kept for symmetry with alert's helper */
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
    if (!this.#textarea) return;
    const ids: string[] = [];
    if (this.hasAttribute('has-hint')) ids.push('hint');
    const isInvalid = Boolean(this.readProperty('invalid'));
    const hasError = this.hasAttribute('has-error');
    if (isInvalid && hasError) {
      ids.push('err');
      this.#textarea.setAttribute('aria-errormessage', 'err');
    } else {
      this.#textarea.removeAttribute('aria-errormessage');
    }
    if (ids.length === 0) this.#textarea.removeAttribute('aria-describedby');
    else this.#textarea.setAttribute('aria-describedby', ids.join(' '));
    this.#textarea.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
  }

  #syncValidity(): void {
    /* v8 ignore next -- defensive; called only from sync paths after connect */
    if (!this.#textarea) return;
    const v = this.#textarea.validity;
    const setValidity = (this.#internals as unknown as {
      setValidity?: (flags: ValidityStateFlags, message?: string, anchor?: HTMLElement) => void;
    } | undefined)?.setValidity;

    if (v.valid) {
      if (typeof setValidity === 'function') setValidity.call(this.#internals, {});
      (this as unknown as { invalid: boolean }).invalid = false;
    } else {
      if (typeof setValidity === 'function') {
        setValidity.call(this.#internals, v, this.#textarea.validationMessage, this.#textarea);
      }
      (this as unknown as { invalid: boolean }).invalid = true;
    }
    this.#syncDescribedBy();
  }
}
