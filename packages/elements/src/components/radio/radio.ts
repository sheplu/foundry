import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './radio.template.html?raw';
import styleCss from './radio.css?inline';

// Attributes that forward straight onto the inner <input type="radio">.
const FORWARDED_ATTRS = ['required', 'disabled'] as const;

type ForwardedAttr = typeof FORWARDED_ATTRS[number];

const NAV_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
]);

/**
 * Themable radio form control. Exactly one radio per `name` group can be
 * checked at a time. Radios self-coordinate: when one becomes checked it
 * queries siblings via `form.elements.namedItem(name)` (or a document-level
 * query for orphan radios) and unchecks them.
 *
 * Arrow keys move focus + selection between siblings per the WAI-ARIA
 * radiogroup pattern; roving tabindex ensures only one radio per group is
 * in the tab order.
 *
 * Participates in HTML forms via `ElementInternals`. Only the checked
 * radio in a group surfaces `name=value` in `FormData`; unchecked radios
 * are omitted (matches native `<input type=radio>` semantics).
 *
 * @element foundry-radio
 * @summary Labelled radio form control with group coordination.
 *
 * @attr {string} name - Form field name. Radios with the same `name` form a group.
 * @attr {string} value - Submitted as the field value when checked. Should be
 *   unique within the group.
 * @attr {boolean} checked - Current state. Setting it true unchecks siblings.
 * @attr {boolean} required - Marks the field as required.
 * @attr {boolean} disabled - Disables the inner input. Disabled radios are
 *   skipped during arrow-key navigation.
 * @attr {boolean} invalid - Reflected. Managed by the component; not set by
 *   consumers.
 *
 * Note: `has-label` is an internal CSS hook the component sets automatically
 * based on slot content. Not public API.
 *
 * @slot label - Required. The visible label text.
 *
 * @csspart wrapper - The outer `<label>` element (clickable surface).
 * @csspart input - The native `<input type="radio">`. Visually hidden but
 *   focusable + keyboard-interactive.
 * @csspart box - The visual circle (outer ring + inner dot via pseudo-element).
 * @csspart label - The span wrapping the slotted label text.
 *
 * @cssprop [--foundry-radio-gap] - Spacing between box and label.
 * @cssprop [--foundry-radio-box-size] - Visual box diameter.
 * @cssprop [--foundry-radio-dot-size] - Inner dot diameter (percentage of box).
 * @cssprop [--foundry-radio-border-color] - Box border default.
 * @cssprop [--foundry-radio-border-color-invalid] - Box border when invalid.
 * @cssprop [--foundry-radio-border-color-disabled] - Box border when disabled.
 * @cssprop [--foundry-radio-background] - Box fill default.
 * @cssprop [--foundry-radio-background-checked] - Box fill / border when checked.
 * @cssprop [--foundry-radio-background-disabled] - Box fill when disabled.
 * @cssprop [--foundry-radio-dot-color] - Inner-dot color.
 * @cssprop [--foundry-radio-label-color] - Label text color.
 * @cssprop [--foundry-radio-focus-outline] - Focus ring color.
 * @cssprop [--foundry-radio-focus-outline-invalid] - Focus ring when invalid.
 * @cssprop [--foundry-radio-cursor] - Cursor style. Defaults to `pointer`.
 */
export class FoundryRadio extends FoundryElement {
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

  static define(tag = 'foundry-radio'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryRadio);
    }
  }

  #internals: ElementInternals | undefined;
  #input: HTMLInputElement | undefined;
  // Suppress the checked propertyChanged feedback loop when we write the
  // property from inside the input listener.
  #applyingUserInput = false;
  #keydownHandler: ((e: KeyboardEvent) => void) | undefined;

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

    // Defer tabindex update until the DOM is fully settled (siblings may
    // still be connecting). A microtask is enough.
    queueMicrotask(() => this.#updateGroupTabindex());
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
      if (c) this.#uncheckSiblings();
      this.#reportFormValue();
      this.#syncValidity();
      this.#updateGroupTabindex();
    } else if (name === 'value') {
      // Re-report the form value: if currently checked, the new `value` is
      // what submits next; if unchecked, nothing changes (still null).
      this.#reportFormValue();
    } else if (name === 'name') {
      // Re-evaluate roving tabindex for the new group membership.
      this.#updateGroupTabindex();
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
    this.#updateGroupTabindex();
  }

  formDisabledCallback(disabled: boolean): void {
    (this as unknown as { disabled: boolean }).disabled = disabled;
  }

  formStateRestoreCallback(state: string | null): void {
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

    this.#input.addEventListener('change', () => {
      /* v8 ignore next -- defensive; listener only fires while #input exists */
      if (!this.#input) return;
      this.#applyingUserInput = true;
      (this as unknown as { checked: boolean }).checked = this.#input.checked;
      this.#applyingUserInput = false;
      /* v8 ignore next -- native radios never emit change with checked=false
         from a user click; always true at this point */
      if (this.#input.checked) this.#uncheckSiblings();
      this.#reportFormValue();
      this.#syncValidity();
      this.#updateGroupTabindex();
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });

    this.#input.addEventListener('input', () => {
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });

    // Arrow-key navigation. Per WAI-ARIA APG, arrow moves focus + selects;
    // Home/End jump to first/last. Tab exits the group.
    this.#keydownHandler = (e: KeyboardEvent): void => this.#onKeydown(e);
    this.#input.addEventListener('keydown', this.#keydownHandler);
  }

  #onKeydown(e: KeyboardEvent): void {
    if (!NAV_KEYS.has(e.key)) return;
    const group = [...this.#groupSiblings()].filter(
      (r) => !(r as unknown as { disabled: boolean }).disabled,
    );
    /* v8 ignore next -- defensive; current radio is always in its own group */
    if (group.length === 0) return;
    e.preventDefault();
    const currentIdx = group.indexOf(this);
    let nextIdx: number;
    if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = group.length - 1;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      nextIdx = (currentIdx - 1 + group.length) % group.length;
    } else {
      nextIdx = (currentIdx + 1) % group.length;
    }
    const next = group[nextIdx];
    if (!next || next === this) return;
    (next as unknown as { checked: boolean }).checked = true;
    next.focus();
  }

  #reportFormValue(): void {
    // Only submit when checked — matches native radio behavior.
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

  // Find siblings in the group (same `name` attribute). Prefer
  // `form.elements.namedItem(name)` which is scoped to the parent form;
  // fall back to a document-level query for orphan radios.
  #groupSiblings(): FoundryRadio[] {
    const name = this.readProperty('name') as string | undefined;
    if (!name) return [this];
    const form = this.form;
    if (form) {
      const named = (form.elements as HTMLFormControlsCollection).namedItem(name);
      if (named instanceof RadioNodeList) {
        return Array.from(named).filter(isFoundryRadio) as unknown as FoundryRadio[];
      }
      /* v8 ignore next -- defensive; namedItem either returns a RadioNodeList
         (covered above) or a single FoundryRadio, or null (falls through) */
      if (isFoundryRadio(named)) return [named];
    }
    return Array.from(
      document.querySelectorAll<FoundryRadio>(
        `foundry-radio[name="${escapeCssAttr(name)}"]`,
      ),
    );
  }

  #uncheckSiblings(): void {
    for (const sibling of this.#groupSiblings()) {
      const siblingChecked = (sibling as unknown as { checked: boolean }).checked;
      if (sibling !== this && siblingChecked) {
        (sibling as unknown as { checked: boolean }).checked = false;
      }
    }
  }

  // Roving tabindex: one tabbable radio per group. The checked one if any,
  // otherwise the first. Others get tabindex=-1 so Tab skips them.
  #updateGroupTabindex(): void {
    const group = this.#groupSiblings();
    /* v8 ignore next -- defensive; current radio is always in its own group */
    if (group.length === 0) return;
    const checked = group.find((r) => (r as unknown as { checked: boolean }).checked);
    const tabbable = checked ?? group[0];
    for (const radio of group) {
      radio.#setInnerTabIndex(radio === tabbable ? 0 : -1);
    }
  }

  #setInnerTabIndex(tabIndex: number): void {
    /* v8 ignore next -- defensive; #updateGroupTabindex only calls this after
       connected() guarantees #input is set */
    if (this.#input) this.#input.tabIndex = tabIndex;
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
           radio doesn't have); kept for symmetry with checkbox's helper */
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

function isFoundryRadio(el: unknown): el is FoundryRadio {
  return el instanceof FoundryRadio;
}

// Escape a string for use inside a double-quoted CSS attribute selector.
// Prefer the native CSS.escape when available (all modern browsers); fall
// back to a minimal escape for jsdom where CSS.escape is not exposed.
function escapeCssAttr(value: string): string {
  const css = (globalThis as { CSS?: { escape?: (v: string) => string } }).CSS;
  /* v8 ignore next -- real browsers expose CSS.escape; jsdom's env doesn't.
     Coverage only exercises one branch per test run; the other is proven by
     real-browser functional/visual specs. */
  if (css && typeof css.escape === 'function') return css.escape(value);
  // Minimal fallback: escape backslash and double-quote so the selector stays valid.
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
