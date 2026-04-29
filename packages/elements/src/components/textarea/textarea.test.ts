import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundryTextarea } from './textarea.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-textarea-test-${++counter}`;
  class Sub extends FoundryTextarea {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getTextarea(el: HTMLElement): HTMLTextAreaElement {
  const ta = el.shadowRoot?.querySelector('textarea');
  if (!ta) throw new Error('inner textarea not found');
  return ta;
}

function fireInput(el: HTMLElement, value: string): void {
  const ta = getTextarea(el);
  ta.value = value;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTextarea.define', () => {
  it('registers the given tag with FoundryTextarea', () => {
    const tag = `foundry-textarea-define-${++counter}`;
    FoundryTextarea.define(tag);
    expect(customElements.get(tag)).toBe(FoundryTextarea);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-textarea-noop-${++counter}`;
    class Existing extends FoundryTextarea {}
    customElements.define(tag, Existing);

    expect(() => FoundryTextarea.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTextarea defaults', () => {
  it('declares formAssociated for the custom element registry', () => {
    expect(FoundryTextarea.formAssociated).toBe(true);
  });

  it('defaults value to "" and rows to 3', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    document.body.appendChild(el);
    expect(getTextarea(el).value).toBe('');
    expect(getTextarea(el).rows).toBe(3);
  });

  it('defaults boolean flags to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    document.body.appendChild(el);
    expect(el.hasAttribute('required')).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('readonly')).toBe(false);
    expect(el.hasAttribute('invalid')).toBe(false);
  });
});

describe('FoundryTextarea attribute forwarding', () => {
  it('forwards placeholder, required, disabled, readonly, minlength, maxlength, rows, autocomplete, inputmode', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('placeholder', 'Tell us about yourself');
    el.setAttribute('required', '');
    el.setAttribute('disabled', '');
    el.setAttribute('readonly', '');
    el.setAttribute('minlength', '10');
    el.setAttribute('maxlength', '500');
    el.setAttribute('rows', '6');
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('inputmode', 'text');
    document.body.appendChild(el);

    const ta = getTextarea(el);
    expect(ta.placeholder).toBe('Tell us about yourself');
    expect(ta.required).toBe(true);
    expect(ta.disabled).toBe(true);
    expect(ta.readOnly).toBe(true);
    expect(ta.minLength).toBe(10);
    expect(ta.maxLength).toBe(500);
    expect(ta.rows).toBe(6);
    expect(ta.autocomplete).toBe('off');
    expect(ta.inputMode).toBe('text');
  });

  it('re-forwards when the host attribute changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & { disabled: boolean };
    document.body.appendChild(el);
    expect(getTextarea(el).disabled).toBe(false);

    el.disabled = true;
    expect(getTextarea(el).disabled).toBe(true);

    el.disabled = false;
    expect(getTextarea(el).disabled).toBe(false);
  });

  it('updates inner rows when the rows attribute changes', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & { rows: number };
    document.body.appendChild(el);
    expect(getTextarea(el).rows).toBe(3);

    el.rows = 8;
    expect(getTextarea(el).rows).toBe(8);
  });
});

describe('FoundryTextarea value coupling', () => {
  it('writing the host value property updates the inner textarea', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & { value: string };
    document.body.appendChild(el);

    el.value = 'hello\nworld';
    expect(getTextarea(el).value).toBe('hello\nworld');
  });

  it('applies a value attribute set before connect to the inner textarea', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('value', 'prefilled');
    document.body.appendChild(el);
    expect(getTextarea(el).value).toBe('prefilled');
  });

  it('typing into the textarea updates the host value (and reflects to attribute)', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & { value: string };
    document.body.appendChild(el);

    fireInput(el, 'world');
    expect(el.value).toBe('world');
    expect(el.getAttribute('value')).toBe('world');
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

    fireInput(el, 'x');
    getTextarea(el).dispatchEvent(new Event('change', { bubbles: true }));
    expect(inputFired).toBe(1);
    expect(changeFired).toBe(1);
  });
});

describe('FoundryTextarea validity', () => {
  it('reflects invalid=true when required and empty', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    expect(getTextarea(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('clears invalid when a value is supplied', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & { value: string };
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);

    fireInput(el, 'ada');
    expect(el.hasAttribute('invalid')).toBe(false);
    expect(getTextarea(el).getAttribute('aria-invalid')).toBe('false');
  });

  // `minlength`/`maxlength` tooShort/tooLong validity requires "dirty" user
  // input that jsdom does not simulate reliably; validated in the functional
  // spec via Playwright. Keeping unit tests focused on `required`.

  it('exposes checkValidity / reportValidity / validity / validationMessage', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    el.setAttribute('required', '');
    document.body.appendChild(el);

    expect(el.checkValidity()).toBe(false);
    expect(el.validity?.valueMissing).toBe(true);
    expect(typeof el.validationMessage).toBe('string');
  });
});

// Real form-association behaviour is validated in the functional spec where
// a real browser provides a working ElementInternals. jsdom only stubs
// attachInternals, so the lifecycle callbacks below are invoked directly
// to cover their branches; the full end-to-end flow is proven by the
// Playwright canary form tests.

describe('FoundryTextarea form-associated lifecycle', () => {
  it('formResetCallback clears value and textarea', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & {
      value: string;
      formResetCallback: () => void;
    };
    document.body.appendChild(el);

    fireInput(el, 'seeded');
    expect(el.value).toBe('seeded');

    el.formResetCallback();
    expect(el.value).toBe('');
    expect(getTextarea(el).value).toBe('');
  });

  it('formDisabledCallback reflects disabled onto the host', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & {
      formDisabledCallback: (d: boolean) => void;
    };
    document.body.appendChild(el);
    expect(el.hasAttribute('disabled')).toBe(false);

    el.formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(getTextarea(el).disabled).toBe(true);

    el.formDisabledCallback(false);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('formStateRestoreCallback restores value from state', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea & {
      value: string;
      formStateRestoreCallback: (s: string | null) => void;
    };
    document.body.appendChild(el);

    el.formStateRestoreCallback('restored');
    expect(el.value).toBe('restored');
    expect(getTextarea(el).value).toBe('restored');

    el.formStateRestoreCallback(null);
    expect(el.value).toBe('');
  });
});

describe('FoundryTextarea accessors and focus', () => {
  it('exposes .form as null when not in a form', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    document.body.appendChild(el);
    expect(el.form).toBe(null);
  });

  it('delegates focus() to the inner textarea', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    document.body.appendChild(el);

    let focused = false;
    getTextarea(el).addEventListener('focus', () => {
      focused = true;
    });
    el.focus();
    expect(focused).toBe(true);
  });

  it('reportValidity falls back to the inner textarea when internals lacks it', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    el.setAttribute('required', '');
    document.body.appendChild(el);
    // jsdom's ElementInternals stub omits reportValidity, so the fallback path runs.
    expect(el.reportValidity()).toBe(false);
  });

  it('checkValidity falls back to the inner textarea when internals lacks it', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.checkValidity()).toBe(false);
  });

  it('validationMessage falls back to the inner textarea when internals lacks it', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTextarea;
    el.setAttribute('required', '');
    document.body.appendChild(el);
    // jsdom's ElementInternals stub omits validationMessage, so the fallback runs.
    // jsdom's HTMLTextAreaElement provides a non-empty validationMessage for required-empty.
    expect(typeof el.validationMessage).toBe('string');
  });
});

describe('FoundryTextarea with patched ElementInternals', () => {
  // jsdom's attachInternals returns an object without the method surface the
  // component feature-detects (setFormValue, setValidity, checkValidity,
  // reportValidity). These tests patch attachInternals to return a richer
  // stub so the "method present" branches execute. End-to-end behaviour is
  // still validated by the Playwright canary spec against real browsers.

  interface StubInternals {
    form: HTMLFormElement | null;
    validity: ValidityState | { valid: boolean };
    validationMessage: string;
    setFormValue: (v: string) => void;
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

  it('exercises setFormValue on input and on programmatic value change', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundryTextarea & { value: string };
      document.body.appendChild(el);

      expect(stub.setFormValue).toHaveBeenCalled();

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.value = 'programmatic';
      expect(stub.setFormValue).toHaveBeenCalledWith('programmatic');

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      fireInput(el, 'typed');
      expect(stub.setFormValue).toHaveBeenCalledWith('typed');
    });
  });

  it('exercises setValidity for both valid and invalid states', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundryTextarea;
      el.setAttribute('required', '');
      document.body.appendChild(el);

      expect(stub.setValidity).toHaveBeenCalled();
      const invalidCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(invalidCallArgs?.[0]).toBeDefined();
      expect(typeof invalidCallArgs?.[1]).toBe('string');

      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      fireInput(el, 'filled');
      const validCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(validCallArgs?.[0]).toEqual({});
    });
  });

  it('delegates checkValidity and reportValidity to internals when available', () => {
    withPatchedInternals((stub) => {
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundryTextarea;
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
      const el = document.createElement(tag) as FoundryTextarea;
      document.body.appendChild(el);

      expect(el.validity).toBe(stub.validity);
      expect(el.validationMessage).toBe('stubbed message');
    });
  });

  it('exposes .form from internals when attached to a form', () => {
    withPatchedInternals((stub) => {
      const form = document.createElement('form');
      const { tag } = uniqueSubclass();
      const el = document.createElement(tag) as FoundryTextarea;
      form.appendChild(el);
      document.body.appendChild(form);

      stub.form = form;
      expect(el.form).toBe(form);
    });
  });
});

describe('FoundryTextarea slot handling', () => {
  it('reflects has-label when label slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="label">Bio</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(true);
  });

  it('reflects has-hint and sets aria-describedby="hint"', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="label">L</span><span slot="hint">Helper</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-hint')).toBe(true);
    expect(getTextarea(el).getAttribute('aria-describedby')).toBe('hint');
  });

  it('reflects has-error but does not describe-by until invalid', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="label">L</span><span slot="error">Err</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-error')).toBe(true);
    expect(getTextarea(el).hasAttribute('aria-errormessage')).toBe(false);
  });

  it('surfaces aria-errormessage when invalid AND has-error', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('required', '');
    el.innerHTML = '<span slot="label">L</span><span slot="error">Err</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('invalid')).toBe(true);
    expect(getTextarea(el).getAttribute('aria-errormessage')).toBe('err');
    expect(getTextarea(el).getAttribute('aria-describedby')).toContain('err');
  });
});
