import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryField } from './field.ts';

beforeAll(() => {
  FoundryField.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-field-test-${++counter}`;
  class Sub extends FoundryField {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

interface FieldShape {
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  invalid?: boolean;
  control?: HTMLElement;
}

function makeField(tag: string, shape: FieldShape = {}): {
  el: FoundryField;
  control: HTMLInputElement;
} {
  const el = document.createElement(tag) as FoundryField;
  if (shape.required) el.setAttribute('required', '');
  if (shape.invalid) el.setAttribute('invalid', '');
  if (shape.label !== undefined) {
    const span = document.createElement('span');
    span.setAttribute('slot', 'label');
    span.textContent = shape.label;
    el.appendChild(span);
  }
  const control = (shape.control as HTMLInputElement | undefined)
    ?? document.createElement('input');
  el.appendChild(control);
  if (shape.helper !== undefined) {
    const span = document.createElement('span');
    span.setAttribute('slot', 'helper');
    span.textContent = shape.helper;
    el.appendChild(span);
  }
  if (shape.error !== undefined) {
    const span = document.createElement('span');
    span.setAttribute('slot', 'error');
    span.textContent = shape.error;
    el.appendChild(span);
  }
  document.body.appendChild(el);
  return { el, control: control as HTMLInputElement };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryField.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-field')).toBe(FoundryField);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-field-noop-${++counter}`;
    class Existing extends FoundryField {}
    customElements.define(tag, Existing);
    expect(() => FoundryField.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryField defaults', () => {
  it('defaults required=false, invalid=false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('required')).toBe(false);
    expect(el.hasAttribute('invalid')).toBe(false);
  });

  it('writes no aria attrs to control when there is no label/helper/error', async () => {
    const { tag } = uniqueSubclass();
    const { control } = makeField(tag);
    await raf();
    expect(control.hasAttribute('aria-labelledby')).toBe(false);
    expect(control.hasAttribute('aria-describedby')).toBe(false);
    expect(control.hasAttribute('aria-errormessage')).toBe(false);
    expect(control.hasAttribute('aria-invalid')).toBe(false);
  });
});

describe('FoundryField label wiring', () => {
  it('sets aria-labelledby on the control to the label element id', async () => {
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, { label: 'Email' });
    await raf();
    const labelId = el.shadowRoot?.querySelector('[part="label"]')?.id;
    expect(labelId).toBeTruthy();
    expect(control.getAttribute('aria-labelledby')).toBe(labelId);
  });

  it('toggles has-label when content is added/removed', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryField;
    el.appendChild(document.createElement('input'));
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(false);
    const span = document.createElement('span');
    span.setAttribute('slot', 'label');
    span.textContent = 'New label';
    el.appendChild(span);
    await raf();
    expect(el.hasAttribute('has-label')).toBe(true);
    span.remove();
    await raf();
    expect(el.hasAttribute('has-label')).toBe(false);
  });
});

describe('FoundryField helper wiring', () => {
  it('sets aria-describedby to the helper id', async () => {
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, { helper: 'We never share it.' });
    await raf();
    const helperId = el.shadowRoot?.querySelector('[part="helper"]')?.id;
    expect(control.getAttribute('aria-describedby')).toBe(helperId);
  });

  it('clears aria-describedby when the helper slot is emptied', async () => {
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, { helper: 'help' });
    await raf();
    expect(control.hasAttribute('aria-describedby')).toBe(true);
    el.querySelector('[slot="helper"]')?.remove();
    await raf();
    expect(control.hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('FoundryField error wiring', () => {
  it('does not announce error when invalid=false', async () => {
    const { tag } = uniqueSubclass();
    const { control } = makeField(tag, { error: 'Required' });
    await raf();
    expect(control.hasAttribute('aria-errormessage')).toBe(false);
    expect(control.hasAttribute('aria-describedby')).toBe(false);
  });

  it('announces error via aria-errormessage and describedby when invalid', async () => {
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, { error: 'Required', invalid: true });
    await raf();
    const errorId = el.shadowRoot?.querySelector('[part="error"]')?.id;
    expect(control.getAttribute('aria-errormessage')).toBe(errorId);
    expect(control.getAttribute('aria-describedby')).toBe(errorId);
    expect(control.getAttribute('aria-invalid')).toBe('true');
  });

  it('appends error id to aria-describedby alongside helper id when both present', async () => {
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, {
      helper: 'h',
      error: 'e',
      invalid: true,
    });
    await raf();
    const helperId = el.shadowRoot?.querySelector('[part="helper"]')?.id;
    const errorId = el.shadowRoot?.querySelector('[part="error"]')?.id;
    expect(control.getAttribute('aria-describedby')).toBe(`${helperId} ${errorId}`);
  });

  it('clears aria-invalid and aria-errormessage when invalid flips to false', async () => {
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, { error: 'Required', invalid: true });
    await raf();
    expect(control.getAttribute('aria-invalid')).toBe('true');
    (el as unknown as { invalid: boolean }).invalid = false;
    expect(control.hasAttribute('aria-invalid')).toBe(false);
    expect(control.hasAttribute('aria-errormessage')).toBe(false);
  });
});

describe('FoundryField required marker', () => {
  it('reflects the required attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryField & { required: boolean };
    document.body.appendChild(el);
    el.required = true;
    expect(el.hasAttribute('required')).toBe(true);
    el.required = false;
    expect(el.hasAttribute('required')).toBe(false);
  });

  it('does not forward aria-required to the control (semantics owned by the slotted control)', async () => {
    const { tag } = uniqueSubclass();
    const { control } = makeField(tag, { label: 'Name', required: true });
    await raf();
    expect(control.hasAttribute('aria-required')).toBe(false);
  });
});

describe('FoundryField default-slot replacement', () => {
  it('rewires aria when the slotted control changes', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryField;
    const span = document.createElement('span');
    span.setAttribute('slot', 'label');
    span.textContent = 'L';
    el.appendChild(span);
    const a = document.createElement('input');
    el.appendChild(a);
    document.body.appendChild(el);
    await raf();
    const labelId = el.shadowRoot?.querySelector('[part="label"]')?.id;
    expect(a.getAttribute('aria-labelledby')).toBe(labelId);

    a.remove();
    const b = document.createElement('input');
    el.appendChild(b);
    await raf();
    expect(a.hasAttribute('aria-labelledby')).toBe(false);
    expect(b.getAttribute('aria-labelledby')).toBe(labelId);
  });
});

describe('FoundryField unique ids', () => {
  it('generates distinct ids per instance so two fields do not collide', async () => {
    const { tag: tagA } = uniqueSubclass();
    const { tag: tagB } = uniqueSubclass();
    const { el: a } = makeField(tagA, { label: 'A' });
    const { el: b } = makeField(tagB, { label: 'B' });
    await raf();
    const aId = a.shadowRoot?.querySelector('[part="label"]')?.id;
    const bId = b.shadowRoot?.querySelector('[part="label"]')?.id;
    expect(aId).toBeTruthy();
    expect(bId).toBeTruthy();
    expect(aId).not.toBe(bId);
  });
});

describe('FoundryField disconnect cleanup', () => {
  it('removes our-owned aria attrs on disconnect; preserves consumer values', async () => {
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, {
      label: 'L',
      helper: 'h',
      error: 'e',
      invalid: true,
    });
    await raf();
    // Consumer stamps their own aria-labelledby — wrapper must NOT remove it.
    control.setAttribute('aria-labelledby', 'consumer-label');
    el.remove();
    expect(control.getAttribute('aria-labelledby')).toBe('consumer-label');
    expect(control.hasAttribute('aria-errormessage')).toBe(false);
    expect(control.hasAttribute('aria-describedby')).toBe(false);
  });

  it('preserves consumer ids in aria-describedby on disconnect', async () => {
    // Simulate a consumer who tacked an extra id onto aria-describedby
    // after mount. The wrapper must strip only its own helper/error ids.
    const { tag } = uniqueSubclass();
    const { el, control } = makeField(tag, { helper: 'h' });
    await raf();
    const helperId = el.shadowRoot?.querySelector('[part="helper"]')?.id;
    expect(control.getAttribute('aria-describedby')).toBe(helperId);
    control.setAttribute('aria-describedby', `${helperId} consumer-extra`);
    el.remove();
    expect(control.getAttribute('aria-describedby')).toBe('consumer-extra');
  });

  it('preserves consumer-supplied aria-invalid="false"', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryField;
    const control = document.createElement('input');
    control.setAttribute('aria-invalid', 'false');
    el.appendChild(control);
    document.body.appendChild(el);
    await raf();
    // We never wrote 'true'; consumer's 'false' should stand.
    expect(control.getAttribute('aria-invalid')).toBe('false');
  });
});

describe('FoundryField propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});
