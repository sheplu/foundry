import { afterEach, describe, expect, it } from 'vitest';
import { FoundryProgress } from './progress.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-progress-test-${++counter}`;
  class Sub extends FoundryProgress {}
  customElements.define(tag, Sub);
  return { tag };
}

function getBar(el: HTMLElement): HTMLElement {
  const bar = el.shadowRoot?.querySelector('[part="bar"]');
  if (!(bar instanceof HTMLElement)) throw new Error('inner bar missing');
  return bar;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryProgress.define', () => {
  it('registers the given tag', () => {
    const name = `foundry-progress-define-${++counter}`;
    FoundryProgress.define(name);
    expect(customElements.get(name)).toBe(FoundryProgress);
  });

  it('does not re-register an existing tag', () => {
    const name = `foundry-progress-noop-${++counter}`;
    class Existing extends FoundryProgress {}
    customElements.define(name, Existing);

    expect(() => FoundryProgress.define(name)).not.toThrow();
    expect(customElements.get(name)).toBe(Existing);
  });
});

describe('FoundryProgress defaults', () => {
  it('defaults variant to "neutral" and sets role="progressbar"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('neutral');
    expect(el.getAttribute('role')).toBe('progressbar');
  });

  it('defaults aria-valuenow=0, aria-valuemin=0, aria-valuemax=100', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('0');
  });

  it('defaults aria-label to "Progress" when none is set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Progress');
  });
});

describe('FoundryProgress value + max', () => {
  it('reflects a pre-set value as aria-valuenow and bar width', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('value', '40');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-valuenow')).toBe('40');
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('40%');
  });

  it('uses a custom max for both aria-valuemax and percent scaling', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('max', '200');
    el.setAttribute('value', '50');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-valuemax')).toBe('200');
    expect(el.getAttribute('aria-valuenow')).toBe('50');
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('25%');
  });

  it('clamps value to [0, max] when writing above max', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryProgress & { value: number };
    document.body.appendChild(el);
    el.value = 150;
    expect(el.getAttribute('aria-valuenow')).toBe('100');
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('100%');
  });

  it('clamps value to 0 when writing below 0', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryProgress & { value: number };
    document.body.appendChild(el);
    el.value = -20;
    expect(el.getAttribute('aria-valuenow')).toBe('0');
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('0%');
  });

  it('falls back to 0 when value is NaN', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('value', 'not-a-number');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-valuenow')).toBe('0');
  });

  it('falls back to 100 when max is 0 or negative', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('max', '0');
    el.setAttribute('value', '50');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('50');
  });

  it('updates aria + bar when value changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryProgress & { value: number };
    document.body.appendChild(el);

    el.value = 25;
    expect(el.getAttribute('aria-valuenow')).toBe('25');
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('25%');

    el.value = 75;
    expect(el.getAttribute('aria-valuenow')).toBe('75');
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('75%');
  });

  it('updates aria-valuemax + percent when max changes at runtime', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryProgress & { max: number; value: number };
    el.setAttribute('value', '50');
    document.body.appendChild(el);
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('50%');

    el.max = 200;
    expect(el.getAttribute('aria-valuemax')).toBe('200');
    expect(getBar(el).style.getPropertyValue('--_bar-size')).toBe('25%');
  });
});

describe('FoundryProgress variant', () => {
  it('respects a pre-set variant attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'success');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('success');
  });

  it('reflects variant changes via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryProgress & { variant: string };
    document.body.appendChild(el);
    el.variant = 'danger';
    expect(el.getAttribute('variant')).toBe('danger');
  });
});

describe('FoundryProgress label', () => {
  it('respects a custom label as aria-label', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('label', 'Uploading file');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Uploading file');
  });

  it('updates aria-label when the label changes', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryProgress & { label: string };
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Progress');

    el.label = 'Upload';
    expect(el.getAttribute('aria-label')).toBe('Upload');
  });

  it('returns to the default "Progress" label when cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryProgress & { label: string };
    el.setAttribute('label', 'Upload');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Upload');

    el.label = '';
    expect(el.getAttribute('aria-label')).toBe('Progress');
  });
});

describe('FoundryProgress rendering', () => {
  it('renders track + bar parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.shadowRoot?.querySelector('[part="track"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="bar"]')).toBeTruthy();
  });
});

describe('FoundryProgress propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('value', '40');
    document.body.appendChild(el);
    const before = el.getAttribute('aria-valuenow');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(el.getAttribute('aria-valuenow')).toBe(before);
  });
});
