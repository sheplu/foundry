import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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

  it('trigger starts with aria-expanded="false"', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    expect(getControl(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('listbox surface has role="listbox" and popover="auto"', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    const listbox = el.shadowRoot?.querySelector('[part="listbox"]');
    expect(listbox?.getAttribute('role')).toBe('listbox');
    expect(listbox?.getAttribute('popover')).toBe('auto');
  });

  it('listbox has a stable id and trigger carries matching aria-controls', () => {
    const el = makeSelect();
    document.body.appendChild(el);
    const listbox = el.shadowRoot?.querySelector('[part="listbox"]') as HTMLElement;
    expect(listbox.id).toMatch(/^foundry-select-listbox-\d+$/);
    expect(getControl(el).getAttribute('aria-controls')).toBe(listbox.id);
  });

  it('assigns unique ids to options that lack one', () => {
    const el = makeSelect([{ value: 'utc', text: 'UTC' }, { value: 'est', text: 'EST' }]);
    document.body.appendChild(el);
    expect(el.options[0]?.id).toMatch(/^foundry-select-option-\d+-0$/);
    expect(el.options[1]?.id).toMatch(/^foundry-select-option-\d+-1$/);
  });

  it('preserves an option id the consumer already set', () => {
    const el = document.createElement('foundry-select') as FoundrySelect;
    el.innerHTML = '<foundry-option id="my-opt" value="a">A</foundry-option>';
    document.body.appendChild(el);
    expect(el.options[0]?.id).toBe('my-opt');
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

// ---------------------------------------------------------------------
// Phase 2: open-state + keyboard + click-to-select
// ---------------------------------------------------------------------

// jsdom doesn't implement the Popover API. We stub showPopover/hidePopover so
// the controller's state flips and our wiring has something to react to.
// The native toggle event isn't auto-dispatched, so we fire it manually in
// tests that rely on the open-state sync.
function installPopoverShim(): () => void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  const originalShow = proto.showPopover;
  const originalHide = proto.hidePopover;
  proto.showPopover = function (this: HTMLElement): void {
    // Fire the browser's toggle event so listeners pick up the state flip.
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', { value: 'open' });
    this.dispatchEvent(event);
  };
  proto.hidePopover = function (this: HTMLElement): void {
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', { value: 'closed' });
    this.dispatchEvent(event);
  };
  return (): void => {
    if (originalShow === undefined) delete proto.showPopover;
    else proto.showPopover = originalShow;
    if (originalHide === undefined) delete proto.hidePopover;
    else proto.hidePopover = originalHide;
  };
}

function keydown(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

function click(target: HTMLElement, detail = 1): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true, detail });
  target.dispatchEvent(event);
  return event;
}

describe('FoundrySelect open/close via trigger', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('clicking the trigger opens the listbox', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }, { value: 'b', text: 'B' }]);
    document.body.appendChild(el);
    const btn = getControl(el);
    expect(el.hasAttribute('open')).toBe(false);

    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    click(btn);
    expect(el.hasAttribute('open')).toBe(true);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('clicking a second time with light-dismiss already closed stays closed', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    const btn = getControl(el);
    // Open.
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    click(btn);
    expect(el.hasAttribute('open')).toBe(true);

    // Simulate the browser's light-dismiss on pointerdown (closes before click).
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    const listbox = el.shadowRoot?.querySelector('[part="listbox"]') as HTMLElement;
    const toggle = new Event('toggle');
    Object.defineProperty(toggle, 'newState', { value: 'closed' });
    listbox.dispatchEvent(toggle);
    // Click fires after pointerdown.
    click(btn);
    // Without the guard, click would re-open. Guard holds it closed.
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('trigger click while disabled does not open', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    const btn = getControl(el);
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    click(btn);
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('disabling the select while open closes it', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]) as FoundrySelect & { disabled: boolean };
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
    el.disabled = true;
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('show() seeds the active descendant from the current selection', () => {
    const el = makeSelect([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    el.setAttribute('value', 'b');
    document.body.appendChild(el);
    el.show();
    const btn = getControl(el);
    expect(btn.getAttribute('aria-activedescendant')).toBe(el.options[1]?.id);
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('show() with no selection seeds active on the first enabled option', () => {
    const el = makeSelect([
      { value: 'a', text: 'A', disabled: true },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C' },
    ]);
    document.body.appendChild(el);
    el.show();
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('hide() clears aria-activedescendant + active flag', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
    el.hide();
    expect(el.options[0]?.hasAttribute('active')).toBe(false);
    expect(getControl(el).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('toggle() flips between open and closed', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.toggle();
    expect(el.hasAttribute('open')).toBe(true);
    el.toggle();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('show() + show() is idempotent', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('hide() while closed is a no-op', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    expect(() => el.hide()).not.toThrow();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('external toggle event (browser-driven dismiss) syncs open=false', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(true);

    const listbox = el.shadowRoot?.querySelector('[part="listbox"]') as HTMLElement;
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', { value: 'closed' });
    listbox.dispatchEvent(event);
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('browser-synthesised click after Enter keydown does not re-open', () => {
    // Browsers fire a click event after Enter/Space on a focused <button>.
    // Our trigger keydown handler already processed the key, so the click
    // must be suppressed (via the flag set in the keydown handler).
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    const btn = getControl(el);
    keydown(btn, 'Enter');
    // Simulate the browser-synthesised click that follows Enter on a button.
    click(btn);
    expect(el.hasAttribute('open')).toBe(true);
    // Close via another Enter to verify the flow still works normally.
    keydown(btn, 'Enter');
    click(btn);
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundrySelect keyboard navigation (closed)', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it.each(['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'])(
    'key %s opens the listbox',
    (key) => {
      const el = makeSelect([{ value: 'a', text: 'A' }, { value: 'b', text: 'B' }]);
      document.body.appendChild(el);
      const event = keydown(getControl(el), key);
      expect(el.hasAttribute('open')).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    },
  );

  it('Home on closed opens and seeds active on first enabled option', () => {
    const el = makeSelect([
      { value: 'a', text: 'A', disabled: true },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C' },
    ]);
    document.body.appendChild(el);
    keydown(getControl(el), 'Home');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('End on closed opens and seeds active on last enabled option', () => {
    const el = makeSelect([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C', disabled: true },
    ]);
    document.body.appendChild(el);
    keydown(getControl(el), 'End');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('typeahead from closed opens and jumps to the match', () => {
    const el = makeSelect([
      { value: 'utc', text: 'UTC' },
      { value: 'est', text: 'Eastern' },
      { value: 'pst', text: 'Pacific' },
    ]);
    document.body.appendChild(el);
    keydown(getControl(el), 'p');
    expect(el.hasAttribute('open')).toBe(true);
    expect(el.options[2]?.hasAttribute('active')).toBe(true);
  });

  it('non-opening keys are ignored when closed', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    keydown(getControl(el), 'Tab');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('disabled select ignores keyboard', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    keydown(getControl(el), 'ArrowDown');
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundrySelect keyboard navigation (open)', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  function openWith(options: { value: string; text: string; disabled?: boolean }[]): {
    el: FoundrySelect;
    btn: HTMLButtonElement;
  } {
    const el = makeSelect(options);
    document.body.appendChild(el);
    el.show();
    return { el, btn: getControl(el) };
  }

  it('ArrowDown moves the active descendant forward', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C' },
    ]);
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
    keydown(btn, 'ArrowDown');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('ArrowDown skips disabled options', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B', disabled: true },
      { value: 'c', text: 'C' },
    ]);
    keydown(btn, 'ArrowDown');
    expect(el.options[2]?.hasAttribute('active')).toBe(true);
  });

  it('ArrowDown wraps from last to first', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    keydown(btn, 'ArrowDown');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
    keydown(btn, 'ArrowDown');
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
  });

  it('ArrowUp wraps from first to last', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C' },
    ]);
    keydown(btn, 'ArrowUp');
    expect(el.options[2]?.hasAttribute('active')).toBe(true);
  });

  it('Home jumps to the first enabled option', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A', disabled: true },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C' },
    ]);
    keydown(btn, 'End');
    keydown(btn, 'Home');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('End jumps to the last enabled option', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C', disabled: true },
    ]);
    keydown(btn, 'End');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('Escape closes without committing', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    keydown(btn, 'ArrowDown');
    keydown(btn, 'Escape');
    expect(el.hasAttribute('open')).toBe(false);
    expect((el as unknown as { value: string }).value).toBe('');
  });

  it('Enter commits the active option and closes', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    keydown(btn, 'ArrowDown');
    keydown(btn, 'Enter');
    expect(el.hasAttribute('open')).toBe(false);
    expect((el as unknown as { value: string }).value).toBe('b');
  });

  it('Space commits the active option and closes', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    keydown(btn, ' ');
    expect((el as unknown as { value: string }).value).toBe('a');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('Enter on a disabled active option does nothing but still closes', () => {
    // We never seed active on a disabled option (show() skips them) and Arrow
    // navigation also skips them, but an explicit consumer could theoretically
    // land there — verify defensive behavior.
    const { el, btn } = openWith([{ value: 'a', text: 'A' }]);
    // Disable the only option after opening.
    el.options[0]?.setAttribute('disabled', '');
    keydown(btn, 'Enter');
    expect((el as unknown as { value: string }).value).toBe('');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('Tab commits the active option and closes', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    keydown(btn, 'ArrowDown');
    const event = keydown(btn, 'Tab');
    expect((el as unknown as { value: string }).value).toBe('b');
    expect(el.hasAttribute('open')).toBe(false);
    // Tab must NOT be preventDefault'd — focus should move on.
    expect(event.defaultPrevented).toBe(false);
  });

  it('dispatches change on commit', () => {
    const { el, btn } = openWith([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    keydown(btn, 'ArrowDown');
    keydown(btn, 'Enter');
    expect(fired).toBe(1);
  });

  it('no change event when commit is a no-op (same value)', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    el.setAttribute('value', 'a');
    document.body.appendChild(el);
    el.show();
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    keydown(getControl(el), 'Enter');
    expect(fired).toBe(0);
  });
});

describe('FoundrySelect typeahead', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('single-char typeahead moves active to the first matching option', () => {
    const el = makeSelect([
      { value: 'utc', text: 'UTC' },
      { value: 'est', text: 'Eastern' },
      { value: 'pst', text: 'Pacific' },
    ]);
    document.body.appendChild(el);
    el.show();
    keydown(getControl(el), 'p');
    expect(el.options[2]?.hasAttribute('active')).toBe(true);
  });

  it('repeated single-char cycles through same-prefix options', () => {
    const el = makeSelect([
      { value: 'apple', text: 'Apple' },
      { value: 'apricot', text: 'Apricot' },
      { value: 'banana', text: 'Banana' },
    ]);
    document.body.appendChild(el);
    el.show();
    const btn = getControl(el);
    keydown(btn, 'a');
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
    keydown(btn, 'a');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('multi-char buffer matches longer prefixes within reset window', () => {
    const el = makeSelect([
      { value: 'ne', text: 'Newark' },
      { value: 'ny', text: 'New York' },
    ]);
    document.body.appendChild(el);
    el.show();
    const btn = getControl(el);
    keydown(btn, 'n');
    keydown(btn, 'e');
    keydown(btn, 'w');
    keydown(btn, ' ');
    keydown(btn, 'y');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('typeahead skips disabled options', () => {
    const el = makeSelect([
      { value: 'a', text: 'Alpha', disabled: true },
      { value: 'b', text: 'Apple' },
    ]);
    document.body.appendChild(el);
    el.show();
    keydown(getControl(el), 'a');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('ignores modifier-combo key presses', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    // Pre-clear any seeded active so we can assert a modifier press is a no-op.
    const btn = getControl(el);
    keydown(btn, 'a', { ctrlKey: true });
    // Active remains on the first option (from show()), unchanged.
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
  });

  it('non-printable keys do not feed typeahead', () => {
    const el = makeSelect([{ value: 'a', text: 'Alpha' }]);
    document.body.appendChild(el);
    el.show();
    // F5 is non-printable (key.length > 1). Shouldn't throw; shouldn't match.
    expect(() => keydown(getControl(el), 'F5')).not.toThrow();
  });

  it('leading space does not start a typeahead buffer', () => {
    const el = makeSelect([{ value: ' leading-space', text: ' Leading' }]);
    document.body.appendChild(el);
    el.show();
    // Bare ' ' when buffer is empty commits the active option — so we must
    // assert by reading state after: the listbox closes.
    keydown(getControl(el), ' ');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('typeahead resets after the 500 ms window', async () => {
    vi.useFakeTimers();
    try {
      const el = makeSelect([
        { value: 'a', text: 'Apple' },
        { value: 'b', text: 'Banana' },
      ]);
      document.body.appendChild(el);
      el.show();
      const btn = getControl(el);
      keydown(btn, 'a');
      expect(el.options[0]?.hasAttribute('active')).toBe(true);
      vi.advanceTimersByTime(600);
      keydown(btn, 'b');
      expect(el.options[1]?.hasAttribute('active')).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FoundrySelect click-to-select', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('clicking an option commits + closes the listbox', () => {
    const el = makeSelect([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    document.body.appendChild(el);
    el.show();
    el.options[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
    );
    expect((el as unknown as { value: string }).value).toBe('b');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('clicking a disabled option is a no-op', () => {
    const el = makeSelect([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B', disabled: true },
    ]);
    document.body.appendChild(el);
    el.show();
    el.options[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
    );
    expect((el as unknown as { value: string }).value).toBe('');
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('pointermove over an enabled option sets it active', () => {
    const el = makeSelect([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    document.body.appendChild(el);
    el.show();
    el.options[1]?.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, composed: true }),
    );
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('pointermove over a disabled option leaves active unchanged', () => {
    const el = makeSelect([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B', disabled: true },
    ]);
    document.body.appendChild(el);
    el.show();
    // Active is seeded on option 0 from show().
    el.options[1]?.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, composed: true }),
    );
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
    expect(el.options[1]?.hasAttribute('active')).toBe(false);
  });

  it('click on the listbox background (not an option) is ignored', () => {
    const el = makeSelect([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    const listbox = el.shadowRoot?.querySelector('[part="listbox"]') as HTMLElement;
    listbox.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
    );
    expect(el.hasAttribute('open')).toBe(true);
  });
});

describe('FoundrySelect option lifecycle while open', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('removing the active option re-seeds active on a still-present option', async () => {
    const el = makeSelect([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    document.body.appendChild(el);
    el.show();
    keydown(getControl(el), 'ArrowDown');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
    el.options[1]?.remove();
    await raf();
    // Active must have moved (or cleared) — not dangle on the removed option.
    expect(el.options.length).toBe(1);
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
  });
});
