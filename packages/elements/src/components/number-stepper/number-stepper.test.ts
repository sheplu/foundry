import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FoundryNumberStepper } from './number-stepper.ts';

beforeAll(() => {
  FoundryNumberStepper.define();
});

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getInput(el: HTMLElement): HTMLInputElement {
  const inp = el.shadowRoot?.querySelector('input[part="input"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner input not found');
  return inp;
}

function getDec(el: HTMLElement): HTMLButtonElement {
  const b = el.shadowRoot?.querySelector('button[part="decrement"]');
  if (!(b instanceof HTMLButtonElement)) throw new Error('decrement button not found');
  return b;
}

function getInc(el: HTMLElement): HTMLButtonElement {
  const b = el.shadowRoot?.querySelector('button[part="increment"]');
  if (!(b instanceof HTMLButtonElement)) throw new Error('increment button not found');
  return b;
}

function makeStepper(): FoundryNumberStepper {
  return document.createElement('foundry-number-stepper') as FoundryNumberStepper;
}

function fireInput(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function keydown(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function realClick(button: HTMLButtonElement): void {
  // The component triggers increments on pointerdown (immediate first tick),
  // then stops the auto-repeat on pointerup. Click is only a keyboard
  // fallback. Simulate the full pointer sequence here.
  button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
  button.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0 }));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryNumberStepper.define', () => {
  it('registers the element and is idempotent', () => {
    expect(customElements.get('foundry-number-stepper')).toBeDefined();
    expect(() => FoundryNumberStepper.define()).not.toThrow();
  });
});

describe('<foundry-number-stepper> defaults', () => {
  it('has empty value and step=1 by default', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    expect(el.getAttribute('value') ?? '').toBe('');
    expect(el.getAttribute('step') ?? '1').toBe('1');
    expect(el.hasAttribute('required')).toBe(false);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('renders a spinbutton input + two buttons in shadow DOM', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.getAttribute('role')).toBe('spinbutton');
    expect(getDec(el)).toBeInstanceOf(HTMLButtonElement);
    expect(getInc(el)).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('<foundry-number-stepper> attribute reflection', () => {
  it('forwards name, placeholder, required, disabled, readonly to the input', () => {
    const el = makeStepper();
    el.setAttribute('name', 'qty');
    el.setAttribute('placeholder', 'Qty');
    el.setAttribute('required', '');
    el.setAttribute('disabled', '');
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.getAttribute('name')).toBe('qty');
    expect(inp.getAttribute('placeholder')).toBe('Qty');
    expect(inp.hasAttribute('required')).toBe(true);
    expect(inp.hasAttribute('disabled')).toBe(true);
    expect(inp.hasAttribute('readonly')).toBe(true);
  });

  it('reflects min / max onto aria-valuemin / aria-valuemax', () => {
    const el = makeStepper();
    el.setAttribute('min', '0');
    el.setAttribute('max', '10');
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.getAttribute('aria-valuemin')).toBe('0');
    expect(inp.getAttribute('aria-valuemax')).toBe('10');
  });

  it('omits aria-valuemin / aria-valuemax when bounds are unset', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.hasAttribute('aria-valuemin')).toBe(false);
    expect(inp.hasAttribute('aria-valuemax')).toBe(false);
  });

  it('sets aria-valuetext="empty" when value is empty', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    expect(getInput(el).getAttribute('aria-valuetext')).toBe('empty');
  });

  it('sets aria-valuenow when value is a number', () => {
    const el = makeStepper();
    el.setAttribute('value', '42');
    document.body.appendChild(el);
    expect(getInput(el).getAttribute('aria-valuenow')).toBe('42');
  });
});

describe('<foundry-number-stepper> increment / decrement buttons', () => {
  it('clicking + increments value by step and fires change source=increment', async () => {
    const el = makeStepper();
    el.setAttribute('value', '1');
    el.setAttribute('step', '1');
    document.body.appendChild(el);
    let detail: { value: string; source: string } | undefined;
    el.addEventListener('change', (event) => {
      detail = (event as CustomEvent<{ value: string; source: string }>).detail;
    });
    realClick(getInc(el));
    await raf();
    expect(el.getAttribute('value')).toBe('2');
    expect(detail).toEqual({ value: '2', source: 'increment' });
  });

  it('clicking − decrements value by step and fires change source=decrement', async () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    el.setAttribute('step', '2');
    document.body.appendChild(el);
    let detail: { value: string; source: string } | undefined;
    el.addEventListener('change', (event) => {
      detail = (event as CustomEvent<{ value: string; source: string }>).detail;
    });
    realClick(getDec(el));
    expect(el.getAttribute('value')).toBe('3');
    expect(detail).toEqual({ value: '3', source: 'decrement' });
  });

  it('disables + button at max and − button at min', () => {
    const el = makeStepper();
    el.setAttribute('value', '10');
    el.setAttribute('min', '0');
    el.setAttribute('max', '10');
    document.body.appendChild(el);
    expect(getInc(el).disabled).toBe(true);
    expect(getDec(el).disabled).toBe(false);
  });

  it('clamps increment past max', () => {
    const el = makeStepper();
    el.setAttribute('value', '9');
    el.setAttribute('step', '5');
    el.setAttribute('max', '10');
    document.body.appendChild(el);
    realClick(getInc(el));
    expect(el.getAttribute('value')).toBe('10');
    expect(getInc(el).disabled).toBe(true);
  });

  it('clamps decrement past min', () => {
    const el = makeStepper();
    el.setAttribute('value', '1');
    el.setAttribute('step', '5');
    el.setAttribute('min', '0');
    document.body.appendChild(el);
    realClick(getDec(el));
    expect(el.getAttribute('value')).toBe('0');
    expect(getDec(el).disabled).toBe(true);
  });

  it('formats result to step precision (float-safe)', () => {
    const el = makeStepper();
    el.setAttribute('value', '0.1');
    el.setAttribute('step', '0.1');
    document.body.appendChild(el);
    realClick(getInc(el));
    realClick(getInc(el));
    realClick(getInc(el));
    expect(el.getAttribute('value')).toBe('0.4');
  });

  it('does not act when host is disabled', () => {
    const el = makeStepper();
    el.setAttribute('value', '1');
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    realClick(getInc(el));
    expect(el.getAttribute('value')).toBe('1');
  });
});

describe('<foundry-number-stepper> keyboard handling', () => {
  it('ArrowUp increments by step', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    keydown(getInput(el), 'ArrowUp');
    expect(el.getAttribute('value')).toBe('6');
  });

  it('ArrowDown decrements by step', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    keydown(getInput(el), 'ArrowDown');
    expect(el.getAttribute('value')).toBe('4');
  });

  it('PageUp / PageDown move by 10×step', () => {
    const el = makeStepper();
    el.setAttribute('value', '50');
    el.setAttribute('step', '1');
    document.body.appendChild(el);
    keydown(getInput(el), 'PageUp');
    expect(el.getAttribute('value')).toBe('60');
    keydown(getInput(el), 'PageDown');
    expect(el.getAttribute('value')).toBe('50');
  });

  it('Home jumps to min when finite', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    el.setAttribute('min', '1');
    document.body.appendChild(el);
    keydown(getInput(el), 'Home');
    expect(el.getAttribute('value')).toBe('1');
  });

  it('End jumps to max when finite', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    el.setAttribute('max', '99');
    document.body.appendChild(el);
    keydown(getInput(el), 'End');
    expect(el.getAttribute('value')).toBe('99');
  });

  it('Home / End are no-ops when bounds are unset', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    keydown(getInput(el), 'Home');
    expect(el.getAttribute('value')).toBe('5');
    keydown(getInput(el), 'End');
    expect(el.getAttribute('value')).toBe('5');
  });

  it('keys are no-ops when readonly', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    el.setAttribute('readonly', '');
    document.body.appendChild(el);
    keydown(getInput(el), 'ArrowUp');
    expect(el.getAttribute('value')).toBe('5');
  });
});

describe('<foundry-number-stepper> typing + validity', () => {
  it('typing a numeric string updates value', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    fireInput(getInput(el), '42');
    expect(el.getAttribute('value')).toBe('42');
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('typing non-numeric text marks invalid via badInput', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    fireInput(getInput(el), 'foo');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('typing below min sets invalid', () => {
    const el = makeStepper();
    el.setAttribute('min', '10');
    document.body.appendChild(el);
    fireInput(getInput(el), '5');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('typing above max sets invalid', () => {
    const el = makeStepper();
    el.setAttribute('max', '10');
    document.body.appendChild(el);
    fireInput(getInput(el), '20');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('typing off-grid sets invalid via stepMismatch', () => {
    const el = makeStepper();
    el.setAttribute('step', '0.5');
    el.setAttribute('min', '0');
    document.body.appendChild(el);
    fireInput(getInput(el), '1.3');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('required + empty marks invalid (valueMissing); typing clears it', () => {
    const el = makeStepper();
    el.setAttribute('required', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    fireInput(getInput(el), '7');
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('blur snaps + clamps + formats typed value', () => {
    const el = makeStepper();
    el.setAttribute('step', '0.1');
    el.setAttribute('min', '0');
    el.setAttribute('max', '10');
    document.body.appendChild(el);
    const inp = getInput(el);
    fireInput(inp, '0.30000000000000004');
    inp.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(el.getAttribute('value')).toBe('0.3');
  });

  it('blur on empty input fires change with empty value', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    const inp = getInput(el);
    let detail: { value: string; source: string } | undefined;
    el.addEventListener('change', (event) => {
      detail = (event as CustomEvent<{ value: string; source: string }>).detail;
    });
    inp.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(detail).toEqual({ value: '', source: 'type' });
  });

  it('blur on non-numeric input keeps text + fires change with raw value', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    const inp = getInput(el);
    fireInput(inp, 'abc');
    let detail: { value: string; source: string } | undefined;
    el.addEventListener('change', (event) => {
      detail = (event as CustomEvent<{ value: string; source: string }>).detail;
    });
    inp.dispatchEvent(new Event('blur', { bubbles: true }));
    expect(detail).toEqual({ value: 'abc', source: 'type' });
    expect(inp.value).toBe('abc');
    expect(el.hasAttribute('invalid')).toBe(true);
  });
});

describe('<foundry-number-stepper> form association', () => {
  it('formResetCallback restores the initial value', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    fireInput(getInput(el), '12');
    el.formResetCallback();
    expect(el.getAttribute('value')).toBe('5');
    expect(getInput(el).value).toBe('5');
  });

  it('formStateRestoreCallback accepts a string', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    el.formStateRestoreCallback('99');
    expect(el.getAttribute('value')).toBe('99');
  });

  it('formStateRestoreCallback handles null', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    el.formStateRestoreCallback(null);
    expect(el.getAttribute('value') ?? '').toBe('');
  });

  it('formDisabledCallback toggles disabled', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    el.formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
    el.formDisabledCallback(false);
    expect(el.hasAttribute('disabled')).toBe(false);
  });
});

describe('<foundry-number-stepper> repeat (fake timers)', () => {
  it('starts a 400ms-then-80ms cadence on pointerdown and stops on pointerup', () => {
    vi.useFakeTimers();
    try {
      const el = makeStepper();
      el.setAttribute('value', '0');
      el.setAttribute('step', '1');
      document.body.appendChild(el);
      const inc = getInc(el);
      inc.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
      // Immediate first tick:
      expect(el.getAttribute('value')).toBe('1');
      // After the 400ms initial delay starts, then 80ms ticks:
      vi.advanceTimersByTime(400);
      vi.advanceTimersByTime(80);
      expect(el.getAttribute('value')).toBe('2');
      vi.advanceTimersByTime(80);
      expect(el.getAttribute('value')).toBe('3');
      // pointerup stops further ticks:
      inc.dispatchEvent(new PointerEvent('pointerup', { button: 0 }));
      vi.advanceTimersByTime(160);
      expect(el.getAttribute('value')).toBe('3');
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops the repeat timer when reaching max', () => {
    vi.useFakeTimers();
    try {
      const el = makeStepper();
      el.setAttribute('value', '0');
      el.setAttribute('step', '1');
      el.setAttribute('max', '2');
      document.body.appendChild(el);
      const inc = getInc(el);
      inc.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
      vi.advanceTimersByTime(400);
      vi.advanceTimersByTime(80); // value=2
      vi.advanceTimersByTime(80); // would be 3 — but capped + timer cleared
      expect(el.getAttribute('value')).toBe('2');
    } finally {
      vi.useRealTimers();
    }
  });

  it('disconnect clears any pending repeat timer', () => {
    vi.useFakeTimers();
    try {
      const el = makeStepper();
      el.setAttribute('value', '0');
      document.body.appendChild(el);
      getInc(el).dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
      el.remove();
      vi.advanceTimersByTime(2000);
      // Element is detached; still alive in JS but no further increments.
      expect(el.getAttribute('value')).toBe('1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores pointerdown on a disabled button', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    el.setAttribute('max', '5');
    document.body.appendChild(el);
    getInc(el).dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
    expect(el.getAttribute('value')).toBe('5');
  });

  it('ignores pointerdown from non-primary buttons', () => {
    const el = makeStepper();
    el.setAttribute('value', '0');
    document.body.appendChild(el);
    getInc(el).dispatchEvent(new PointerEvent('pointerdown', { button: 2 }));
    expect(el.getAttribute('value') ?? '').toBe('0');
  });

  it('stops the repeat timer when reaching min', () => {
    vi.useFakeTimers();
    try {
      const el = makeStepper();
      el.setAttribute('value', '2');
      el.setAttribute('step', '1');
      el.setAttribute('min', '0');
      document.body.appendChild(el);
      const dec = getDec(el);
      dec.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
      vi.advanceTimersByTime(400);
      vi.advanceTimersByTime(80); // value=0
      vi.advanceTimersByTime(80); // would be -1 but capped + timer cleared
      expect(el.getAttribute('value')).toBe('0');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('<foundry-number-stepper> keyboard activation of buttons', () => {
  it('synthetic click on increment (detail=0) increments', () => {
    const el = makeStepper();
    el.setAttribute('value', '1');
    document.body.appendChild(el);
    getInc(el).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(el.getAttribute('value')).toBe('2');
  });

  it('synthetic click on decrement (detail=0) decrements', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    getDec(el).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(el.getAttribute('value')).toBe('4');
  });

  it('synthetic click is a no-op when the button is disabled', () => {
    const el = makeStepper();
    el.setAttribute('value', '10');
    el.setAttribute('max', '10');
    document.body.appendChild(el);
    getInc(el).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));
    expect(el.getAttribute('value')).toBe('10');
  });

  it('real-click (detail > 0) on increment is a no-op (already handled by pointerdown)', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    getInc(el).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(el.getAttribute('value')).toBe('5');
  });

  it('real-click (detail > 0) on decrement is a no-op (already handled by pointerdown)', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    getDec(el).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
    expect(el.getAttribute('value')).toBe('5');
  });
});

describe('<foundry-number-stepper> property accessors', () => {
  it('focus() delegates to the inner input', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    el.focus();
    expect(el.shadowRoot?.activeElement).toBe(getInput(el));
  });

  it('checkValidity / reportValidity return true when ElementInternals is unavailable', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    expect(el.checkValidity()).toBe(true);
    expect(el.reportValidity()).toBe(true);
  });

  it('form returns null without a containing form', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    expect(el.form).toBe(null);
  });
});

describe('<foundry-number-stepper> propertyChanged edge cases', () => {
  it('ignores unknown property names', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    expect(() => el.propertyChanged('bogus')).not.toThrow();
  });

  it('toggling invalid resyncs aria-invalid on the inner input', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    expect(getInput(el).getAttribute('aria-invalid')).toBe('false');
    (el as unknown as { invalid: boolean }).invalid = true;
    expect(getInput(el).getAttribute('aria-invalid')).toBe('true');
  });

  it('changing min re-evaluates validity', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
    el.setAttribute('min', '10');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('changing max re-evaluates validity', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    el.setAttribute('max', '3');
    expect(el.hasAttribute('invalid')).toBe(true);
  });

  it('setting name after connect forwards onto the input', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    el.setAttribute('name', 'count');
    expect(getInput(el).getAttribute('name')).toBe('count');
  });

  it('setting placeholder after connect forwards onto the input', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    el.setAttribute('placeholder', 'Type…');
    expect(getInput(el).getAttribute('placeholder')).toBe('Type…');
  });

  it('setting readonly after connect forwards onto the input', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    el.setAttribute('readonly', '');
    expect(getInput(el).hasAttribute('readonly')).toBe(true);
  });

  it('setting required after connect re-evaluates validity', () => {
    const el = makeStepper();
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(false);
    el.setAttribute('required', '');
    expect(el.hasAttribute('invalid')).toBe(true);
  });
});

describe('<foundry-number-stepper> aria-describedby + slots', () => {
  it('helper slot wires aria-describedby to the helper id', () => {
    const el = makeStepper();
    el.innerHTML = '<span slot="helper">Between 0 and 10.</span>';
    document.body.appendChild(el);
    expect(getInput(el).getAttribute('aria-describedby')).toContain('hint');
  });

  it('error slot + invalid wires aria-errormessage and aria-describedby', () => {
    const el = makeStepper();
    el.setAttribute('value', '20');
    el.setAttribute('max', '10');
    el.innerHTML = '<span slot="error">Out of range.</span>';
    document.body.appendChild(el);
    expect(el.hasAttribute('invalid')).toBe(true);
    const inp = getInput(el);
    expect(inp.getAttribute('aria-errormessage')).toBe('err');
    expect(inp.getAttribute('aria-describedby')).toContain('err');
  });
});

describe('<foundry-number-stepper> repeat boundary edge cases', () => {
  it('ignores pointerdown on a disabled decrement button', () => {
    const el = makeStepper();
    el.setAttribute('value', '0');
    el.setAttribute('min', '0');
    document.body.appendChild(el);
    getDec(el).dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
    expect(el.getAttribute('value')).toBe('0');
  });

  it('ignores pointerdown from non-primary buttons on decrement', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    getDec(el).dispatchEvent(new PointerEvent('pointerdown', { button: 2 }));
    expect(el.getAttribute('value')).toBe('5');
  });

  it('auto-repeat starting from an empty value seeds from min', () => {
    vi.useFakeTimers();
    try {
      const el = makeStepper();
      el.setAttribute('min', '0');
      el.setAttribute('max', '5');
      document.body.appendChild(el);
      const inc = getInc(el);
      // value is empty; first tick increments from base=min → 1.
      inc.dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
      expect(el.getAttribute('value')).toBe('1');
      vi.advanceTimersByTime(400);
      vi.advanceTimersByTime(80);
      expect(el.getAttribute('value')).toBe('2');
      inc.dispatchEvent(new PointerEvent('pointerup', { button: 0 }));
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not re-emit when applyDelta lands on the same value (already at max)', () => {
    const el = makeStepper();
    el.setAttribute('value', '10');
    el.setAttribute('max', '10');
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener('change', () => {
      fired = true;
    });
    // Force a delta when already at max — applyDelta short-circuits.
    getInc(el).dispatchEvent(new PointerEvent('pointerdown', { button: 0 }));
    expect(fired).toBe(false);
    expect(el.getAttribute('value')).toBe('10');
  });

  it('value setter to the same string is a no-op on the inner input', () => {
    const el = makeStepper();
    el.setAttribute('value', '5');
    document.body.appendChild(el);
    const inp = getInput(el);
    expect(inp.value).toBe('5');
    el.setAttribute('value', '5');
    expect(inp.value).toBe('5');
  });
});
