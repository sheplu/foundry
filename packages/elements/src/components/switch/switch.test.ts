import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundrySwitch } from './switch.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-switch-test-${++counter}`;
  class Sub extends FoundrySwitch {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getInput(el: HTMLElement): HTMLInputElement {
  const inp = el.shadowRoot?.querySelector('input[type="checkbox"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner switch input not found');
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

describe('FoundrySwitch.define', () => {
  it('registers the given tag with FoundrySwitch', () => {
    const tag = `foundry-switch-define-${++counter}`;
    FoundrySwitch.define(tag);
    expect(customElements.get(tag)).toBe(FoundrySwitch);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-switch-noop-${++counter}`;
    class Existing extends FoundrySwitch {}
    customElements.define(tag, Existing);

    expect(() => FoundrySwitch.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundrySwitch defaults', () => {
  it('declares formAssociated for the custom element registry', () => {
    expect(FoundrySwitch.formAssociated).toBe(true);
  });

  it('defaults checked to false and value to "on"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & { value: string; checked: boolean };
    document.body.appendChild(el);
    expect(getInput(el).checked).toBe(false);
    expect(el.checked).toBe(false);
    expect(el.value).toBe('on');
  });

  it('defaults boolean flags to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch;
    document.body.appendChild(el);
    expect(el.hasAttribute('required')).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('invalid')).toBe(false);
    expect(el.hasAttribute('checked')).toBe(false);
  });
});

describe('FoundrySwitch role', () => {
  it('sets role="switch" on the inner input after connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(getInput(el).getAttribute('role')).toBe('switch');
  });
});

describe('FoundrySwitch attribute forwarding', () => {
  it('forwards required and disabled to the inner input', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('required', '');
    el.setAttribute('disabled', '');
    document.body.appendChild(el);

    const inp = getInput(el);
    expect(inp.required).toBe(true);
    expect(inp.disabled).toBe(true);
  });

  it('re-forwards when the host attribute changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & { disabled: boolean };
    document.body.appendChild(el);
    expect(getInput(el).disabled).toBe(false);

    el.disabled = true;
    expect(getInput(el).disabled).toBe(true);

    el.disabled = false;
    expect(getInput(el).disabled).toBe(false);
  });
});

describe('FoundrySwitch checked coupling', () => {
  it('applies a checked attribute set before connect to the inner input', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('checked', '');
    document.body.appendChild(el);
    expect(getInput(el).checked).toBe(true);
  });

  it('writing the host checked property updates the inner input', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & { checked: boolean };
    document.body.appendChild(el);

    el.checked = true;
    expect(getInput(el).checked).toBe(true);

    el.checked = false;
    expect(getInput(el).checked).toBe(false);
  });

  it('writing checked to its current value is a no-op on the inner input', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & { checked: boolean };
    el.setAttribute('checked', '');
    document.body.appendChild(el);
    expect(getInput(el).checked).toBe(true);

    el.checked = true;
    expect(getInput(el).checked).toBe(true);
  });

  it('user click (inner input change event) updates the host checked', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & { checked: boolean };
    document.body.appendChild(el);

    fireChange(el, true);
    expect(el.checked).toBe(true);
    expect(el.hasAttribute('checked')).toBe(true);

    fireChange(el, false);
    expect(el.checked).toBe(false);
    expect(el.hasAttribute('checked')).toBe(false);
  });

  it('re-dispatches input and change events from the host', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
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

describe('FoundrySwitch validity', () => {
  it('reflects invalid=true when required and unchecked', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    expect(getInput(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('clears invalid when checked', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);

    fireChange(el, true);
    expect(el.hasAttribute('invalid')).toBe(false);
    expect(getInput(el).getAttribute('aria-invalid')).toBe('false');
  });

  it('exposes checkValidity / reportValidity / validity / validationMessage', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch;
    el.setAttribute('required', '');
    document.body.appendChild(el);

    expect(el.checkValidity()).toBe(false);
    expect(el.validity?.valueMissing).toBe(true);
    expect(typeof el.validationMessage).toBe('string');
  });
});

// Real form-association behaviour is validated in the functional spec where
// a real browser provides a working ElementInternals. jsdom only stubs
// attachInternals, so lifecycle callbacks are invoked directly to cover
// their branches; the full end-to-end flow is proven by the Playwright
// canary form tests.

describe('FoundrySwitch form-associated lifecycle', () => {
  it('formResetCallback clears checked state', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & {
      checked: boolean;
      formResetCallback: () => void;
    };
    el.setAttribute('checked', '');
    document.body.appendChild(el);
    expect(el.checked).toBe(true);

    el.formResetCallback();
    expect(el.checked).toBe(false);
    expect(getInput(el).checked).toBe(false);
  });

  it('formDisabledCallback reflects disabled onto the host', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & {
      formDisabledCallback: (d: boolean) => void;
    };
    document.body.appendChild(el);
    expect(el.hasAttribute('disabled')).toBe(false);

    el.formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(getInput(el).disabled).toBe(true);

    el.formDisabledCallback(false);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('formStateRestoreCallback restores checked state from a non-null state', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch & {
      checked: boolean;
      formStateRestoreCallback: (s: string | null) => void;
    };
    document.body.appendChild(el);

    el.formStateRestoreCallback('on');
    expect(el.checked).toBe(true);

    el.formStateRestoreCallback(null);
    expect(el.checked).toBe(false);
  });
});

describe('FoundrySwitch accessors and focus', () => {
  it('exposes .form as null when not in a form', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch;
    document.body.appendChild(el);
    expect(el.form).toBe(null);
  });

  it('delegates focus() to the inner input', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch;
    document.body.appendChild(el);

    let focused = false;
    getInput(el).addEventListener('focus', () => {
      focused = true;
    });
    el.focus();
    expect(focused).toBe(true);
  });

  it('reportValidity falls back to the inner input when internals lacks it', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch;
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.reportValidity()).toBe(false);
  });

  it('checkValidity falls back to the inner input when internals lacks it', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch;
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.checkValidity()).toBe(false);
  });

  it('validationMessage falls back to the inner input when internals lacks it', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundrySwitch;
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(typeof el.validationMessage).toBe('string');
  });
});

describe('FoundrySwitch with patched ElementInternals', () => {
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

  it('calls setFormValue(null) on connect when unchecked (omits from form)', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundrySwitch;
      document.body.appendChild(el);
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('calls setFormValue(value) when checked', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundrySwitch & { checked: boolean };
      el.setAttribute('value', 'on');
      document.body.appendChild(el);

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.checked = true;
      expect(stub.setFormValue).toHaveBeenCalledWith('on');

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.checked = false;
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('re-calls setFormValue when value changes while checked', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundrySwitch & {
        checked: boolean;
        value: string;
      };
      el.setAttribute('checked', '');
      el.setAttribute('value', 'old');
      document.body.appendChild(el);

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.value = 'new';
      expect(stub.setFormValue).toHaveBeenCalledWith('new');
    });
  });

  it('exercises setValidity for both valid and invalid states', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundrySwitch;
      el.setAttribute('required', '');
      document.body.appendChild(el);

      expect(stub.setValidity).toHaveBeenCalled();
      const invalidCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(invalidCallArgs?.[0]).toBeDefined();
      expect(typeof invalidCallArgs?.[1]).toBe('string');

      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      fireChange(el, true);
      const validCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(validCallArgs?.[0]).toEqual({});
    });
  });

  it('delegates checkValidity and reportValidity to internals when available', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundrySwitch;
      document.body.appendChild(el);

      expect(el.checkValidity()).toBe(true);
      expect(stub.checkValidity).toHaveBeenCalled();

      expect(el.reportValidity()).toBe(true);
      expect(stub.reportValidity).toHaveBeenCalled();
    });
  });

  it('exposes .validity and .validationMessage from internals when present', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundrySwitch;
      document.body.appendChild(el);

      expect(el.validity).toBe(stub.validity);
      expect(el.validationMessage).toBe('stubbed message');
    });
  });

  it('exposes .form from internals when attached to a form', () => {
    withPatchedInternals((stub) => {
      const form = document.createElement('form');
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundrySwitch;
      form.appendChild(el);
      document.body.appendChild(form);

      stub.form = form;
      expect(el.form).toBe(form);
    });
  });
});

describe('FoundrySwitch slot handling', () => {
  it('reflects has-label when label slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="label">Enable notifications</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(true);
  });

  it('does not set has-label when label slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(false);
  });
});
