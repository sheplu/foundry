import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FoundryDatePicker } from './date-picker.ts';

beforeAll(() => {
  FoundryDatePicker.define();
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

function getSurface(el: HTMLElement): HTMLElement {
  const s = el.shadowRoot?.querySelector('[part="surface"]');
  if (!(s instanceof HTMLElement)) throw new Error('surface not found');
  return s;
}

function getGrid(el: HTMLElement): HTMLElement {
  const g = el.shadowRoot?.querySelector('[part="grid"]');
  if (!(g instanceof HTMLElement)) throw new Error('grid not found');
  return g;
}

function getCells(el: HTMLElement): HTMLButtonElement[] {
  return Array.from(getGrid(el).querySelectorAll<HTMLButtonElement>('[part="cell"]'));
}

function getCellByISO(el: HTMLElement, iso: string): HTMLButtonElement | null {
  return getGrid(el).querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
}

function getMonthLabel(el: HTMLElement): HTMLElement {
  const m = el.shadowRoot?.querySelector('[part="month-label"]');
  if (!(m instanceof HTMLElement)) throw new Error('month label not found');
  return m;
}

function getPrev(el: HTMLElement): HTMLButtonElement {
  const b = el.shadowRoot?.querySelector('[part="prev"]');
  if (!(b instanceof HTMLButtonElement)) throw new Error('prev not found');
  return b;
}

function getNext(el: HTMLElement): HTMLButtonElement {
  const b = el.shadowRoot?.querySelector('[part="next"]');
  if (!(b instanceof HTMLButtonElement)) throw new Error('next not found');
  return b;
}

function makeDatePicker(): FoundryDatePicker {
  return document.createElement('foundry-date-picker') as FoundryDatePicker;
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

describe('FoundryDatePicker.define', () => {
  it('is idempotent when called with the default tag', () => {
    expect(() => FoundryDatePicker.define()).not.toThrow();
    expect(customElements.get('foundry-date-picker')).toBe(FoundryDatePicker);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-date-picker-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryDatePicker.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryDatePicker defaults', () => {
  it('declares formAssociated', () => {
    expect(FoundryDatePicker.formAssociated).toBe(true);
  });

  it('defaults value to empty, open + invalid to false', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect((el as unknown as { value: string }).value).toBe('');
    expect(el.hasAttribute('open')).toBe(false);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('forwards name, placeholder, readonly onto the inner input', () => {
    const el = makeDatePicker();
    el.setAttribute('name', 'dob');
    el.setAttribute('placeholder', 'yyyy-mm-dd');
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.getAttribute('name')).toBe('dob');
    expect(inp.getAttribute('placeholder')).toBe('yyyy-mm-dd');
    expect(inp.hasAttribute('readonly')).toBe(true);
  });

  it('forwards initial value attribute onto the inner input', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    expect(getInput(el).value).toBe('2026-05-19');
  });

  it('does not reflect placeholder/name when empty', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(getInput(el).hasAttribute('name')).toBe(false);
  });

  it('updating placeholder at runtime re-forwards', () => {
    const el = makeDatePicker() as FoundryDatePicker & { placeholder: string };
    document.body.appendChild(el);
    el.placeholder = 'pick a date';
    expect(getInput(el).getAttribute('placeholder')).toBe('pick a date');
    el.placeholder = '';
    expect(getInput(el).hasAttribute('placeholder')).toBe(false);
  });
});

describe('FoundryDatePicker grid render', () => {
  it('renders 42 cells', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    expect(getCells(el)).toHaveLength(42);
  });

  it('shows month + year label for current value', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    expect(getMonthLabel(el).textContent).toMatch(/2026/);
  });

  it('marks selected cell with aria-selected="true"', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    const cell = getCellByISO(el, '2026-05-19');
    expect(cell?.getAttribute('aria-selected')).toBe('true');
  });

  it('marks cells outside min/max as aria-disabled="true"', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    el.setAttribute('min', '2026-05-10');
    el.setAttribute('max', '2026-05-25');
    document.body.appendChild(el);
    expect(getCellByISO(el, '2026-05-09')?.getAttribute('aria-disabled')).toBe('true');
    expect(getCellByISO(el, '2026-05-15')?.getAttribute('aria-disabled')).toBe('false');
    expect(getCellByISO(el, '2026-05-26')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('marks today with aria-current="date"', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(getCellByISO(el, iso)?.getAttribute('aria-current')).toBe('date');
  });

  it('marks prev/next month days with data-outside="true"', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    const cells = getCells(el);
    const outside = cells.filter((c) => c.dataset['outside'] === 'true');
    expect(outside.length).toBeGreaterThan(0);
  });
});

describe('FoundryDatePicker prev/next nav', () => {
  it('clicking prev shifts viewMonth -1 without committing', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    getPrev(el).click();
    expect(getMonthLabel(el).textContent).toMatch(/April|Apr/);
    expect((el as unknown as { value: string }).value).toBe('2026-05-19');
  });

  it('clicking next shifts viewMonth +1 without committing', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    getNext(el).click();
    expect(getMonthLabel(el).textContent).toMatch(/June|Jun/);
    expect((el as unknown as { value: string }).value).toBe('2026-05-19');
  });

  it('next across December rolls to January next year', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-12-15');
    document.body.appendChild(el);
    getNext(el).click();
    expect(getMonthLabel(el).textContent).toMatch(/2027/);
  });
});

describe('FoundryDatePicker grid click commit', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('clicking an enabled day commits + closes + fires change', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    el.show();
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    getCellByISO(el, '2026-05-22')?.click();
    expect(fired).toEqual({ value: '2026-05-22', source: 'pick' });
    expect((el as unknown as { value: string }).value).toBe('2026-05-22');
    expect(getInput(el).value).toBe('2026-05-22');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('clicking a disabled (out-of-range) cell is a no-op', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    el.setAttribute('min', '2026-05-15');
    document.body.appendChild(el);
    el.show();
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getCellByISO(el, '2026-05-10')?.click();
    expect(fired).toBe(0);
    expect((el as unknown as { value: string }).value).toBe('2026-05-19');
  });

  it('clicking grid background (not a cell) is ignored', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    el.show();
    getGrid(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(el.hasAttribute('open')).toBe(true);
  });
});

describe('FoundryDatePicker grid keyboard', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  function open(value = '2026-05-19'): FoundryDatePicker {
    const el = makeDatePicker();
    el.setAttribute('value', value);
    document.body.appendChild(el);
    el.show();
    return el;
  }

  it('ArrowRight moves active +1 day', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'ArrowRight');
    expect(getCellByISO(el, '2026-05-20')?.tabIndex).toBe(0);
  });

  it('ArrowLeft moves active -1 day', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'ArrowLeft');
    expect(getCellByISO(el, '2026-05-18')?.tabIndex).toBe(0);
  });

  it('ArrowDown moves active +7 days (next week)', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'ArrowDown');
    expect(getCellByISO(el, '2026-05-26')?.tabIndex).toBe(0);
  });

  it('ArrowUp moves active -7 days', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'ArrowUp');
    expect(getCellByISO(el, '2026-05-12')?.tabIndex).toBe(0);
  });

  it('PageDown moves active +1 month', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'PageDown');
    expect(getMonthLabel(el).textContent).toMatch(/June|Jun/);
  });

  it('PageUp moves active -1 month', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'PageUp');
    expect(getMonthLabel(el).textContent).toMatch(/April|Apr/);
  });

  it('Shift+PageDown moves active +1 year', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'PageDown', { shiftKey: true });
    expect(getMonthLabel(el).textContent).toMatch(/2027/);
  });

  it('Shift+PageUp moves active -1 year', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'PageUp', { shiftKey: true });
    expect(getMonthLabel(el).textContent).toMatch(/2025/);
  });

  it('Home jumps to start of week', () => {
    const el = open('2026-05-21'); // Thursday
    keydown(getGrid(el), 'Home');
    // For weekStart=0 (Sunday) start = 2026-05-17; weekStart=1 (Monday) = 2026-05-18.
    const isSunday = getCellByISO(el, '2026-05-17')?.tabIndex === 0;
    const isMonday = getCellByISO(el, '2026-05-18')?.tabIndex === 0;
    expect(isSunday || isMonday).toBe(true);
  });

  it('End jumps to end of week', () => {
    const el = open('2026-05-21'); // Thursday
    keydown(getGrid(el), 'End');
    const isSat = getCellByISO(el, '2026-05-23')?.tabIndex === 0;
    const isSun = getCellByISO(el, '2026-05-24')?.tabIndex === 0;
    expect(isSat || isSun).toBe(true);
  });

  it('Enter commits active and closes', () => {
    const el = open('2026-05-19');
    keydown(getGrid(el), 'ArrowRight'); // active = 2026-05-20
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    keydown(getGrid(el), 'Enter');
    expect(fired).toEqual({ value: '2026-05-20', source: 'pick' });
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('Space commits active', () => {
    const el = open('2026-05-19');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    keydown(getGrid(el), ' ');
    expect(fired?.value).toBe('2026-05-19');
  });

  it('Escape closes without committing', () => {
    const el = open('2026-05-19');
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    keydown(getGrid(el), 'Escape');
    expect(fired).toBe(0);
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('Enter on out-of-range active is a no-op', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    el.setAttribute('max', '2026-05-19');
    document.body.appendChild(el);
    el.show();
    keydown(getGrid(el), 'ArrowRight'); // active = 2026-05-20 (out of range)
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    keydown(getGrid(el), 'Enter');
    expect(fired).toBe(0);
  });

  it('unhandled key in grid is ignored', () => {
    const el = open('2026-05-19');
    expect(() => keydown(getGrid(el), 'a')).not.toThrow();
    expect(getCellByISO(el, '2026-05-19')?.tabIndex).toBe(0);
  });
});

describe('FoundryDatePicker input typing', () => {
  it('typing a valid in-range ISO updates value + viewMonth', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    fireInput(getInput(el), '2026-05-19');
    expect((el as unknown as { value: string }).value).toBe('2026-05-19');
    expect(getMonthLabel(el).textContent).toMatch(/2026/);
  });

  it('typing an unparseable string sets invalid (badInput)', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    fireInput(getInput(el), 'foo');
    expect(el.hasAttribute('invalid')).toBe(true);
    expect((el as unknown as { value: string }).value).toBe('');
  });

  it('typing < min sets invalid', () => {
    const el = makeDatePicker();
    el.setAttribute('min', '2026-05-10');
    document.body.appendChild(el);
    fireInput(getInput(el), '2026-05-05');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('typing > max sets invalid', () => {
    const el = makeDatePicker();
    el.setAttribute('max', '2026-05-20');
    document.body.appendChild(el);
    fireInput(getInput(el), '2026-05-25');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('typing fires input on the host', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    let inputs = 0;
    el.addEventListener('input', () => {
      inputs += 1;
    });
    fireInput(getInput(el), '2');
    expect(inputs).toBe(1);
  });
});

describe('FoundryDatePicker input keyboard', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('ArrowDown on input opens the popover', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    const event = keydown(getInput(el), 'ArrowDown');
    expect(el.hasAttribute('open')).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('Enter on closed input commits typed free-text (source=enter)', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    fireInput(getInput(el), '2026-05-19');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    keydown(getInput(el), 'Enter');
    expect(fired).toEqual({ value: '2026-05-19', source: 'enter' });
  });

  it('Escape on open input closes', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    el.show();
    keydown(getInput(el), 'Escape');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('disabled input ignores keyboard', () => {
    const el = makeDatePicker();
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    keydown(getInput(el), 'ArrowDown');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('readonly input ignores keyboard', () => {
    const el = makeDatePicker();
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    keydown(getInput(el), 'ArrowDown');
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('unrelated key on closed input is ignored', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(() => keydown(getInput(el), 'a')).not.toThrow();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('unrelated key on open input is ignored', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    el.show();
    expect(() => keydown(getInput(el), 'a')).not.toThrow();
    expect(el.hasAttribute('open')).toBe(true);
  });
});

describe('FoundryDatePicker blur commit', () => {
  it('blur with a valid typed date fires change with source=blur', async () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    fireInput(getInput(el), '2026-05-19');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toEqual({ value: '2026-05-19', source: 'blur' });
  });

  it('blur with same value does not fire change', async () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(0);
  });

  it('blur with empty input clears value when previously committed', async () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    fireInput(getInput(el), '');
    let fired: { value: string; source: string } | undefined;
    el.addEventListener('change', (e) => {
      fired = (e as CustomEvent<{ value: string; source: string }>).detail;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toEqual({ value: '', source: 'blur' });
    expect((el as unknown as { value: string }).value).toBe('');
  });

  it('blur with unparseable text does not commit', async () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    fireInput(getInput(el), 'foo');
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(0);
  });

  it('blur with empty typed text and no prior commit does not fire change', async () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(0);
  });

  it('blur with same valid date as last commit does not re-fire change', async () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    fireInput(getInput(el), '2026-05-19');
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(1);
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(1);
  });

  it('blur with out-of-range typed text does not commit', async () => {
    const el = makeDatePicker();
    el.setAttribute('max', '2026-05-19');
    document.body.appendChild(el);
    fireInput(getInput(el), '2026-06-01');
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    getInput(el).dispatchEvent(new FocusEvent('blur'));
    await flush();
    expect(fired).toBe(0);
  });
});

describe('FoundryDatePicker required + validity', () => {
  it('required + empty marks the host invalid', () => {
    const el = makeDatePicker();
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    expect(getInput(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('required + value-set clears invalid', () => {
    const el = makeDatePicker();
    el.setAttribute('required', '');
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('non-required + empty is not invalid', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('toggling required recomputes validity', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
    (el as unknown as { required: boolean }).required = true;
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('changing min recomputes validity', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
    (el as unknown as { min: string }).min = '2026-06-01';
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('changing max recomputes validity', () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    (el as unknown as { max: string }).max = '2026-04-01';
    expect(el.hasAttribute('invalid')).toBe(true);
  });
});

describe('FoundryDatePicker form lifecycle', () => {
  it('formResetCallback restores the initial value attribute', () => {
    const el = makeDatePicker() as FoundryDatePicker & {
      value: string;
      formResetCallback: () => void;
    };
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    el.value = '2026-06-01';
    el.formResetCallback();
    expect((el as unknown as { value: string }).value).toBe('2026-05-19');
    expect(getInput(el).value).toBe('2026-05-19');
  });

  it('formResetCallback resets to empty when no initial value', () => {
    const el = makeDatePicker() as FoundryDatePicker & {
      value: string;
      formResetCallback: () => void;
    };
    document.body.appendChild(el);
    el.value = '2026-05-19';
    el.formResetCallback();
    expect((el as unknown as { value: string }).value).toBe('');
  });

  it('formDisabledCallback reflects disabled', () => {
    const el = makeDatePicker() as FoundryDatePicker & {
      formDisabledCallback: (d: boolean) => void;
    };
    document.body.appendChild(el);
    el.formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
    expect(getInput(el).hasAttribute('disabled')).toBe(true);
  });

  it('formStateRestoreCallback restores value', () => {
    const el = makeDatePicker() as FoundryDatePicker & {
      formStateRestoreCallback: (s: string | null) => void;
    };
    document.body.appendChild(el);
    el.formStateRestoreCallback('2026-05-19');
    expect((el as unknown as { value: string }).value).toBe('2026-05-19');
    el.formStateRestoreCallback(null);
    expect((el as unknown as { value: string }).value).toBe('');
  });
});

describe('FoundryDatePicker accessors + focus', () => {
  it('exposes .form as null when not in a form', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(el.form).toBe(null);
  });

  it('checkValidity / reportValidity fall back to true when internals unavailable', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(el.checkValidity()).toBe(true);
    expect(el.reportValidity()).toBe(true);
  });

  it('validationMessage falls back to the cached message when internals unavailable', () => {
    const el = makeDatePicker();
    el.setAttribute('required', '');
    document.body.appendChild(el);
    // jsdom internals.validationMessage is empty; we cache the message ourselves.
    expect(el.validationMessage).toBe('Please fill out this field.');
  });

  it('delegates focus() to the inner input', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    let focused = false;
    getInput(el).addEventListener('focus', () => {
      focused = true;
    });
    el.focus();
    expect(focused).toBe(true);
  });
});

describe('FoundryDatePicker slot reflection', () => {
  it('reflects has-label when label slot has content', async () => {
    const el = makeDatePicker();
    el.innerHTML = '<span slot="label">DOB</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(true);
  });

  it('reflects has-helper when helper slot has content + wires aria-describedby', async () => {
    const el = makeDatePicker();
    el.innerHTML = '<span slot="helper">Format YYYY-MM-DD</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-helper')).toBe(true);
    expect(getInput(el).getAttribute('aria-describedby')).toBe('hint');
  });

  it('reflects has-error when error slot has content', async () => {
    const el = makeDatePicker();
    el.innerHTML = '<span slot="error">Invalid</span>';
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-error')).toBe(true);
  });

  it('wires aria-errormessage when invalid + has-error', async () => {
    const el = makeDatePicker();
    el.setAttribute('required', '');
    el.innerHTML = '<span slot="error">Required</span>';
    document.body.appendChild(el);
    await raf();
    expect(getInput(el).getAttribute('aria-errormessage')).toBe('err');
  });
});

describe('FoundryDatePicker ARIA wiring', () => {
  it('input carries combobox role + aria-haspopup=dialog', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.getAttribute('role')).toBe('combobox');
    expect(inp.getAttribute('aria-haspopup')).toBe('dialog');
    expect(inp.getAttribute('aria-expanded')).toBe('false');
  });

  it('surface has role=dialog + popover=auto + a stable id', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    const surface = getSurface(el);
    expect(surface.getAttribute('role')).toBe('dialog');
    expect(surface.getAttribute('popover')).toBe('auto');
    expect(surface.id).toMatch(/^foundry-date-picker-\d+-dialog$/);
    expect(getInput(el).getAttribute('aria-controls')).toBe(surface.id);
    expect(surface.getAttribute('aria-labelledby')).toMatch(/^foundry-date-picker-\d+-month$/);
  });

  it('grid has role=grid + aria-labelledby pointing at month label', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    const grid = getGrid(el);
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-labelledby')).toMatch(/^foundry-date-picker-\d+-month$/);
  });
});

describe('FoundryDatePicker open/close', () => {
  let uninstall: () => void;
  beforeAll(() => {
    uninstall = installPopoverShim();
  });
  afterAll(() => {
    uninstall();
  });

  it('show() opens; hide() closes', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
    expect(getInput(el).getAttribute('aria-expanded')).toBe('true');
    el.hide();
    expect(el.hasAttribute('open')).toBe(false);
    expect(getInput(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('show() is idempotent', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    el.show();
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('hide() while closed is a no-op', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(() => el.hide()).not.toThrow();
  });

  it('show() while disabled is a no-op', () => {
    const el = makeDatePicker();
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('show() while readonly is a no-op', () => {
    const el = makeDatePicker();
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('disabling while open closes the popover', () => {
    const el = makeDatePicker() as FoundryDatePicker & { disabled: boolean };
    document.body.appendChild(el);
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
    el.disabled = true;
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('focus on the input does not auto-open after a commit', async () => {
    const el = makeDatePicker();
    el.setAttribute('value', '2026-05-19');
    document.body.appendChild(el);
    el.show();
    getCellByISO(el, '2026-05-22')?.click();
    await flush();
    // After commit, hide() ran and we suppressed the next focus open.
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryDatePicker propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    expect(() => {
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null);
    }).not.toThrow();
  });

  it('writing the value property programmatically syncs to the input', () => {
    const el = makeDatePicker() as FoundryDatePicker & { value: string };
    document.body.appendChild(el);
    el.value = '2026-05-19';
    expect(getInput(el).value).toBe('2026-05-19');
  });
});

describe('FoundryDatePicker disconnected cleanup', () => {
  it('does not throw when disconnected + reconnected', async () => {
    const el = makeDatePicker();
    document.body.appendChild(el);
    await raf();
    const parent = el.parentElement as HTMLElement;
    parent.removeChild(el);
    expect(() => parent.appendChild(el)).not.toThrow();
  });
});

describe('FoundryDatePicker with patched ElementInternals', () => {
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
      const el = makeDatePicker();
      document.body.appendChild(el);
      expect(stub.setFormValue).toHaveBeenCalledWith(null);
    });
  });

  it('calls setFormValue with typed text on every keystroke (mid-type capture)', () => {
    withPatchedInternals((stub) => {
      const el = makeDatePicker();
      document.body.appendChild(el);
      (stub.setFormValue as ReturnType<typeof vi.fn>).mockClear();
      fireInput(getInput(el), '2026-05');
      expect(stub.setFormValue).toHaveBeenCalledWith('2026-05');
    });
  });

  it('exercises setValidity for valueMissing, badInput, rangeUnderflow, rangeOverflow, valid', () => {
    withPatchedInternals((stub) => {
      const el = makeDatePicker() as FoundryDatePicker & {
        value: string;
        min: string;
        max: string;
      };
      el.setAttribute('required', '');
      el.setAttribute('min', '2026-05-01');
      el.setAttribute('max', '2026-05-31');
      document.body.appendChild(el);
      // valueMissing
      const missingArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(missingArgs?.[0]).toEqual({ valueMissing: true });

      // badInput
      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      fireInput(getInput(el), 'nonsense');
      const badArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(badArgs?.[0]).toEqual({ badInput: true });

      // rangeUnderflow
      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      fireInput(getInput(el), '2026-05-19');
      el.value = '2026-04-01';
      const underflow = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(underflow?.[0]).toEqual({ rangeUnderflow: true });

      // rangeOverflow
      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      el.value = '2026-06-01';
      const overflow = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(overflow?.[0]).toEqual({ rangeOverflow: true });

      // valid
      (stub.setValidity as ReturnType<typeof vi.fn>).mockClear();
      el.value = '2026-05-19';
      const validArgs = (stub.setValidity as ReturnType<typeof vi.fn>).mock.calls.at(-1);
      expect(validArgs?.[0]).toEqual({});
    });
  });

  it('delegates checkValidity and reportValidity', () => {
    withPatchedInternals((stub) => {
      const el = makeDatePicker();
      document.body.appendChild(el);
      expect(el.checkValidity()).toBe(true);
      expect(stub.checkValidity).toHaveBeenCalled();
      expect(el.reportValidity()).toBe(true);
      expect(stub.reportValidity).toHaveBeenCalled();
    });
  });

  it('exposes .validity and .validationMessage from internals', () => {
    withPatchedInternals((stub) => {
      const el = makeDatePicker();
      document.body.appendChild(el);
      expect(el.validity).toBe(stub.validity);
      expect(el.validationMessage).toBe('stubbed message');
    });
  });

  it('exposes .form from internals when attached to a form', () => {
    withPatchedInternals((stub) => {
      const form = document.createElement('form');
      const el = makeDatePicker();
      form.appendChild(el);
      document.body.appendChild(form);
      stub.form = form;
      expect(el.form).toBe(form);
    });
  });
});
