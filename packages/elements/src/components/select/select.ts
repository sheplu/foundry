import { FoundryElement } from '../../core/foundry-element.ts';
import { PopoverController } from '../../core/popover-controller.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import { FoundryOption } from '../option/option.ts';
import templateHtml from './select.template.html?raw';
import styleCss from './select.css?inline';

const DEFAULT_OFFSET = 4;

/**
 * Themable select form control (closed state only, Phase 1). Renders a
 * dropdown-style trigger that displays the current selection's label (or
 * a placeholder when none), and participates in HTML forms via
 * `ElementInternals` (`static formAssociated = true`). Children are
 * `<foundry-option>` elements; the select discovers them via `slotchange`
 * on the listbox's default slot.
 *
 * The listbox surface exists in the shadow DOM (role="listbox", popover=
 * "manual") and is wired through `PopoverController`, but is NOT opened in
 * Phase 1 — click-to-open, keyboard navigation, `aria-activedescendant`
 * and flip/shift positioning all land in Phase 2. The trigger's
 * `aria-expanded` stays `"false"` throughout.
 *
 * Initial-value resolution follows native `<select>` semantics: the `value`
 * attribute wins when set and matches an option. `formResetCallback()`
 * snapshots the initial `value` attribute and restores it on reset.
 * Required + empty reports `valueMissing`.
 *
 * @element foundry-select
 * @summary Labelled dropdown form control with form association.
 *
 * @attr {string} name - Form field name. Submitted with the form.
 * @attr {string} value - Current selection. Two-way: reading shows the
 *   selected option's value; writing selects a matching option.
 * @attr {string} placeholder - Text shown when no option is selected.
 * @attr {boolean} required - Marks the field as required. Empty + required
 *   reports `valueMissing`.
 * @attr {boolean} disabled - Disables the trigger; form participation suppressed.
 * @attr {boolean} invalid - Reflected. Managed internally; not set by consumers.
 *
 * @slot label - Optional label text above the trigger.
 * @slot - Default slot. `<foundry-option>` children.
 * @slot hint - Optional hint text below the trigger.
 * @slot error - Optional error message shown when `invalid`.
 *
 * @csspart container - Outer flex wrapper (label + control + hint/error + listbox).
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
  #controller: PopoverController | undefined;
  // Initial value snapshot, captured on first connect so formResetCallback
  // can restore exactly what the author declared in HTML.
  #initialValue = '';

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

    this.#controller = new PopoverController({
      host: this,
      surface: this.#listbox,
      getAnchor: () => this.#control,
      getPlacement: () => 'bottom',
      offset: DEFAULT_OFFSET,
    });
    // Phase 2 will wire trigger click/keyboard to call controller.show().
    // Attach still runs so scroll/resize listeners are set up in advance.
    this.#controller.attach();

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

  #onSlotChange = (): void => {
    this.#readOptions();
    this.#applyValue();
  };

  #readOptions(): void {
    /* v8 ignore next -- defensive; connected() guarantees #optionsSlot */
    if (!this.#optionsSlot) return;
    const assigned = this.#optionsSlot.assignedElements({ flatten: true });
    this.#options = assigned.filter(
      (el): el is FoundryOption => el instanceof FoundryOption,
    );
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
}
