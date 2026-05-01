import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundryRadio } from './radio.ts';

// Radios are self-coordinating via shared `name`, and coordinate via
// document.querySelectorAll when not attached to a form. Many tests mount
// the real FoundryRadio class so they find each other across the document.
// Use the class directly (not a subclass) for group tests. Define it once.
FoundryRadio.define();

let counter = 0;

/**
 * Helper: creates a real FoundryRadio element. Previous components used
 * anonymous subclasses to avoid tag-name collisions across tests, but radio's
 * group coordination queries for the real `foundry-radio` tag, so all tests
 * must share the registered class. Uniqueness comes from the group's `name`.
 */
function uniqueGroup(): string {
  return `grp-${++counter}`;
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

async function flushTabindex(): Promise<void> {
  // connected() schedules tabindex update via queueMicrotask.
  await Promise.resolve();
  await Promise.resolve();
}

function getInput(el: HTMLElement): HTMLInputElement {
  const inp = el.shadowRoot?.querySelector('input[type="radio"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner radio not found');
  return inp;
}

function fireChange(el: HTMLElement, checked: boolean): void {
  const inp = getInput(el);
  inp.checked = checked;
  inp.dispatchEvent(new Event('change', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryRadio.define', () => {
  it('does not re-register an existing tag', () => {
    const tag = `foundry-radio-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);

    expect(() => FoundryRadio.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });

  it('is idempotent when called with the default tag', () => {
    // Module-load already called .define() once; a second call must be a no-op
    // (same constructor + tag combination) rather than throwing.
    expect(() => FoundryRadio.define()).not.toThrow();
    expect(customElements.get('foundry-radio')).toBe(FoundryRadio);
  });
});

describe('FoundryRadio defaults', () => {
  it('declares formAssociated for the custom element registry', () => {
    expect(FoundryRadio.formAssociated).toBe(true);
  });

  it('defaults checked to false and value to "on"', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & {
      value: string;
      checked: boolean;
    };
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);
    expect(getInput(el).checked).toBe(false);
    expect(el.checked).toBe(false);
    expect(el.value).toBe('on');
  });

  it('defaults boolean flags to false', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio;
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);
    expect(el.hasAttribute('required')).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('invalid')).toBe(false);
    expect(el.hasAttribute('checked')).toBe(false);
  });
});

describe('FoundryRadio attribute forwarding', () => {
  it('forwards required and disabled to the inner input', () => {
    const el = document.createElement('foundry-radio');
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('required', '');
    el.setAttribute('disabled', '');
    document.body.appendChild(el);

    const inp = getInput(el);
    expect(inp.required).toBe(true);
    expect(inp.disabled).toBe(true);
  });

  it('re-forwards when the host attribute changes at runtime', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & { disabled: boolean };
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);
    expect(getInput(el).disabled).toBe(false);

    el.disabled = true;
    expect(getInput(el).disabled).toBe(true);

    el.disabled = false;
    expect(getInput(el).disabled).toBe(false);
  });
});

describe('FoundryRadio checked coupling', () => {
  it('applies a checked attribute set before connect to the inner input', () => {
    const el = document.createElement('foundry-radio');
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('checked', '');
    document.body.appendChild(el);
    expect(getInput(el).checked).toBe(true);
  });

  it('writing the host checked property updates the inner input', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & { checked: boolean };
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);

    el.checked = true;
    expect(getInput(el).checked).toBe(true);

    el.checked = false;
    expect(getInput(el).checked).toBe(false);
  });

  it('user click (inner input change event) updates the host checked', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & { checked: boolean };
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);

    fireChange(el, true);
    expect(el.checked).toBe(true);
    expect(el.hasAttribute('checked')).toBe(true);
  });

  it('re-dispatches input and change events from the host', () => {
    const el = document.createElement('foundry-radio');
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);

    let inputFired = 0;
    let changeFired = 0;
    el.addEventListener('input', () => {
      inputFired += 1;
    });
    el.addEventListener('change', () => {
      changeFired += 1;
    });

    fireChange(el, true);
    getInput(el).dispatchEvent(new Event('input', { bubbles: true }));
    expect(changeFired).toBe(1);
    expect(inputFired).toBe(1);
  });
});

describe('FoundryRadio group exclusivity (orphan radios, document-scoped)', () => {
  it('checking one radio unchecks siblings with the same name', () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    document.body.append(a, b, c);

    a.checked = true;
    expect(a.checked).toBe(true);
    expect(b.checked).toBe(false);
    expect(c.checked).toBe(false);

    b.checked = true;
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
    expect(c.checked).toBe(false);
  });

  it('radios with different names are independent', () => {
    const g1 = uniqueGroup();
    const g2 = uniqueGroup();
    const a = makeRadio(g1, 'a');
    const b = makeRadio(g2, 'b');
    document.body.append(a, b);

    a.checked = true;
    b.checked = true;
    expect(a.checked).toBe(true);
    expect(b.checked).toBe(true);
  });

  it('user click coordinates group exclusivity via the change event path', () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    document.body.append(a, b);

    fireChange(a, true);
    fireChange(b, true);
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
  });
});

describe('FoundryRadio group exclusivity (form-scoped)', () => {
  it('uses form.elements.namedItem to find siblings inside a form', () => {
    const form = document.createElement('form');
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    form.append(a, b);
    document.body.append(form);

    a.checked = true;
    b.checked = true;
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(true);
  });

  // jsdom's form.elements typically does NOT include custom elements, so the
  // `form.elements.namedItem` path in #groupSiblings isn't exercised by the
  // test above (it falls back to the document query). Explicitly exercise
  // the RadioNodeList + single-element branches by patching form.elements.

  // jsdom's ElementInternals.form is null even when the radio is in a form.
  // Patch attachInternals to return a stub that reports the form, so the
  // `if (form)` branch in #groupSiblings executes. Cover both return shapes
  // of form.elements.namedItem: RadioNodeList (multiple) and single element.

  it('exercises the RadioNodeList branch via patched internals + form.elements', () => {
    const form = document.createElement('form');
    form.setAttribute('data-test', 'rnl');
    document.body.append(form);

    const name = uniqueGroup();

    // Build a RadioNodeList-like list. Instances can't be constructed directly;
    // an object whose prototype is RadioNodeList.prototype satisfies instanceof.
    const list = Object.create(RadioNodeList.prototype) as RadioNodeList;
    const ctors: FoundryRadio[] = [];
    (list as unknown as { [Symbol.iterator]: () => Iterator<Element> })[Symbol.iterator]
      = function* () {
        for (const r of ctors) yield r;
      };

    Object.defineProperty(form, 'elements', {
      configurable: true,
      get: () => ({ namedItem: () => list }),
    });

    // Patch attachInternals so .form returns our form.
    const spy = vi
      .spyOn(HTMLElement.prototype, 'attachInternals')
      .mockReturnValue({
        form,
        validity: { valid: true },
        validationMessage: '',
        setFormValue: () => undefined,
        setValidity: () => undefined,
        checkValidity: () => true,
        reportValidity: () => true,
      } as unknown as ElementInternals);

    try {
      const a = makeRadio(name, 'a');
      const b = makeRadio(name, 'b');
      ctors.push(a, b);
      form.append(a, b);

      a.checked = true;
      b.checked = true;
      // Form-scoped coordination found siblings via RadioNodeList and unchecked a.
      expect(a.checked).toBe(false);
      expect(b.checked).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('exercises the single-element branch of form.elements.namedItem', () => {
    const form = document.createElement('form');
    document.body.append(form);
    const name = uniqueGroup();

    let solo: FoundryRadio;
    Object.defineProperty(form, 'elements', {
      configurable: true,
      get: () => ({ namedItem: () => solo }),
    });

    const spy = vi
      .spyOn(HTMLElement.prototype, 'attachInternals')
      .mockReturnValue({
        form,
        validity: { valid: true },
        validationMessage: '',
        setFormValue: () => undefined,
        setValidity: () => undefined,
        checkValidity: () => true,
        reportValidity: () => true,
      } as unknown as ElementInternals);

    try {
      solo = makeRadio(name, 'solo');
      form.append(solo);

      solo.checked = true;
      expect(solo.checked).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('FoundryRadio propertyChanged edge cases', () => {
  it('value change (while unchecked) re-reports form value as null', () => {
    const name = uniqueGroup();
    const el = makeRadio(name, 'a');
    document.body.append(el);
    // Not checked → re-report with null path; no assertion beyond "doesn't throw".
    el.setAttribute('value', 'b');
    expect(el.getAttribute('value')).toBe('b');
  });

  it('name change triggers a tabindex update for the new group', async () => {
    const g1 = uniqueGroup();
    const g2 = uniqueGroup();
    const el = makeRadio(g1, 'a');
    document.body.append(el);
    await flushTabindex();

    el.setAttribute('name', g2);
    // The property setter fires propertyChanged('name'), which calls
    // #updateGroupTabindex. The radio is now alone in g2, so it should be tabbable.
    expect(getInput(el).tabIndex).toBe(0);
  });

  it('handles a radio without a name attribute as a singleton group', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & { checked: boolean };
    document.body.appendChild(el);
    // No name → #groupSiblings returns [this] → checking doesn't throw.
    el.checked = true;
    expect(el.checked).toBe(true);
  });

  it('single-radio group: arrow keys are no-ops', () => {
    const name = uniqueGroup();
    const el = makeRadio(name, 'a');
    document.body.append(el);

    el.focus();
    getInput(el).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    // Single-element group → `next === this`, early return, no state change.
    expect(el.checked).toBe(false);
  });
});

describe('FoundryRadio roving tabindex', () => {
  it('makes the first radio tabbable when none is checked', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    document.body.append(a, b, c);
    await flushTabindex();

    expect(getInput(a).tabIndex).toBe(0);
    expect(getInput(b).tabIndex).toBe(-1);
    expect(getInput(c).tabIndex).toBe(-1);
  });

  it('makes the checked radio tabbable and others non-tabbable', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    b.setAttribute('checked', '');
    document.body.append(a, b, c);
    await flushTabindex();

    expect(getInput(a).tabIndex).toBe(-1);
    expect(getInput(b).tabIndex).toBe(0);
    expect(getInput(c).tabIndex).toBe(-1);
  });

  it('moves tabbable state to the newly checked radio', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    document.body.append(a, b);
    await flushTabindex();

    b.checked = true;
    expect(getInput(a).tabIndex).toBe(-1);
    expect(getInput(b).tabIndex).toBe(0);
  });
});

describe('FoundryRadio keyboard navigation', () => {
  it('ArrowDown moves focus + selection to the next radio', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    document.body.append(a, b, c);
    await flushTabindex();

    a.focus();
    getInput(a).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(b.checked).toBe(true);
    expect(a.checked).toBe(false);
  });

  it('ArrowUp wraps from first to last', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    document.body.append(a, b, c);
    await flushTabindex();

    a.focus();
    getInput(a).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
    );
    expect(c.checked).toBe(true);
    expect(a.checked).toBe(false);
  });

  it('ArrowDown wraps from last to first', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    document.body.append(a, b, c);
    c.setAttribute('checked', '');
    await flushTabindex();

    c.focus();
    getInput(c).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    expect(a.checked).toBe(true);
    expect(c.checked).toBe(false);
  });

  it('Home jumps to the first radio in the group', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    c.setAttribute('checked', '');
    document.body.append(a, b, c);
    await flushTabindex();

    c.focus();
    getInput(c).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true }),
    );
    expect(a.checked).toBe(true);
    expect(c.checked).toBe(false);
  });

  it('End jumps to the last radio', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    document.body.append(a, b, c);
    await flushTabindex();

    a.focus();
    getInput(a).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true }),
    );
    expect(c.checked).toBe(true);
    expect(a.checked).toBe(false);
  });

  it('disabled radios are skipped during arrow navigation', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    const c = makeRadio(name, 'c');
    b.setAttribute('disabled', '');
    document.body.append(a, b, c);
    await flushTabindex();

    a.focus();
    getInput(a).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    // b is disabled → next is c.
    expect(c.checked).toBe(true);
    expect(b.checked).toBe(false);
  });

  it('ignores non-navigation keys', async () => {
    const name = uniqueGroup();
    const a = makeRadio(name, 'a');
    const b = makeRadio(name, 'b');
    document.body.append(a, b);
    await flushTabindex();

    getInput(a).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    expect(a.checked).toBe(false);
    expect(b.checked).toBe(false);
  });
});

describe('FoundryRadio validity', () => {
  it('reflects invalid=true when required and unchecked', () => {
    const el = document.createElement('foundry-radio');
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    expect(getInput(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('clears invalid when checked', () => {
    const el = document.createElement('foundry-radio');
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);

    fireChange(el, true);
    expect(el.hasAttribute('invalid')).toBe(false);
    expect(getInput(el).getAttribute('aria-invalid')).toBe('false');
  });

  it('exposes checkValidity / reportValidity / validity / validationMessage', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio;
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('required', '');
    document.body.appendChild(el);

    expect(el.checkValidity()).toBe(false);
    expect(el.validity?.valueMissing).toBe(true);
    expect(typeof el.validationMessage).toBe('string');
  });
});

describe('FoundryRadio form-associated lifecycle', () => {
  it('formResetCallback clears checked state', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & {
      checked: boolean;
      formResetCallback: () => void;
    };
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('checked', '');
    document.body.appendChild(el);
    expect(el.checked).toBe(true);

    el.formResetCallback();
    expect(el.checked).toBe(false);
    expect(getInput(el).checked).toBe(false);
  });

  it('formDisabledCallback reflects disabled onto the host', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & {
      formDisabledCallback: (d: boolean) => void;
    };
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);
    expect(el.hasAttribute('disabled')).toBe(false);

    el.formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(getInput(el).disabled).toBe(true);
  });

  it('formStateRestoreCallback restores checked state from a non-null state', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio & {
      checked: boolean;
      formStateRestoreCallback: (s: string | null) => void;
    };
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);

    el.formStateRestoreCallback('on');
    expect(el.checked).toBe(true);

    el.formStateRestoreCallback(null);
    expect(el.checked).toBe(false);
  });
});

describe('FoundryRadio accessors and focus', () => {
  it('exposes .form as null when not in a form', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio;
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);
    expect(el.form).toBe(null);
  });

  it('delegates focus() to the inner input', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio;
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);

    let focused = false;
    getInput(el).addEventListener('focus', () => {
      focused = true;
    });
    el.focus();
    expect(focused).toBe(true);
  });

  it('reportValidity falls back to the inner input when internals lacks it', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio;
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.reportValidity()).toBe(false);
  });

  it('checkValidity falls back to the inner input when internals lacks it', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio;
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.checkValidity()).toBe(false);
  });

  it('validationMessage falls back to the inner input when internals lacks it', () => {
    const el = document.createElement('foundry-radio') as FoundryRadio;
    el.setAttribute('name', uniqueGroup());
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(typeof el.validationMessage).toBe('string');
  });
});

describe('FoundryRadio with patched ElementInternals', () => {
  interface StubInternals {
    form: HTMLFormElement | null;
    validity: ValidityState | { valid: boolean };
    validationMessage: string;
    setFormValue: (v: string | null | FormData | File) => void;
    setValidity: (flags: object, message?: string, anchor?: HTMLElement) => void;
    checkValidity: () => boolean;
    reportValidity: () => boolean;
  }

  function withPatchedInternals<T>(run: (stub: StubInternals) => T): T {
    const stub: StubInternals = {
      form: null,
      validity: { valid: true },
      validationMessage: 'stubbed message',
      setFormValue: vi.fn(),
      setValidity: vi.fn(),
      checkValidity: vi.fn().mockReturnValue(true),
      reportValidity: vi.fn().mockReturnValue(true),
    };
    const spy = vi
      .spyOn(HTMLElement.prototype, 'attachInternals')
      .mockReturnValue(stub as unknown as ElementInternals);
    try {
      return run(stub);
    } finally {
      spy.mockRestore();
    }
  }

  it('calls setFormValue(null) on connect when unchecked', () => {
    withPatchedInternals((stub) => {
      const el = document.createElement('foundry-radio') as FoundryRadio;
      el.setAttribute('name', uniqueGroup());
      document.body.appendChild(el);
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('calls setFormValue(value) when checked', () => {
    withPatchedInternals((stub) => {
      const el = document.createElement('foundry-radio') as FoundryRadio & { checked: boolean };
      el.setAttribute('name', uniqueGroup());
      el.setAttribute('value', 'pro');
      document.body.appendChild(el);

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.checked = true;
      expect(stub.setFormValue).toHaveBeenCalledWith('pro');

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.checked = false;
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('exercises setValidity for both valid and invalid states', () => {
    withPatchedInternals((stub) => {
      const el = document.createElement('foundry-radio') as FoundryRadio;
      el.setAttribute('name', uniqueGroup());
      el.setAttribute('required', '');
      document.body.appendChild(el);

      expect(stub.setValidity).toHaveBeenCalled();
      const invalidCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(invalidCallArgs?.[0]).toBeDefined();

      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      fireChange(el, true);
      const validCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(validCallArgs?.[0]).toEqual({});
    });
  });

  it('delegates checkValidity and reportValidity to internals when available', () => {
    withPatchedInternals((stub) => {
      const el = document.createElement('foundry-radio') as FoundryRadio;
      el.setAttribute('name', uniqueGroup());
      document.body.appendChild(el);

      expect(el.checkValidity()).toBe(true);
      expect(stub.checkValidity).toHaveBeenCalled();

      expect(el.reportValidity()).toBe(true);
      expect(stub.reportValidity).toHaveBeenCalled();
    });
  });
});

describe('FoundryRadio slot handling', () => {
  it('reflects has-label when label slot has content', async () => {
    const el = document.createElement('foundry-radio');
    el.setAttribute('name', uniqueGroup());
    el.innerHTML = '<span slot="label">Choice</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(true);
  });

  it('does not set has-label when label slot is empty', async () => {
    const el = document.createElement('foundry-radio');
    el.setAttribute('name', uniqueGroup());
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(false);
  });
});

// Helper: create a radio without connecting it yet.
function makeRadio(name: string, value: string): FoundryRadio & {
  checked: boolean;
  disabled: boolean;
} {
  const el = document.createElement('foundry-radio') as FoundryRadio & {
    checked: boolean;
    disabled: boolean;
  };
  el.setAttribute('name', name);
  el.setAttribute('value', value);
  return el;
}
