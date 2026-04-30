import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './checkbox.template.html?raw';
import styleCss from './checkbox.css?inline';

// Attributes that forward straight onto the inner <input type="checkbox">.
const FORWARDED_ATTRS = ['required', 'disabled'] as const;

type ForwardedAttr = typeof FORWARDED_ATTRS[number];

/**
 * Themable boolean form control. First form control in the library whose
 * submitted value is not a simple synced string: when unchecked, the field
 * is **omitted** from `FormData` — matching native `<input type=checkbox>`
 * semantics. Participates in HTML forms via `ElementInternals`
 * (`static formAssociated = true`).
 *
 * The checkbox wraps its inner `<input>` in a native `<label>` element, so
 * clicking the visual box OR the slotted label text toggles the state —
 * the browser's native label-click-to-toggle behaviour is preserved even
 * across the shadow DOM boundary because the slotted content is a
 * descendant of the `<label>` in the composed tree.
 *
 * @element foundry-checkbox
 * @summary Labelled boolean form control with form association.
 *
 * @attr {string} name - Form field name. Required for form participation.
 * @attr {string} value - Submitted as the field value when checked. Defaults
 *   to `on` (matches native `<input type=checkbox>`).
 * @attr {boolean} checked - Current state. Two-way synced with inner input.
 * @attr {boolean} required - Marks the field as required. Unchecked + required
 *   reports `valueMissing`.
 * @attr {boolean} disabled - Disables the inner input.
 * @attr {boolean} invalid - Reflected. Present whenever the inner input's
 *   validity fails. Managed by the component; not set by consumers.
 *
 * Note: `has-label` is an internal CSS hook the component sets automatically
 * based on slot content. Not public API.
 *
 * @slot label - Required. The visible label text.
 *
 * @csspart wrapper - The outer `<label>` element (clickable surface).
 * @csspart input - The native `<input type="checkbox">`. Visually hidden
 *   but focusable + keyboard-interactive.
 * @csspart box - The visual checkbox box (shows the check SVG when checked).
 * @csspart label - The span wrapping the slotted label text.
 *
 * @cssprop [--foundry-checkbox-gap] - Spacing between box and label.
 * @cssprop [--foundry-checkbox-box-size] - Visual box dimensions.
 * @cssprop [--foundry-checkbox-radius] - Box corner radius.
 * @cssprop [--foundry-checkbox-border-color] - Box border default.
 * @cssprop [--foundry-checkbox-border-color-invalid] - Box border when invalid.
 * @cssprop [--foundry-checkbox-border-color-disabled] - Box border when disabled.
 * @cssprop [--foundry-checkbox-background] - Box fill default.
 * @cssprop [--foundry-checkbox-background-checked] - Box fill when checked.
 * @cssprop [--foundry-checkbox-background-disabled] - Box fill when disabled.
 * @cssprop [--foundry-checkbox-check-color] - SVG check stroke color.
 * @cssprop [--foundry-checkbox-label-color] - Label text color.
 * @cssprop [--foundry-checkbox-focus-outline] - Focus ring color.
 * @cssprop [--foundry-checkbox-focus-outline-invalid] - Focus ring when invalid.
 * @cssprop [--foundry-checkbox-cursor] - Cursor style. Defaults to `pointer`.
 */
export class FoundryCheckbox extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: String, reflect: true, default: 'on' },
    checked: { type: Boolean, reflect: true, default: false },
    required: { type: Boolean, reflect: true, default: false },
    disabled: { type: Boolean, reflect: true, default: false },
    invalid: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-checkbox'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryCheckbox);
    }
  }

  #internals: ElementInternals | undefined;
  #input: HTMLInputElement | undefined;
  // Suppress the checked propertyChanged feedback loop when we write the
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
        // in web-test-runner (real browser).
      }
    }
    this.#input = this.refs['input'] as HTMLInputElement | undefined;
    /* v8 ignore next -- guard against a missing template ref; unreachable in practice */
    if (!this.#input) return;

    this.#forwardAttributes();
    // Initial checked sync (attribute may be set before connect).
    const initialChecked = Boolean(this.readProperty('checked'));
    if (this.#input.checked !== initialChecked) this.#input.checked = initialChecked;
    this.#reportFormValue();

    this.#wireInputEvents();
    this.#wireLabelSlot();
    this.#syncValidity();
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #input is set */
    if (!this.#input) return;
    if (name === 'checked') {
      if (this.#applyingUserInput) return;
      const c = Boolean(this.readProperty('checked'));
      /* v8 ignore next -- defensive; base class only fires propertyChanged on
         actual change, so input.checked should already differ from c */
      if (this.#input.checked !== c) this.#input.checked = c;
      this.#reportFormValue();
      this.#syncValidity();
    } else if (name === 'value') {
      // Re-report the form value: if currently checked, the new `value` is
      // what submits next; if unchecked, nothing changes (still null).
      this.#reportFormValue();
    } else if ((FORWARDED_ATTRS as readonly string[]).includes(name)) {
      this.#forwardAttributes();
      this.#syncValidity();
    }
  }

  formResetCallback(): void {
    this.#applyingUserInput = false;
    (this as unknown as { checked: boolean }).checked = false;
    /* v8 ignore next -- defensive; form reset only fires after connect */
    if (this.#input) this.#input.checked = false;
    this.#reportFormValue();
    this.#syncValidity();
  }

  formDisabledCallback(disabled: boolean): void {
    (this as unknown as { disabled: boolean }).disabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
    // state is the stringified value we pushed via setFormValue (the `value`
    // attribute when checked, or null/omitted when unchecked).
    (this as unknown as { checked: boolean }).checked = state !== null;
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
    /* v8 ignore next -- `?? ''` final fallback; #input is always set after connect */
    return i?.validationMessage ?? this.#input?.validationMessage ?? '';
  }

  checkValidity(): boolean {
    const fn = (this.#internals as unknown as { checkValidity?: () => boolean } | undefined)
      ?.checkValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    /* v8 ignore next -- `?? true` final fallback; #input is always set after connect */
    return this.#input?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    const fn = (this.#internals as unknown as { reportValidity?: () => boolean } | undefined)
      ?.reportValidity;
    if (typeof fn === 'function') return fn.call(this.#internals);
    /* v8 ignore next -- `?? true` final fallback; #input is always set after connect */
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
    const value = this.readProperty(attr);
    if (value) this.#input.setAttribute(attr, '');
    else this.#input.removeAttribute(attr);
  }

  #wireInputEvents(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    // Native checkbox fires both `input` and `change` on toggle. Sync our
    // state on change (most authoritative) and re-dispatch both events.
    this.#input.addEventListener('change', () => {
      /* v8 ignore next -- defensive; listener only fires while #input exists */
      if (!this.#input) return;
      this.#applyingUserInput = true;
      (this as unknown as { checked: boolean }).checked = this.#input.checked;
      this.#applyingUserInput = false;
      this.#reportFormValue();
      this.#syncValidity();
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });
    this.#input.addEventListener('input', () => {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
  }

  #reportFormValue(): void {
    // Only submit when checked — matches native checkbox behavior.
    const checked = Boolean(this.readProperty('checked'));
    /* v8 ignore next -- `?? 'on'` final fallback; `value` default is `'on'` */
    const value = checked ? ((this.readProperty('value') as string) ?? 'on') : null;
    this.#callSetFormValue(value);
  }

  #callSetFormValue(value: string | null): void {
    const fn = (this.#internals as unknown as {
      setFormValue?: (v: string | null | FormData | File) => void;
    } | undefined)?.setFormValue;
    if (typeof fn === 'function') fn.call(this.#internals, value);
  }

  #wireLabelSlot(): void {
    const slot = this.refs['labelSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides the label slot */
    if (!slot) return;
    const sync = (): void => {
      const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
        if (n.nodeType === Node.ELEMENT_NODE) return true;
        /* v8 ignore next -- named slots only accept elements with slot=, so
           a bare text node can only reach here via a default slot (which
           checkbox doesn't have); kept for symmetry with text-field's helper */
        return (n.textContent ?? '').trim().length > 0;
      });
      this.toggleAttribute('has-label', hasContent);
    };
    slot.addEventListener('slotchange', sync);
    sync();
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
    this.#input.setAttribute('aria-invalid', this.readProperty('invalid') ? 'true' : 'false');
  }
}
