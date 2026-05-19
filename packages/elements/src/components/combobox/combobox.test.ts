import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FoundryCombobox } from './combobox.ts';
import { FoundryOption } from '../option/option.ts';

beforeAll(() => {
  FoundryCombobox.define();
});

let counter = 0;

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function getInput(el: HTMLElement): HTMLInputElement {
  const inp = el.shadowRoot?.querySelector('input[part="input"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner input not found');
  return inp;
}

function getNoResults(el: HTMLElement): HTMLElement {
  const div = el.shadowRoot?.querySelector('[part="no-results"]');
  if (!(div instanceof HTMLElement)) throw new Error('no-results element not found');
  return div;
}

function makeCombobox(
  children: { value?: string; text: string; disabled?: boolean }[] = [],
): FoundryCombobox {
  const el = document.createElement('foundry-combobox') as FoundryCombobox;
  for (const child of children) {
    const opt = document.createElement('foundry-option');
    if (child.value !== undefined) opt.setAttribute('value', child.value);
    if (child.disabled) opt.setAttribute('disabled', '');
    opt.textContent = child.text;
    el.appendChild(opt);
  }
  return el;
}

function fireInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function keydown(target: HTMLElement, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
});

// jsdom doesn't implement the Popover API. We stub showPopover/hidePopover
// so the controller's state flips and the wiring has something to react to.
// The native toggle event isn't auto-dispatched, so we fire it manually.
function installPopoverShim(): () => void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  const originalShow = proto.showPopover;
  const originalHide = proto.hidePopover;
  proto.showPopover = function (this: HTMLElement): void {
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

describe('FoundryCombobox.define', () => {
  it('is idempotent when called with the default tag', () => {
    expect(() => FoundryCombobox.define()).not.toThrow();
    expect(customElements.get('foundry-combobox')).toBe(FoundryCombobox);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-combobox-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryCombobox.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });

  it('also defines foundry-option as a side-effect', () => {
    FoundryCombobox.define();
    expect(customElements.get('foundry-option')).toBe(FoundryOption);
  });
});

describe('FoundryCombobox defaults', () => {
  it('declares formAssociated for the custom element registry', () => {
    expect(FoundryCombobox.formAssociated).toBe(true);
  });

  it('defaults value to empty, open + invalid to false', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect((el as unknown as { value: string }).value).toBe('');
    expect(el.hasAttribute('open')).toBe(false);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('forwards placeholder, name, autocomplete, readonly onto the inner input', () => {
    const el = makeCombobox();
    el.setAttribute('placeholder', 'Type a city');
    el.setAttribute('name', 'city');
    el.setAttribute('autocomplete', 'off');
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.getAttribute('placeholder')).toBe('Type a city');
    expect(inp.getAttribute('name')).toBe('city');
    expect(inp.getAttribute('autocomplete')).toBe('off');
    expect(inp.hasAttribute('readonly')).toBe(true);
  });

  it('forwards initial value attribute onto the inner input', () => {
    const el = makeCombobox([{ value: 'paris', text: 'Paris' }]);
    el.setAttribute('value', 'paris');
    document.body.appendChild(el);
    expect(getInput(el).value).toBe('paris');
  });

  it('updating placeholder and autocomplete at runtime re-forwards', () => {
    const el = makeCombobox() as FoundryCombobox & { placeholder: string; autocomplete: string };
    document.body.appendChild(el);
    el.placeholder = 'Updated';
    el.autocomplete = 'name';
    expect(getInput(el).getAttribute('placeholder')).toBe('Updated');
    expect(getInput(el).getAttribute('autocomplete')).toBe('name');
    el.placeholder = '';
    expect(getInput(el).hasAttribute('placeholder')).toBe(false);
  });

  it('does not reflect placeholder and similar string props when empty', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(getInput(el).hasAttribute('placeholder')).toBe(false);
    expect(getInput(el).hasAttribute('autocomplete')).toBe(false);
    expect(getInput(el).hasAttribute('name')).toBe(false);
  });
});

describe('FoundryCombobox options discovery', () => {
  it('assigns auto ids to options that lack one', () => {
    const el = makeCombobox([
      { value: 'paris', text: 'Paris' },
      { value: 'london', text: 'London' },
    ]);
    document.body.appendChild(el);
    expect(el.options[0]?.id).toMatch(/^foundry-combobox-\d+-option-0$/);
    expect(el.options[1]?.id).toMatch(/^foundry-combobox-\d+-option-1$/);
  });

  it('preserves existing ids', () => {
    const el = document.createElement('foundry-combobox') as FoundryCombobox;
    el.innerHTML = '<foundry-option id="my-opt" value="a">A</foundry-option>';
    document.body.appendChild(el);
    expect(el.options[0]?.id).toBe('my-opt');
  });

  it('non-option children are ignored', () => {
    const el = document.createElement('foundry-combobox') as FoundryCombobox;
    el.innerHTML = `
      <foundry-option value="a">A</foundry-option>
      <span>garbage</span>
      <foundry-option value="b">B</foundry-option>
    `;
    document.body.appendChild(el);
    expect(el.options.length).toBe(2);
  });

  it('adding an option after mount is detected', async () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.options.length).toBe(1);
    const opt = document.createElement('foundry-option');
    opt.setAttribute('value', 'b');
    opt.textContent = 'B';
    el.appendChild(opt);
    await raf();
    expect(el.options.length).toBe(2);
  });

  it('removing the active option re-seeds active onto a remaining option', async () => {
    const uninstall = installPopoverShim();
    try {
      const el = makeCombobox([
        { value: 'a', text: 'A' },
        { value: 'b', text: 'B' },
      ]);
      document.body.appendChild(el);
      el.show();
      const inp = getInput(el);
      keydown(inp, 'ArrowDown');
      keydown(inp, 'ArrowDown');
      expect(el.options[1]?.hasAttribute('active')).toBe(true);
      el.options[1]?.remove();
      await raf();
      expect(el.options[0]?.hasAttribute('active')).toBe(true);
    } finally {
      uninstall();
    }
  });
});

describe('FoundryCombobox required + validity', () => {
  it('required + empty marks the host invalid', () => {
    const el = makeCombobox();
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    expect(getInput(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('required + value-set clears invalid', () => {
    const el = makeCombobox();
    el.setAttribute('required', '');
    el.setAttribute('value', 'paris');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('non-required + empty is not invalid', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('toggling required recomputes validity', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
    (el as unknown as { required: boolean }).required = true;
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('clearing the value while required re-invalidates', () => {
    const el = makeCombobox() as FoundryCombobox & { value: string };
    el.setAttribute('required', '');
    el.setAttribute('value', 'paris');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
    el.value = '';
    expect(el.hasAttribute('invalid')).toBe(true);
  });
});

describe('FoundryCombobox form-associated lifecycle', () => {
  it('formResetCallback restores the initial value attribute', () => {
    const el = makeCombobox() as FoundryCombobox & {
      value: string;
      formResetCallback: () => void;
    };
    el.setAttribute('value', 'paris');
    document.body.appendChild(el);
    el.value = 'london';
    expect((el as unknown as { value: string }).value).toBe('london');
    el.formResetCallback();
    expect((el as unknown as { value: string }).value).toBe('paris');
    expect(getInput(el).value).toBe('paris');
  });

  it('formResetCallback resets to empty when no initial value was set', () => {
    const el = makeCombobox() as FoundryCombobox & {
      value: string;
      formResetCallback: () => void;
    };
    document.body.appendChild(el);
    el.value = 'something';
    el.formResetCallback();
    expect((el as unknown as { value: string }).value).toBe('');
  });

  it('formDisabledCallback reflects disabled onto the host', () => {
    const el = makeCombobox() as FoundryCombobox & {
      formDisabledCallback: (d: boolean) => void;
    };
    document.body.appendChild(el);
    el.formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(getInput(el).hasAttribute('disabled')).toBe(true);
  });

  it('formStateRestoreCallback restores value', () => {
    const el = makeCombobox() as FoundryCombobox & {
      formStateRestoreCallback: (s: string | null) => void;
    };
    document.body.appendChild(el);
    el.formStateRestoreCallback('utc');
    expect((el as unknown as { value: string }).value).toBe('utc');
    el.formStateRestoreCallback(null);
    expect((el as unknown as { value: string }).value).toBe('');
  });
});

describe('FoundryCombobox accessors + focus', () => {
  it('exposes .form as null when not in a form', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(el.form).toBe(null);
  });

  it('checkValidity / reportValidity fall back to true when internals unavailable', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(el.checkValidity()).toBe(true);
    expect(el.reportValidity()).toBe(true);
  });

  it('validationMessage falls back to empty string when internals unavailable', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(el.validationMessage).toBe('');
  });

  it('delegates focus() to the inner input', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    let focused = false;
    getInput(el).addEventListener('focus', () => {
      focused = true;
    });
    el.focus();
    expect(focused).toBe(true);
  });
});

describe('FoundryCombobox slot reflection', () => {
  it('reflects has-label when label slot has content', async () => {
    const el = makeCombobox();
    el.innerHTML = '<span slot="label">City</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(true);
  });

  it('reflects has-helper when helper slot has content', async () => {
    const el = makeCombobox();
    el.innerHTML = '<span slot="helper">Pick a city</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-helper')).toBe(true);
    expect(getInput(el).getAttribute('aria-describedby')).toBe('hint');
  });

  it('reflects has-error when error slot has content', async () => {
    const el = makeCombobox();
    el.innerHTML = '<span slot="error">Required</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-error')).toBe(true);
  });

  it('wires aria-errormessage when invalid + has-error', async () => {
    const el = makeCombobox();
    el.setAttribute('required', '');
    el.innerHTML = '<span slot="error">Required</span>';
    document.body.appendChild(el);
    await raf();
    expect(getInput(el).getAttribute('aria-errormessage')).toBe('err');
  });
});

describe('FoundryCombobox ARIA wiring', () => {
  it('input carries combobox role + aria-autocomplete=list + aria-haspopup=listbox', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.getAttribute('role')).toBe('combobox');
    expect(inp.getAttribute('aria-autocomplete')).toBe('list');
    expect(inp.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('input starts with aria-expanded=false', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(getInput(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('listbox surface has role=listbox + popover=auto + a stable id', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    const surface = el.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    expect(surface.getAttribute('role')).toBe('listbox');
    expect(surface.getAttribute('popover')).toBe('auto');
    expect(surface.id).toMatch(/^foundry-combobox-\d+-listbox$/);
    expect(getInput(el).getAttribute('aria-controls')).toBe(surface.id);
  });
});

describe('FoundryCombobox open/close', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('show() opens; hide() closes', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
    expect(getInput(el).getAttribute('aria-expanded')).toBe('true');
    el.hide();
    expect(el.hasAttribute('open')).toBe(false);
    expect(getInput(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('show() is idempotent', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('hide() while closed is a no-op', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(() => el.hide()).not.toThrow();
  });

  it('show() while disabled is a no-op', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('show() while readonly is a no-op', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('disabling while open closes the listbox', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]) as FoundryCombobox & {
      disabled: boolean;
    };
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
    el.disabled = true;
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('focus on the input opens the listbox when options are visible', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    getInput(el).dispatchEvent(new FocusEvent('focus'));
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('focus does not open when there are no options', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    getInput(el).dispatchEvent(new FocusEvent('focus'));
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryCombobox keyboard (closed)', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('ArrowDown opens and seeds active on first enabled visible', () => {
    const el = makeCombobox([
      { value: 'a', text: 'Alpha', disabled: true },
      { value: 'b', text: 'Beta' },
      { value: 'c', text: 'Gamma' },
    ]);
    document.body.appendChild(el);
    const event = keydown(getInput(el), 'ArrowDown');
    expect(el.hasAttribute('open')).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('ArrowUp opens and seeds active on last enabled visible', () => {
    const el = makeCombobox([
      { value: 'a', text: 'Alpha' },
      { value: 'b', text: 'Beta' },
      { value: 'c', text: 'Gamma', disabled: true },
    ]);
    document.body.appendChild(el);
    keydown(getInput(el), 'ArrowUp');
    expect(el.hasAttribute('open')).toBe(true);
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('Enter on closed commits free-text', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]) as FoundryCombobox & { value: string };
    document.body.appendChild(el);
    fireInput(getInput(el), 'something');
    el.hide(); // make sure closed
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    keydown(getInput(el), 'Enter');
    expect(fired).toEqual({ value: 'something', source: 'enter' });
  });

  it('Tab on closed does nothing (passes through)', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    keydown(getInput(el), 'Tab');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('disabled combobox ignores keyboard', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    keydown(getInput(el), 'ArrowDown');
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryCombobox keyboard (open)', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  function open(options: { value: string; text: string; disabled?: boolean }[]): {
    el: FoundryCombobox;
    inp: HTMLInputElement;
  } {
    const el = makeCombobox(options);
    document.body.appendChild(el);
    el.show();
    return { el, inp: getInput(el) };
  }

  it('ArrowDown cycles forward', () => {
    const { el, inp } = open([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
    ]);
    keydown(inp, 'ArrowDown');
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
    keydown(inp, 'ArrowDown');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
    keydown(inp, 'ArrowDown');
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
  });

  it('ArrowUp wraps to last enabled visible', () => {
    const { el, inp } = open([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C' },
    ]);
    keydown(inp, 'ArrowUp');
    expect(el.options[2]?.hasAttribute('active')).toBe(true);
  });

  it('ArrowDown skips disabled options', () => {
    const { el, inp } = open([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B', disabled: true },
      { value: 'c', text: 'C' },
    ]);
    keydown(inp, 'ArrowDown');
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
    keydown(inp, 'ArrowDown');
    expect(el.options[2]?.hasAttribute('active')).toBe(true);
  });

  it('Home jumps to first enabled visible; End jumps to last', () => {
    const { el, inp } = open([
      { value: 'a', text: 'A', disabled: true },
      { value: 'b', text: 'B' },
      { value: 'c', text: 'C' },
    ]);
    keydown(inp, 'End');
    expect(el.options[2]?.hasAttribute('active')).toBe(true);
    keydown(inp, 'Home');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
  });

  it('Escape closes; does not undo typed text', () => {
    const { el, inp } = open([{ value: 'a', text: 'A' }]);
    fireInput(inp, 'whatever');
    keydown(inp, 'Escape');
    expect(el.hasAttribute('open')).toBe(false);
    expect(inp.value).toBe('whatever');
    expect((el as unknown as { value: string }).value).toBe('whatever');
  });

  it('Enter with active option commits the option (replaces input text + fires change with source=option)', () => {
    const { el, inp } = open([
      { value: 'paris', text: 'Paris' },
      { value: 'london', text: 'London' },
    ]);
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    keydown(inp, 'ArrowDown'); // active = first
    keydown(inp, 'ArrowDown'); // active = second
    keydown(inp, 'Enter');
    expect(fired).toEqual({ value: 'london', source: 'option' });
    expect(inp.value).toBe('London');
    expect((el as unknown as { value: string }).value).toBe('london');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('Enter with no active commits free-text and closes', () => {
    const { el, inp } = open([{ value: 'a', text: 'A' }]);
    fireInput(inp, 'free typed');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    keydown(inp, 'Enter');
    expect(fired).toEqual({ value: 'free typed', source: 'enter' });
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('Tab commits free-text without preventDefault', () => {
    const { el, inp } = open([{ value: 'a', text: 'A' }]);
    fireInput(inp, 'tabbed');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    const event = keydown(inp, 'Tab');
    expect(event.defaultPrevented).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
    expect(fired).toEqual({ value: 'tabbed', source: 'blur' });
  });

  it('Enter with active disabled falls through to free-text commit', () => {
    const { el, inp } = open([{ value: 'a', text: 'A' }]);
    el.options[0]?.setAttribute('disabled', '');
    fireInput(inp, 'free');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    keydown(inp, 'Enter');
    expect(fired).toEqual({ value: 'free', source: 'enter' });
  });

  it('ArrowDown with no visible options is a no-op', () => {
    const { el, inp } = open([{ value: 'a', text: 'A' }]);
    fireInput(inp, 'zzz');
    expect(el.options[0]?.hasAttribute('hidden')).toBe(true);
    keydown(inp, 'ArrowDown');
    expect(el.options[0]?.hasAttribute('active')).toBe(false);
  });
});

describe('FoundryCombobox filter', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('typing narrows visible options (case-insensitive substring)', () => {
    const el = makeCombobox([
      { value: 'paris', text: 'Paris' },
      { value: 'london', text: 'London' },
      { value: 'tokyo', text: 'Tokyo' },
    ]);
    document.body.appendChild(el);
    const inp = getInput(el);
    fireInput(inp, 'LO');
    expect(el.options[0]?.hasAttribute('hidden')).toBe(true);
    expect(el.options[1]?.hasAttribute('hidden')).toBe(false);
    expect(el.options[2]?.hasAttribute('hidden')).toBe(true);
  });

  it('empty input shows all options', () => {
    const el = makeCombobox([
      { value: 'paris', text: 'Paris' },
      { value: 'london', text: 'London' },
    ]);
    document.body.appendChild(el);
    const inp = getInput(el);
    fireInput(inp, 'lon');
    expect(el.options[0]?.hasAttribute('hidden')).toBe(true);
    fireInput(inp, '');
    expect(el.options[0]?.hasAttribute('hidden')).toBe(false);
    expect(el.options[1]?.hasAttribute('hidden')).toBe(false);
  });

  it('shows no-results when zero options match', () => {
    const el = makeCombobox([
      { value: 'paris', text: 'Paris' },
      { value: 'london', text: 'London' },
    ]);
    document.body.appendChild(el);
    expect(getNoResults(el).hidden).toBe(true);
    fireInput(getInput(el), 'zzz');
    expect(getNoResults(el).hidden).toBe(false);
  });

  it('moves active to first visible option when filter hides current active', () => {
    const el = makeCombobox([
      { value: 'paris', text: 'Paris' },
      { value: 'london', text: 'London' },
    ]);
    document.body.appendChild(el);
    el.show();
    const inp = getInput(el);
    keydown(inp, 'ArrowDown');
    keydown(inp, 'ArrowDown');
    expect(el.options[1]?.hasAttribute('active')).toBe(true);
    fireInput(inp, 'par');
    expect(el.options[1]?.hasAttribute('hidden')).toBe(true);
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
  });

  it('typing into an empty list keeps the listbox closed', () => {
    const el = makeCombobox([{ value: 'paris', text: 'Paris' }]);
    document.body.appendChild(el);
    fireInput(getInput(el), 'zzz');
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryCombobox click commit', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('clicking an enabled option commits + closes + replaces input text', () => {
    const el = makeCombobox([
      { value: 'paris', text: 'Paris' },
      { value: 'london', text: 'London' },
    ]);
    document.body.appendChild(el);
    el.show();
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    el.options[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
    );
    expect(fired).toEqual({ value: 'london', source: 'option' });
    expect(getInput(el).value).toBe('London');
    expect((el as unknown as { value: string }).value).toBe('london');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('clicking a disabled option is a no-op', () => {
    const el = makeCombobox([
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

  it('clicking the surface background (not an option) is ignored', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    const surface = el.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    surface.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true, detail: 1 }),
    );
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('pointermove over enabled option sets active', () => {
    const el = makeCombobox([
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

  it('pointermove over disabled option leaves active unchanged', () => {
    const el = makeCombobox([
      { value: 'a', text: 'A' },
      { value: 'b', text: 'B', disabled: true },
    ]);
    document.body.appendChild(el);
    el.show();
    el.options[0]?.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, composed: true }),
    );
    el.options[1]?.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, composed: true }),
    );
    expect(el.options[0]?.hasAttribute('active')).toBe(true);
    expect(el.options[1]?.hasAttribute('active')).toBe(false);
  });

  it('pointermove over the same active option is a no-op', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    el.options[0]?.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, composed: true }),
    );
    expect(() =>
      el.options[0]?.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, composed: true }),
      ),
    ).not.toThrow();
  });
});

describe('FoundryCombobox blur commit', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('blur commits free-text (source=blur) when value differs', async () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    fireInput(getInput(el), 'edited');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toEqual({ value: 'edited', source: 'blur' });
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('blur does not fire change when value is unchanged from last commit', async () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    el.show();
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(0);
  });

  it('blur with the listbox already closed does not fire change', async () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    fireInput(getInput(el), 'edited'); // open via input, but...
    el.hide();
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(0);
  });
});

describe('FoundryCombobox input event flow', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('typing fires input on the host (re-emit) but no change', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    let inputs = 0;
    let changes = 0;
    el.addEventListener('input', () => {
      inputs += 1;
    });
    el.addEventListener('change', () => {
      changes += 1;
    });
    fireInput(getInput(el), 'a');
    expect(inputs).toBe(1);
    expect(changes).toBe(0);
  });

  it('typing updates the value property on every keystroke', () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    fireInput(getInput(el), 'p');
    expect((el as unknown as { value: string }).value).toBe('p');
    fireInput(getInput(el), 'pa');
    expect((el as unknown as { value: string }).value).toBe('pa');
  });
});

describe('FoundryCombobox propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makeCombobox();
    document.body.appendChild(el);
    expect(() => {
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null);
    }).not.toThrow();
  });

  it('writing the value property programmatically syncs to the input', () => {
    const el = makeCombobox([{ value: 'paris', text: 'Paris' }]) as FoundryCombobox & {
      value: string;
    };
    document.body.appendChild(el);
    el.value = 'paris';
    expect(getInput(el).value).toBe('paris');
  });
});

describe('FoundryCombobox disconnected cleanup', () => {
  it('does not throw when disconnected + reconnected', async () => {
    const el = makeCombobox([{ value: 'a', text: 'A' }]);
    document.body.appendChild(el);
    await raf();
    const parent = el.parentElement as HTMLElement;
    parent.removeChild(el);
    expect(() => parent.appendChild(el)).not.toThrow();
  });
});

describe('FoundryCombobox with patched ElementInternals', () => {
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
      const el = makeCombobox();
      document.body.appendChild(el);
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('calls setFormValue on every keystroke (free-text capture)', () => {
    withPatchedInternals((stub) => {
      const el = makeCombobox();
      document.body.appendChild(el);
      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      fireInput(getInput(el), 'p');
      fireInput(getInput(el), 'pa');
      expect(stub.setFormValue).toHaveBeenCalledWith('p');
      expect(stub.setFormValue).toHaveBeenCalledWith('pa');
    });
  });

  it('exercises setValidity for both invalid and valid states', () => {
    withPatchedInternals((stub) => {
      const el = makeCombobox() as FoundryCombobox & { value: string };
      el.setAttribute('required', '');
      document.body.appendChild(el);
      const invalidArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(invalidArgs?.[0]).toEqual({ valueMissing: true });

      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      el.value = 'paris';
      const validArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(validArgs?.[0]).toEqual({});
    });
  });

  it('delegates checkValidity and reportValidity', () => {
    withPatchedInternals((stub) => {
      const el = makeCombobox();
      document.body.appendChild(el);
      expect(el.checkValidity()).toBe(true);
      expect(stub.checkValidity).toHaveBeenCalled();
      expect(el.reportValidity()).toBe(true);
      expect(stub.reportValidity).toHaveBeenCalled();
    });
  });

  it('exposes .validity and .validationMessage from internals', () => {
    withPatchedInternals((stub) => {
      const el = makeCombobox();
      document.body.appendChild(el);
      expect(el.validity).toBe(stub.validity);
      expect(el.validationMessage).toBe('stubbed message');
    });
  });

  it('exposes .form from internals when attached to a form', () => {
    withPatchedInternals((stub) => {
      const form = document.createElement('form');
      const el = makeCombobox();
      form.appendChild(el);
      document.body.appendChild(form);
      stub.form = form;
      expect(el.form).toBe(form);
    });
  });
});
