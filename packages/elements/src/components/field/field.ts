import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './field.template.html?raw';
import styleCss from './field.css?inline';

let nextId = 0;

/**
 * Generic form-field wrapper. Renders a `label` / `helper` / `error` slot
 * stack around any slotted control — native `<input>`, third-party custom
 * elements, or any element a consumer treats as a form control. The wrapper
 * is intentionally **opt-in**: the existing foundry inputs (`text-field`,
 * `select`, `checkbox`, …) already carry their own label/hint/error slots
 * and aria wiring; reach for `<foundry-field>` only when wrapping a control
 * that does not.
 *
 * The wrapper writes `aria-labelledby`, `aria-describedby`, and
 * `aria-errormessage` onto the **first slotted element**, matching
 * the slotted-trigger precedent in `<foundry-popover>` and
 * `<foundry-tooltip>`. Aria attributes are removed on disconnect, but only
 * when their value still matches the ids we wrote — so a consumer can
 * override `aria-labelledby` on the control after mount and the wrapper
 * will not stomp it.
 *
 * Note: setting `required` on `<foundry-field>` only adds the visual marker
 * (CSS `::after` asterisk on the label). It deliberately does **not**
 * forward `aria-required` onto the control — that semantic belongs to the
 * control itself (`<input required>`), which the wrapper cannot infer
 * unambiguously for non-form custom elements.
 *
 * @element foundry-field
 * @summary Form-field wrapper providing label / helper / error slots and
 *   aria wiring for non-foundry controls.
 *
 * @attr {boolean} required - Reflected. Surfaces the label asterisk marker.
 * @attr {boolean} invalid - Reflected. Drives error styling and aria-errormessage.
 *
 * Note: `has-label`, `has-helper`, and `has-error` are internal CSS hooks
 * the component sets automatically based on slot content. Not public API.
 *
 * @slot - The form control. The first assigned element receives
 *   `aria-labelledby` / `aria-describedby` / `aria-errormessage` /
 *   `aria-invalid`.
 * @slot label - Visual label rendered above the control.
 * @slot helper - Supplementary text rendered below the control. Always
 *   referenced by `aria-describedby` when present.
 * @slot error - Error message rendered below the control. Referenced by
 *   `aria-errormessage` and `aria-describedby` only when `invalid` is true.
 *
 * @csspart container - Outer flex column wrapper.
 * @csspart label - The `<label>` element.
 * @csspart control - The wrapper around the slotted control.
 * @csspart helper - The helper-text container.
 * @csspart error - The error-text container (visible only when invalid).
 *
 * @cssprop [--foundry-field-gap] - Vertical spacing between parts.
 * @cssprop [--foundry-field-label-font-size] - Label text size.
 * @cssprop [--foundry-field-label-font-weight] - Label font weight.
 * @cssprop [--foundry-field-label-color] - Label text color.
 * @cssprop [--foundry-field-helper-font-size] - Helper text size.
 * @cssprop [--foundry-field-helper-color] - Helper text color.
 * @cssprop [--foundry-field-error-font-size] - Error text size.
 * @cssprop [--foundry-field-error-color] - Error text color.
 * @cssprop [--foundry-field-required-marker-color] - Color of the `*` marker.
 */
export class FoundryField extends FoundryElement {
  static override properties = {
    required: { type: Boolean, reflect: true, default: false },
    invalid: { type: Boolean, reflect: true, default: false },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);

  static define(tag = 'foundry-field'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryField);
    }
  }

  #label: HTMLElement | undefined;
  #helper: HTMLElement | undefined;
  #error: HTMLElement | undefined;
  #labelSlot: HTMLSlotElement | undefined;
  #helperSlot: HTMLSlotElement | undefined;
  #errorSlot: HTMLSlotElement | undefined;
  #controlSlot: HTMLSlotElement | undefined;
  #control: HTMLElement | undefined;
  #labelId = '';
  #helperId = '';
  #errorId = '';

  override connected(): void {
    this.#label = this.refs['label'] as HTMLElement | undefined;
    this.#helper = this.refs['helper'] as HTMLElement | undefined;
    this.#error = this.refs['error'] as HTMLElement | undefined;
    this.#labelSlot = this.refs['labelSlot'] as HTMLSlotElement | undefined;
    this.#helperSlot = this.refs['helperSlot'] as HTMLSlotElement | undefined;
    this.#errorSlot = this.refs['errorSlot'] as HTMLSlotElement | undefined;
    this.#controlSlot = this.refs['controlSlot'] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; template always provides these refs */
    if (!this.#label || !this.#helper || !this.#error) return;

    const id = ++nextId;
    this.#labelId = `foundry-field-${id}-label`;
    this.#helperId = `foundry-field-${id}-helper`;
    this.#errorId = `foundry-field-${id}-error`;
    this.#label.id = this.#labelId;
    this.#helper.id = this.#helperId;
    this.#error.id = this.#errorId;

    this.#labelSlot?.addEventListener('slotchange', this.#onLabelSlotChange);
    this.#helperSlot?.addEventListener('slotchange', this.#onHelperSlotChange);
    this.#errorSlot?.addEventListener('slotchange', this.#onErrorSlotChange);
    this.#controlSlot?.addEventListener('slotchange', this.#onControlSlotChange);

    this.#syncSlotState('labelSlot', 'has-label');
    this.#syncSlotState('helperSlot', 'has-helper');
    this.#syncSlotState('errorSlot', 'has-error');
    this.#resolveControl();
    this.#syncControlAria();
  }

  override disconnected(): void {
    this.#labelSlot?.removeEventListener('slotchange', this.#onLabelSlotChange);
    this.#helperSlot?.removeEventListener('slotchange', this.#onHelperSlotChange);
    this.#errorSlot?.removeEventListener('slotchange', this.#onErrorSlotChange);
    this.#controlSlot?.removeEventListener('slotchange', this.#onControlSlotChange);
    this.#detachControlAria(this.#control);
    this.#control = undefined;
  }

  override propertyChanged(name: string): void {
    if (name === 'required' || name === 'invalid') {
      this.#syncControlAria();
    }
  }

  #onLabelSlotChange = (): void => {
    this.#syncSlotState('labelSlot', 'has-label');
    this.#syncControlAria();
  };

  #onHelperSlotChange = (): void => {
    this.#syncSlotState('helperSlot', 'has-helper');
    this.#syncControlAria();
  };

  #onErrorSlotChange = (): void => {
    this.#syncSlotState('errorSlot', 'has-error');
    this.#syncControlAria();
  };

  #onControlSlotChange = (): void => {
    const previous = this.#control;
    this.#resolveControl();
    if (previous && previous !== this.#control) {
      this.#detachControlAria(previous);
    }
    this.#syncControlAria();
  };

  #syncSlotState(refName: 'labelSlot' | 'helperSlot' | 'errorSlot', hostAttr: string): void {
    const slot = this.refs[refName] as HTMLSlotElement | undefined;
    /* v8 ignore next -- defensive; connected() guarantees the ref exists */
    if (!slot) return;
    /* v8 ignore start -- the text-node branch in the predicate is unreachable
       for named slots; consumers always assign element children with slot= */
    const hasContent = slot.assignedNodes({ flatten: true }).some((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) return true;
      return (n.textContent ?? '').trim().length > 0;
    });
    /* v8 ignore stop */
    this.toggleAttribute(hostAttr, hasContent);
  }

  #resolveControl(): void {
    /* v8 ignore next -- defensive; connected() guarantees #controlSlot */
    if (!this.#controlSlot) {
      this.#control = undefined;
      return;
    }
    const assigned = this.#controlSlot.assignedElements({ flatten: true });
    this.#control = assigned[0] instanceof HTMLElement ? assigned[0] : undefined;
  }

  #syncControlAria(): void {
    const control = this.#control;
    if (!control) return;
    const hasLabel = this.hasAttribute('has-label');
    const hasHelper = this.hasAttribute('has-helper');
    const hasError = this.hasAttribute('has-error');
    const isInvalid = Boolean(this.readProperty('invalid'));

    // `aria-labelledby` pointing at a shadow-root id works in real browsers
    // but axe-core can't follow the cross-root reference and flags the
    // control as unlabelled. Mirror the label's text content onto
    // `aria-label` as a redundant accessible name so testing tools and
    // simpler ATs see a label without crossing the shadow boundary.
    this.#applyAria(control, 'aria-labelledby', hasLabel ? this.#labelId : null);
    const nextLabelText = hasLabel ? this.#readLabelText() : '';
    this.#applyAria(control, 'aria-label', hasLabel ? nextLabelText : null);
    this.#lastLabelText = nextLabelText;

    const describeIds: string[] = [];
    if (hasHelper) describeIds.push(this.#helperId);
    if (isInvalid && hasError) describeIds.push(this.#errorId);
    this.#applyAria(
      control,
      'aria-describedby',
      describeIds.length > 0 ? describeIds.join(' ') : null,
    );

    this.#applyAria(
      control,
      'aria-errormessage',
      isInvalid && hasError ? this.#errorId : null,
    );

    if (isInvalid) {
      control.setAttribute('aria-invalid', 'true');
    } else if (control.getAttribute('aria-invalid') === 'true') {
      // Only clear if we set it; preserves a consumer-supplied "false".
      control.removeAttribute('aria-invalid');
    }
  }

  // Set or clear an aria attribute, but only stomp values we ourselves wrote.
  // Consumer-overridden attrs (different value) are left alone.
  #applyAria(control: HTMLElement, name: string, value: string | null): void {
    const current = control.getAttribute(name);
    const owns = current === null || this.#isOwnedAriaValue(name, current);
    if (value === null) {
      if (owns && current !== null) control.removeAttribute(name);
      return;
    }
    if (owns) control.setAttribute(name, value);
  }

  #isOwnedAriaValue(name: string, value: string): boolean {
    if (name === 'aria-labelledby') return value === this.#labelId;
    if (name === 'aria-errormessage') return value === this.#errorId;
    if (name === 'aria-describedby') {
      const ids = value.split(/\s+/);
      return ids.every((id) => id === this.#helperId || id === this.#errorId);
    }
    if (name === 'aria-label') return value === this.#lastLabelText;
    /* v8 ignore next -- unreachable; #applyAria is only called with the
       four aria-* names above */
    return false;
  }

  #lastLabelText = '';

  #readLabelText(): string {
    const slot = this.#labelSlot;
    /* v8 ignore next -- defensive; labelSlot is always set after connect */
    if (!slot) return '';
    return slot
      .assignedNodes({ flatten: true })
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();
  }

  #detachControlAria(control: HTMLElement | undefined): void {
    if (!control) return;
    if (control.getAttribute('aria-labelledby') === this.#labelId) {
      control.removeAttribute('aria-labelledby');
    }
    if (control.getAttribute('aria-label') === this.#lastLabelText
      && this.#lastLabelText !== '') {
      control.removeAttribute('aria-label');
    }
    if (control.getAttribute('aria-errormessage') === this.#errorId) {
      control.removeAttribute('aria-errormessage');
    }
    const describedBy = control.getAttribute('aria-describedby');
    if (describedBy !== null) {
      const remaining = describedBy
        .split(/\s+/)
        .filter((id) => id !== this.#helperId && id !== this.#errorId);
      if (remaining.length === 0) control.removeAttribute('aria-describedby');
      else control.setAttribute('aria-describedby', remaining.join(' '));
    }
    if (control.getAttribute('aria-invalid') === 'true'
      && Boolean(this.readProperty('invalid'))) {
      control.removeAttribute('aria-invalid');
    }
  }
}
