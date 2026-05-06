import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './slider.template.html?raw';
import styleCss from './slider.css?inline';

const DEFAULT_VALUE = 0;
const DEFAULT_MIN = 0;
const DEFAULT_MAX = 100;
const DEFAULT_STEP = 1;
const DEFAULT_LABEL = 'Slider';

const FORWARDED_ATTRS = [
  'min',
  'max',
  'step',
  'disabled',
  'required',
  'name',
] as const;

type ForwardedAttr = typeof FORWARDED_ATTRS[number];

/**
 * Single-thumb slider built on a native `<input type="range">`. Participates
 * in HTML forms via `ElementInternals` (`static formAssociated = true`), so
 * submission captures `name` / `value` exactly like a native range input.
 * Keyboard (Arrow / Home / End / PageUp / PageDown), pointer drag, and touch
 * are handled by the inner input.
 *
 * Emits `input` (continuous, as the user drags) and `change` (on release) —
 * both bubble + compose across shadow boundaries. The `value` attribute is
 * clamped to `[min, max]` by the inner input on change.
 *
 * @element foundry-slider
 * @summary Form-associated single-thumb range slider.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {number} value - Current value. Clamped to `[min, max]` and snapped
 *   to `step`. Default 0. Reflects.
 * @attr {number} min - Lower bound. Default 0. Reflects.
 * @attr {number} max - Upper bound. Default 100. Reflects.
 * @attr {number} step - Increment. Must be > 0. Default 1. Reflects.
 * @attr {boolean} disabled - Disables the inner input. Reflects.
 * @attr {boolean} required - Marks the field required for validation. Reflects.
 * @attr {string} label - Accessible label. Defaults to `Slider`.
 * @attr {string} value-label - Optional prefix for `aria-valuetext`
 *   (e.g. `value-label="Volume"` → "Volume 40"). When absent, the host has
 *   no `aria-valuetext` and screen readers read the numeric value only.
 *
 * @csspart track - The outer track wrapper.
 * @csspart fill - The filled portion from min to value.
 * @csspart input - The native `<input type="range">` overlay.
 *
 * @fires input - Bubbles + composed. Re-dispatched while the user drags.
 * @fires change - Bubbles + composed. Re-dispatched on release / blur.
 *
 * @cssprop [--foundry-slider-width] - Host inline-size. Defaults to `12rem`.
 * @cssprop [--foundry-slider-height] - Track height. Defaults to `0.25rem`.
 * @cssprop [--foundry-slider-radius] - Track corner radius. Defaults to `999px`.
 * @cssprop [--foundry-slider-track] - Track background color.
 * @cssprop [--foundry-slider-fill] - Filled-portion color.
 * @cssprop [--foundry-slider-thumb-size] - Thumb size. Defaults to `1rem`.
 * @cssprop [--foundry-slider-thumb-color] - Thumb fill color.
 * @cssprop [--foundry-slider-thumb-border] - Thumb border shorthand.
 * @cssprop [--foundry-slider-focus-outline] - Focus ring color.
 * @cssprop [--foundry-slider-transition] - Fill transition duration.
 */
export class FoundrySlider extends FoundryElement {
  static formAssociated = true;

  static override properties = {
    name: { type: String, reflect: true },
    value: { type: Number, reflect: true, default: DEFAULT_VALUE },
    min: { type: Number, reflect: true, default: DEFAULT_MIN },
    max: { type: Number, reflect: true, default: DEFAULT_MAX },
    step: { type: Number, reflect: true, default: DEFAULT_STEP },
    disabled: { type: Boolean, reflect: true, default: false },
    required: { type: Boolean, reflect: true, default: false },
    label: { type: String, reflect: true, default: DEFAULT_LABEL },
    valueLabel: { type: String, reflect: true },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-slider'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundrySlider);
    }
  }

  #internals: ElementInternals | undefined;
  #input: HTMLInputElement | undefined;
  #fill: HTMLElement | undefined;
  #applyingUserInput = false;

  override connected(): void {
    /* v8 ignore next -- re-connect path; attach only once per element */
    if (!this.#internals) {
      try {
        this.#internals = this.attachInternals();
      } catch {
        // jsdom doesn't fully implement ElementInternals. Form-association
        // still works when the feature is present; other behaviour is
        // validated in jsdom unit tests.
      }
    }
    this.#input = this.refs['input'] as HTMLInputElement | undefined;
    this.#fill = this.refs['fill'] as HTMLElement | undefined;
    /* v8 ignore next -- defensive; template always provides input + fill refs */
    if (!this.#input || !this.#fill) return;

    this.#forwardAttributes();
    this.#syncInputValue();
    this.#syncLabel();
    this.#wireInputEvents();
    this.#syncFill();
    this.#syncValueText();
    this.#callSetFormValue(this.#input.value);
    this.#syncValidity();
  }

  override propertyChanged(name: string): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    if (name === 'value') {
      if (this.#applyingUserInput) return;
      this.#syncInputValue();
      this.#callSetFormValue(this.#input.value);
      this.#syncFill();
      this.#syncValueText();
      this.#syncValidity();
    } else if ((FORWARDED_ATTRS as readonly string[]).includes(name)) {
      this.#forwardAttributes();
      // min/max/step changes can re-clamp the input's value internally.
      this.#syncInputValue();
      this.#syncFill();
      this.#syncValueText();
      this.#syncValidity();
    } else if (name === 'label') {
      this.#syncLabel();
    } else if (name === 'valueLabel') {
      this.#syncValueText();
    }
  }

  formResetCallback(): void {
    this.#applyingUserInput = false;
    (this as unknown as { value: number }).value = DEFAULT_VALUE;
    /* v8 ignore next -- defensive; form reset only fires after connect */
    if (this.#input) this.#input.value = String(DEFAULT_VALUE);
    this.#callSetFormValue(String(DEFAULT_VALUE));
    this.#syncFill();
    this.#syncValueText();
    this.#syncValidity();
  }

  formDisabledCallback(disabled: boolean): void {
    (this as unknown as { disabled: boolean }).disabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
    const n = Number(state);
    (this as unknown as { value: number }).value = Number.isFinite(n)
      ? n
      : DEFAULT_VALUE;
  }

  get form(): HTMLFormElement | null {
    /* v8 ignore next 2 -- ElementInternals branches, exercised in functional tests */
    const f = this.#internals as unknown as { form?: HTMLFormElement } | undefined;
    return f?.form ?? null;
  }

  get validity(): ValidityState | undefined {
    /* v8 ignore next 2 -- ElementInternals branches, exercised in functional tests */
    const i = this.#internals as unknown as { validity?: ValidityState } | undefined;
    return i?.validity ?? this.#input?.validity;
  }

  get validationMessage(): string {
    /* v8 ignore next 2 -- ElementInternals branches, exercised in functional tests */
    const i = this.#internals as unknown as { validationMessage?: string } | undefined;
    return i?.validationMessage ?? this.#input?.validationMessage ?? '';
  }

  checkValidity(): boolean {
    const fn = (this.#internals as unknown as { checkValidity?: () => boolean } | undefined)
      ?.checkValidity;
    /* v8 ignore next -- ElementInternals present branch, exercised in functional tests */
    if (typeof fn === 'function') return fn.call(this.#internals);
    return this.#input?.checkValidity() ?? true;
  }

  reportValidity(): boolean {
    const fn = (this.#internals as unknown as { reportValidity?: () => boolean } | undefined)
      ?.reportValidity;
    /* v8 ignore next -- ElementInternals present branch, exercised in functional tests */
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
    const descriptor = FoundrySlider.properties[attr];
    const value = this.readProperty(attr);

    if (descriptor?.type === Boolean) {
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

  #syncInputValue(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    this.#input.type = 'range';
    const raw = Number(this.readProperty('value'));
    const safe = Number.isFinite(raw) ? raw : DEFAULT_VALUE;
    const asString = String(safe);
    if (this.#input.value !== asString) this.#input.value = asString;
  }

  #syncLabel(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    const label = (this.readProperty('label') as string | undefined) || DEFAULT_LABEL;
    this.#input.setAttribute('aria-label', label);
  }

  #wireInputEvents(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    this.#input.addEventListener('input', () => {
      /* v8 ignore next -- defensive; listener only fires while #input exists */
      if (!this.#input) return;
      const next = Number(this.#input.value);
      this.#applyingUserInput = true;
      (this as unknown as { value: number }).value = Number.isFinite(next)
        ? next
        : DEFAULT_VALUE;
      this.#applyingUserInput = false;
      this.#callSetFormValue(this.#input.value);
      this.#syncFill();
      this.#syncValueText();
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
    /* v8 ignore next -- ElementInternals present branch, exercised in functional tests */
    if (typeof fn === 'function') fn.call(this.#internals, value);
  }

  #syncFill(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input + #fill */
    if (!this.#input || !this.#fill) return;
    const min = this.#readNumber('min', DEFAULT_MIN);
    const max = this.#readNumber('max', DEFAULT_MAX);
    const range = max - min;
    const value = Number(this.#input.value);
    const clampedValue = Number.isFinite(value)
      ? Math.min(Math.max(value, min), max)
      : min;
    const pct = range > 0 ? ((clampedValue - min) / range) * 100 : 0;
    this.#fill.style.setProperty('--_fill', `${pct}%`);
  }

  #syncValueText(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    const prefix = this.readProperty('valueLabel') as string | undefined;
    const current = this.#input.value;
    if (prefix) {
      this.setAttribute('aria-valuetext', `${prefix} ${current}`);
    } else {
      this.removeAttribute('aria-valuetext');
    }
  }

  #syncValidity(): void {
    /* v8 ignore next -- defensive; connected() guarantees #input */
    if (!this.#input) return;
    const v = this.#input.validity;
    const setValidity = (this.#internals as unknown as {
      setValidity?: (flags: ValidityStateFlags, message?: string, anchor?: HTMLElement) => void;
    } | undefined)?.setValidity;

    /* v8 ignore next 5 -- ElementInternals branches, exercised in functional tests */
    if (v.valid) {
      if (typeof setValidity === 'function') setValidity.call(this.#internals, {});
    } else if (typeof setValidity === 'function') {
      setValidity.call(this.#internals, v, this.#input.validationMessage, this.#input);
    }
  }

  #readNumber(name: string, fallback: number): number {
    const raw = Number(this.readProperty(name));
    return Number.isFinite(raw) ? raw : fallback;
  }
}
