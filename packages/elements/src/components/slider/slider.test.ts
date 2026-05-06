import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundrySlider } from './slider.ts';

beforeAll(() => {
  FoundrySlider.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-slider-test-${++counter}`;
  class Sub extends FoundrySlider {}
  customElements.define(tag, Sub);
  return { tag };
}

function makeSlider(attrs: Record<string, string> = {}): FoundrySlider {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundrySlider;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
}

function innerInput(el: FoundrySlider): HTMLInputElement {
  const inp = el.shadowRoot?.querySelector('input');
  if (!inp) throw new Error('no input');
  return inp;
}

function fillEl(el: FoundrySlider): HTMLElement {
  const f = el.shadowRoot?.querySelector('[part="fill"]');
  if (!(f instanceof HTMLElement)) throw new Error('no fill');
  return f;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundrySlider.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-slider')).toBe(FoundrySlider);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-slider-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundrySlider.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundrySlider — form association', () => {
  it('declares formAssociated for the custom element registry', () => {
    expect(FoundrySlider.formAssociated).toBe(true);
  });
});

describe('FoundrySlider defaults', () => {
  it('defaults value=0, min=0, max=100, step=1, label="Slider"', () => {
    const el = makeSlider();
    expect((el as unknown as { value: number }).value).toBe(0);
    expect((el as unknown as { min: number }).min).toBe(0);
    expect((el as unknown as { max: number }).max).toBe(100);
    expect((el as unknown as { step: number }).step).toBe(1);
    expect((el as unknown as { label: string }).label).toBe('Slider');
  });

  it('defaults boolean flags to false', () => {
    const el = makeSlider();
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('required')).toBe(false);
  });
});

describe('FoundrySlider rendering', () => {
  it('renders track + fill + input in shadow DOM', () => {
    const el = makeSlider();
    expect(el.shadowRoot?.querySelector('[part="track"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="fill"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="input"]')).toBeTruthy();
  });

  it('inner input is type=range', () => {
    const el = makeSlider();
    expect(innerInput(el).type).toBe('range');
  });

  it('inner input carries aria-label from label attr', () => {
    const el = makeSlider({ label: 'Volume' });
    expect(innerInput(el).getAttribute('aria-label')).toBe('Volume');
  });

  it('fills the track to the correct percentage for value=40 in [0,100]', () => {
    const el = makeSlider({ value: '40' });
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('40%');
  });

  it('fills 50% for value=0 when range is [-50, 50]', () => {
    const el = makeSlider({ min: '-50', max: '50', value: '0' });
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('50%');
  });

  it('fills 0% when min equals max (zero-range fallback)', () => {
    const el = makeSlider({ min: '10', max: '10', value: '10' });
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('0%');
  });

  it('sets aria-valuetext from value-label attr', () => {
    const el = makeSlider({ value: '40', 'value-label': 'Volume' });
    expect(el.getAttribute('aria-valuetext')).toBe('Volume 40');
  });

  it('does not set aria-valuetext when value-label absent', () => {
    const el = makeSlider({ value: '40' });
    expect(el.hasAttribute('aria-valuetext')).toBe(false);
  });

  it('removes aria-valuetext when value-label is cleared', () => {
    const el = makeSlider({ value: '40', 'value-label': 'Volume' });
    expect(el.hasAttribute('aria-valuetext')).toBe(true);
    el.removeAttribute('value-label');
    expect(el.hasAttribute('aria-valuetext')).toBe(false);
  });
});

describe('FoundrySlider attribute forwarding', () => {
  it('forwards min, max, step, name onto the inner input', () => {
    const el = makeSlider({
      min: '-5',
      max: '5',
      step: '0.5',
      name: 'volume',
    });
    const inp = innerInput(el);
    expect(inp.getAttribute('min')).toBe('-5');
    expect(inp.getAttribute('max')).toBe('5');
    expect(inp.getAttribute('step')).toBe('0.5');
    expect(inp.getAttribute('name')).toBe('volume');
  });

  it('forwards disabled as a boolean attribute', () => {
    const el = makeSlider({ disabled: '' });
    expect(innerInput(el).hasAttribute('disabled')).toBe(true);
  });

  it('forwards required as a boolean attribute', () => {
    const el = makeSlider({ required: '' });
    expect(innerInput(el).hasAttribute('required')).toBe(true);
  });

  it('removes a boolean attribute when unset', () => {
    const el = makeSlider({ disabled: '' });
    expect(innerInput(el).hasAttribute('disabled')).toBe(true);
    el.removeAttribute('disabled');
    expect(innerInput(el).hasAttribute('disabled')).toBe(false);
  });

  it('re-forwards when min/max/step change after connect', () => {
    const el = makeSlider({ min: '0', max: '100' });
    (el as unknown as { max: number }).max = 200;
    expect(innerInput(el).getAttribute('max')).toBe('200');
  });

  it('removes empty-string attributes from the inner input', () => {
    const el = makeSlider({ name: 'x' });
    expect(innerInput(el).getAttribute('name')).toBe('x');
    (el as unknown as { name: string }).name = '';
    expect(innerInput(el).hasAttribute('name')).toBe(false);
  });
});

describe('FoundrySlider — value coercion', () => {
  it('non-finite value falls back to 0 in the fill calculation', () => {
    const el = makeSlider({ value: '50' });
    // Force a non-finite value via direct property assignment — attribute
    // coercion filters NaN to null before property writes.
    (el as unknown as { value: number }).value = Number.NaN;
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('0%');
  });

  it('non-finite label falls back to default "Slider"', () => {
    const el = makeSlider();
    // Clear label by assigning an empty string.
    (el as unknown as { label: string }).label = '';
    expect(innerInput(el).getAttribute('aria-label')).toBe('Slider');
  });

  it('clamps fill percentage when value exceeds max', () => {
    const el = makeSlider({ min: '0', max: '100', value: '80' });
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('80%');
    // Programmatic value above max — native input clamps to max=100.
    (el as unknown as { value: number }).value = 200;
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('100%');
  });

  it('clamps fill percentage when value falls below min', () => {
    const el = makeSlider({ min: '0', max: '100', value: '20' });
    (el as unknown as { value: number }).value = -50;
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('0%');
  });
});

describe('FoundrySlider — events', () => {
  it('re-dispatches input event on the host', () => {
    const el = makeSlider({ value: '10' });
    let received = 0;
    el.addEventListener('input', () => {
      received += 1;
    });
    const inp = innerInput(el);
    inp.value = '42';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    expect(received).toBe(1);
    expect((el as unknown as { value: number }).value).toBe(42);
  });

  it('re-dispatches change event on the host', () => {
    const el = makeSlider({ value: '10' });
    let received = 0;
    el.addEventListener('change', () => {
      received += 1;
    });
    innerInput(el).dispatchEvent(new Event('change', { bubbles: true }));
    expect(received).toBe(1);
  });

  it('input listener handles non-finite inner-input values by coercing to default', () => {
    const el = makeSlider({ value: '20' });
    const inp = innerInput(el);
    // Force an invalid value on the input, then fire input.
    Object.defineProperty(inp, 'value', {
      configurable: true,
      get: () => 'not-a-number',
    });
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    expect((el as unknown as { value: number }).value).toBe(0);
  });
});

describe('FoundrySlider — label sync', () => {
  it('defaults aria-label to "Slider" when label attr absent', () => {
    const el = makeSlider();
    expect(innerInput(el).getAttribute('aria-label')).toBe('Slider');
  });

  it('updates aria-label when label attribute changes', () => {
    const el = makeSlider({ label: 'A' });
    expect(innerInput(el).getAttribute('aria-label')).toBe('A');
    el.setAttribute('label', 'B');
    expect(innerInput(el).getAttribute('aria-label')).toBe('B');
  });
});

describe('FoundrySlider — form callbacks', () => {
  it('formResetCallback resets value to default', () => {
    const el = makeSlider({ value: '42' });
    expect((el as unknown as { value: number }).value).toBe(42);
    (el as unknown as { formResetCallback: () => void }).formResetCallback();
    expect((el as unknown as { value: number }).value).toBe(0);
    expect(innerInput(el).value).toBe('0');
  });

  it('formDisabledCallback sets the disabled property', () => {
    const el = makeSlider();
    expect(el.hasAttribute('disabled')).toBe(false);
    (el as unknown as { formDisabledCallback: (d: boolean) => void })
      .formDisabledCallback(true);
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('formStateRestoreCallback restores a numeric value', () => {
    const el = makeSlider();
    (el as unknown as { formStateRestoreCallback: (s: string | null) => void })
      .formStateRestoreCallback('77');
    expect((el as unknown as { value: number }).value).toBe(77);
  });

  it('formStateRestoreCallback coerces invalid state to default', () => {
    const el = makeSlider({ value: '20' });
    (el as unknown as { formStateRestoreCallback: (s: string | null) => void })
      .formStateRestoreCallback('nope');
    expect((el as unknown as { value: number }).value).toBe(0);
  });
});

describe('FoundrySlider — validity delegation', () => {
  it('checkValidity returns true by default', () => {
    const el = makeSlider();
    expect(el.checkValidity()).toBe(true);
  });

  it('reportValidity returns true by default', () => {
    const el = makeSlider();
    expect(el.reportValidity()).toBe(true);
  });

  it('exposes validity from internals or inner input', () => {
    const el = makeSlider();
    expect(el.validity).toBeDefined();
  });

  it('exposes validationMessage as a string', () => {
    const el = makeSlider();
    expect(typeof el.validationMessage).toBe('string');
  });

  it('form getter returns null when not in a form', () => {
    const el = makeSlider();
    expect(el.form).toBeNull();
  });
});

describe('FoundrySlider — focus delegation', () => {
  it('focus() delegates to the inner input', () => {
    const el = makeSlider();
    el.focus();
    expect(el.shadowRoot?.activeElement).toBe(innerInput(el));
  });
});

describe('FoundrySlider — propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makeSlider({ value: '30' });
    const before = fillEl(el).style.getPropertyValue('--_fill');
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe(before);
  });
});

describe('FoundrySlider — re-renders on attribute changes', () => {
  it('changing value updates the fill', () => {
    const el = makeSlider({ value: '10' });
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('10%');
    (el as unknown as { value: number }).value = 75;
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('75%');
  });

  it('changing min re-renders the fill', () => {
    const el = makeSlider({ min: '0', max: '100', value: '50' });
    expect(fillEl(el).style.getPropertyValue('--_fill')).toBe('50%');
    (el as unknown as { min: number }).min = 25;
    // value=50 in [25,100] = 25/75 ≈ 33.33%.
    expect(fillEl(el).style.getPropertyValue('--_fill')).toMatch(/^33\.33/);
  });

  it('changing valueLabel updates aria-valuetext', () => {
    const el = makeSlider({ value: '40' });
    expect(el.hasAttribute('aria-valuetext')).toBe(false);
    (el as unknown as { valueLabel: string }).valueLabel = 'Volume';
    expect(el.getAttribute('aria-valuetext')).toBe('Volume 40');
  });
});
