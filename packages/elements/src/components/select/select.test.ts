import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FoundrySelect } from './select.ts';
import { FoundryOption } from '../option/option.ts';

// Both components must be defined with their canonical tags: the select
// discovers options via `instanceof FoundryOption`, so the child class has
// to be the exact one registered. Since option is used by several tests,
// define it once at module load.
beforeAll(() => {
  FoundrySelect.define();
});

let counter = 0;

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getControl(el: HTMLElement): HTMLButtonElement {
  const btn = el.shadowRoot?.querySelector('button[part="control"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('inner control button not found');
  return btn;
}

function valueText(el: HTMLElement): string {
  return el.shadowRoot?.querySelector('[part="value"]')?.textContent ?? '';
}

function placeholderText(el: HTMLElement): string {
  return el.shadowRoot?.querySelector('[part="placeholder"]')?.textContent ?? '';
}

function makeSelect(
  children: { value?: string; text: string; disabled?: boolean }[] = [],
): FoundrySelect {
  const el = document.createElement('foundry-select') as FoundrySelect;
  for (const child of children) {
    const opt = document.createElement('foundry-option');
    if (child.value !== undefined) opt.setAttribute('value', child.value);
    if (child.disabled) opt.setAttribute('disabled', '');
    opt.textContent = child.text;
    el.appendChild(opt);
  }
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundrySelect.define', () => {
  it('is idempotent when called with the default tag', () => {
    expect(() => FoundrySelect.define()).not.toThrow();
    expect(customElements.get('foundry-select')).toBe(FoundrySelect);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-select-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);

    expect(() => FoundrySelect.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });

  it('also defines foundry-option as a side-effect', () => {
    FoundrySelect.define();
    expect(customElements.get('foundry-option')).toBe(FoundryOption);
  });
});

describe('FoundrySelect defaults', () => {
  it('declares formAssociated for the custom element registry', () => {
    expect(FoundrySelect.formAssociated).toBe(true);
  });

  it('defaults value to empty and invalid to false', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    expect((el as unknown as { value: string }).value).toBe('');
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('defaults no option selected and no has-value attribute', () => {
    const el = makeSelect([{ text: 'UTC' }, { text: 'EST' }]);
    document.body.appendChild(el);
    expect(el.selectedOption).toBeUndefined();
    expect(el.hasAttribute('has-value')).toBe(false);
  });

  it('exposes formAssociated=true on the class', () => {
    expect(FoundrySelect.formAssociated).toBe(true);
  });
});

describe('FoundrySelect value resolution', () => {
  it('selects the matching option when value is set before connect', async () => {
    const el = makeSelect([
      { value: 'utc', text: 'UTC' },
      { value: 'est', text: 'EST' },
    ]);
    el.setAttribute('value', 'est');
    document.body.appendChild(el);
    await raf();
    expect(el.selectedOption?.resolvedValue).toBe('est');
    expect(el.hasAttribute('has-value')).toBe(true);
    expect(valueText(el)).toBe('EST');
  });

  it('switching value after connect clears the previous selection', async () => {
    const el = makeSelect([
      { value: 'utc', text: 'UTC' },
      { value: 'est', text: 'EST' },
    ]);
    el.setAttribute('value', 'utc');
    document.body.appendChild(el);
    await raf();

    (el as unknown as { value: string }).value = 'est';
    expect(el.selectedOption?.resolvedValue).toBe('est');
    expect(valueText(el)).toBe('EST');
    const utcOption = el.options.find((o) => o.resolvedValue === 'utc');
    expect((utcOption as unknown as { selected: boolean }).selected).toBe(false);
  });

  it('a value with no matching option clears selection and shows placeholder', async () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    el.setAttribute('placeholder', 'Select a timezone');
    el.setAttribute('value', 'nonexistent');
    document.body.appendChild(el);
    await raf();
    expect(el.selectedOption).toBeUndefined();
    expect(el.hasAttribute('has-value')).toBe(false);
    expect(placeholderText(el)).toBe('Select a timezone');
  });

  it('clearing the value attribute returns to empty state', async () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    el.setAttribute('value', 'utc');
    document.body.appendChild(el);
    await raf();
    expect(el.selectedOption?.resolvedValue).toBe('utc');

    (el as unknown as { value: string }).value = '';
    expect(el.selectedOption).toBeUndefined();
    expect(el.hasAttribute('has-value')).toBe(false);
  });

  it('uses resolvedValue (textContent fallback) when option has no value attribute', async () => {
    const el = makeSelect([{ text: 'Pacific' }]);
    el.setAttribute('value', 'Pacific');
    document.body.appendChild(el);
    await raf();
    expect(el.selectedOption).toBeDefined();
    expect(el.selectedOption?.textContent).toBe('Pacific');
  });
});

describe('FoundrySelect placeholder', () => {
  it('renders the placeholder text when no option is selected', async () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    el.setAttribute('placeholder', 'Pick one');
    document.body.appendChild(el);
    await raf();
    expect(placeholderText(el)).toBe('Pick one');
    expect(el.hasAttribute('has-value')).toBe(false);
  });

  it('updates the placeholder text at runtime', async () => {
    const el = makeSelect();
    el.setAttribute('placeholder', 'A');
    document.body.appendChild(el);
    await raf();
    expect(placeholderText(el)).toBe('A');

    (el as unknown as { placeholder: string }).placeholder = 'B';
    expect(placeholderText(el)).toBe('B');
  });
});

describe('FoundrySelect options discovery', () => {
  it('adding an option after mount is detected on next value change', async () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.options.length).toBe(1);

    const newOpt = document.createElement('foundry-option');
    newOpt.setAttribute('value', 'est');
    newOpt.textContent = 'EST';
    el.appendChild(newOpt);
    await raf();
    expect(el.options.length).toBe(2);

    (el as unknown as { value: string }).value = 'est';
    expect(el.selectedOption?.resolvedValue).toBe('est');
  });

  it('removing the currently-selected option clears the selection', async () => {
    const el = makeSelect([
      { value: 'utc', text: 'UTC' },
      { value: 'est', text: 'EST' },
    ]);
    el.setAttribute('value', 'est');
    document.body.appendChild(el);
    await raf();

    const estOption = el.options.find((o) => o.resolvedValue === 'est');
    estOption?.remove();
    await raf();

    expect(el.selectedOption).toBeUndefined();
    expect(el.hasAttribute('has-value')).toBe(false);
  });

  it('disabled options are marked aria-disabled', async () => {
    const el = makeSelect([
      { value: 'utc', text: 'UTC' },
      { value: 'est', text: 'EST', disabled: true },
    ]);
    document.body.appendChild(el);
    await raf();
    const est = el.options.find((o) => o.resolvedValue === 'est');
    expect(est?.getAttribute('aria-disabled')).toBe('true');
  });

  it('non-option children are ignored during discovery', async () => {
    const el = document.createElement('foundry-select') as FoundrySelect;
    el.innerHTML = `
      <foundry-option value="utc">UTC</foundry-option>
      <span>garbage</span>
      <foundry-option value="est">EST</foundry-option>
    `;
    document.body.appendChild(el);
    await raf();
    expect(el.options.length).toBe(2);
  });
});

describe('FoundrySelect required + validity', () => {
  it('required + empty marks the host invalid', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    expect(getControl(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('required + value-set clears invalid', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    el.setAttribute('required', '');
    el.setAttribute('value', 'utc');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
    expect(getControl(el).getAttribute('aria-invalid')).toBe('false');
  });

  it('non-required + empty is not invalid', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('clearing value while required re-invalidates', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    el.setAttribute('required', '');
    el.setAttribute('value', 'utc');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);

    (el as unknown as { value: string }).value = '';
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('toggling required recomputes validity', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);

    (el as unknown as { required: boolean }).required = true;
    expect(el.hasAttribute('invalid')).toBe(true);
  });
});

describe('FoundrySelect form-associated lifecycle', () => {
  it('formResetCallback restores the initial value attribute', () => {
    const el = makeSelect([
      { value: 'utc', text: 'UTC' },
      { value: 'est', text: 'EST' },
    ]) as FoundrySelect & {
      value: string;
      formResetCallback: () => void;
    };
    el.setAttribute('value', 'utc');
    document.body.appendChild(el);

    el.value = 'est';
    expect(el.selectedOption?.resolvedValue).toBe('est');
    el.formResetCallback();
    expect(el.selectedOption?.resolvedValue).toBe('utc');
  });

  it('formResetCallback resets to empty when no initial value was set', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]) as FoundrySelect & {
      value: string;
      formResetCallback: () => void;
    };
    document.body.appendChild(el);
    el.value = 'utc';
    el.formResetCallback();
    expect(el.selectedOption).toBeUndefined();
  });

  it('formDisabledCallback reflects disabled onto the host', () => {
    const el = makeSelect() as FoundrySelect & {
      formDisabledCallback: (d: boolean) => void;
    };
    document.body.appendChild(el);
    expect(el.hasAttribute('disabled')).toBe(false);

    el.formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(getControl(el).hasAttribute('disabled')).toBe(true);
  });

  it('formStateRestoreCallback restores value from a non-null state', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]) as FoundrySelect & {
      formStateRestoreCallback: (s: string | null) => void;
    };
    document.body.appendChild(el);

    el.formStateRestoreCallback('utc');
    expect(el.selectedOption?.resolvedValue).toBe('utc');

    el.formStateRestoreCallback(null);
    expect(el.selectedOption).toBeUndefined();
  });
});

describe('FoundrySelect accessors + focus', () => {
  it('exposes .form as null when not in a form', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    expect((el as FoundrySelect).form).toBe(null);
  });

  it('checkValidity / reportValidity fall back to true when internals unavailable', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    expect(el.checkValidity()).toBe(true);
    expect(el.reportValidity()).toBe(true);
  });

  it('validationMessage falls back to empty string when internals unavailable', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    expect(el.validationMessage).toBe('');
  });

  it('delegates focus() to the inner control', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    let focused = false;
    getControl(el).addEventListener('focus', () => {
      focused = true;
    });
    el.focus();
    expect(focused).toBe(true);
  });
});

describe('FoundrySelect disabled handling', () => {
  it('forwards disabled to the inner control', () => {
    const el = makeSelect() as FoundrySelect & { disabled: boolean };
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    expect(getControl(el).hasAttribute('disabled')).toBe(true);
  });

  it('re-forwards disabled at runtime', () => {
    const el = makeSelect() as FoundrySelect & { disabled: boolean };
    document.body.appendChild(el);
    expect(getControl(el).hasAttribute('disabled')).toBe(false);
    el.disabled = true;
    expect(getControl(el).hasAttribute('disabled')).toBe(true);
    el.disabled = false;
    expect(getControl(el).hasAttribute('disabled')).toBe(false);
  });
});

describe('FoundrySelect slot reflection', () => {
  it('reflects has-label when label slot has content', async () => {
    const el = makeSelect();
    el.innerHTML = '<span slot="label">Timezone</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(true);
  });

  it('does not set has-label when label slot is empty', async () => {
    const el = makeSelect();
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(false);
  });

  it('reflects has-hint when hint slot has content', async () => {
    const el = makeSelect();
    el.innerHTML = '<span slot="hint">Choose your timezone</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-hint')).toBe(true);
  });

  it('reflects has-error when error slot has content', async () => {
    const el = makeSelect();
    el.innerHTML = '<span slot="error">Required</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-error')).toBe(true);
  });

  it('wires aria-errormessage when invalid + has-error', async () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    el.setAttribute('required', '');
    el.innerHTML = '<span slot="error">Required</span>';
    document.body.appendChild(el);
    await raf();
    expect(getControl(el).getAttribute('aria-errormessage')).toBe('err');
  });

  it('wires aria-describedby when hint is present', async () => {
    const el = makeSelect();
    el.innerHTML = '<span slot="hint">Choose</span>';
    document.body.appendChild(el);
    await raf();
    expect(getControl(el).getAttribute('aria-describedby')).toBe('hint');
  });
});

describe('FoundrySelect ARIA wiring', () => {
  it('trigger has aria-haspopup="listbox"', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    expect(getControl(el).getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('trigger starts with aria-expanded="false" (Phase 1: listbox never opens)', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    expect(getControl(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('listbox surface has role="listbox" and popover="manual"', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    const listbox = el.shadowRoot?.querySelector('[part="listbox"]');
    expect(listbox?.getAttribute('role')).toBe('listbox');
    expect(listbox?.getAttribute('popover')).toBe('manual');
  });
});

describe('FoundrySelect propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    const before = valueText(el);

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(valueText(el)).toBe(before);
  });
});

describe('FoundrySelect disconnected cleanup', () => {
  it('does not throw when disconnected + reconnected', async () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }]);
    document.body.appendChild(el);
    await raf();

    const parent = el.parentElement as HTMLElement;
    parent.removeChild(el);
    expect(() => parent.appendChild(el)).not.toThrow();
  });
});

describe('FoundrySelect with patched ElementInternals', () => {
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

  it('calls setFormValue(null) on connect when value is empty', () => {
    withPatchedInternals((stub) => {
      const el = makeSelect();
      document.body.appendChild(el);
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('calls setFormValue(value) when value is set to a matching option', () => {
    withPatchedInternals((stub) => {
      const el = makeSelect([
        { value: 'utc', text: 'UTC' },
        { value: 'est', text: 'EST' },
      ]) as FoundrySelect & { value: string };
      document.body.appendChild(el);

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.value = 'utc';
      expect(stub.setFormValue).toHaveBeenCalledWith('utc');

      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      el.value = '';
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('exercises setValidity for both valid and invalid states', () => {
    withPatchedInternals((stub) => {
      const el = makeSelect([{ value: 'utc', text: 'UTC' }]) as FoundrySelect & {
        value: string;
      };
      el.setAttribute('required', '');
      document.body.appendChild(el);

      const invalidCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(invalidCallArgs?.[0]).toEqual({ valueMissing: true });
      expect(typeof invalidCallArgs?.[1]).toBe('string');

      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      el.value = 'utc';
      const validCallArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(validCallArgs?.[0]).toEqual({});
    });
  });

  it('delegates checkValidity and reportValidity to internals when available', () => {
    withPatchedInternals((stub) => {
      const el = makeSelect();
      document.body.appendChild(el);

      expect(el.checkValidity()).toBe(true);
      expect(stub.checkValidity).toHaveBeenCalled();
      expect(el.reportValidity()).toBe(true);
      expect(stub.reportValidity).toHaveBeenCalled();
    });
  });

  it('exposes .validity and .validationMessage from internals', () => {
    withPatchedInternals((stub) => {
      const el = makeSelect();
      document.body.appendChild(el);
      expect(el.validity).toBe(stub.validity);
      expect(el.validationMessage).toBe('stubbed message');
    });
  });

  it('exposes .form from internals when attached to a form', () => {
    withPatchedInternals((stub) => {
      const form = document.createElement('form');
      const el = makeSelect();
      form.appendChild(el);
      document.body.appendChild(form);

      stub.form = form;
      expect(el.form).toBe(form);
    });
  });
});
