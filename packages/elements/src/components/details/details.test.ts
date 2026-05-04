import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryDetails } from './details.ts';

beforeAll(() => {
  FoundryDetails.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-details-test-${++counter}`;
  class Sub extends FoundryDetails {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getDetails(el: HTMLElement): HTMLDetailsElement {
  const d = el.shadowRoot?.querySelector('details[part="details"]');
  if (!(d instanceof HTMLDetailsElement)) throw new Error('inner details not found');
  return d;
}

function getSummary(el: HTMLElement): HTMLElement {
  const s = el.shadowRoot?.querySelector('summary[part="summary"]');
  if (!(s instanceof HTMLElement)) throw new Error('inner summary not found');
  return s;
}

// jsdom supports the `open` property but doesn't dispatch `toggle` events
// automatically. Emit one by hand, mimicking the native event shape.
function fireToggle(el: HTMLElement): void {
  getDetails(el).dispatchEvent(new Event('toggle'));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryDetails.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-details')).toBe(FoundryDetails);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-details-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryDetails.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryDetails defaults + template wiring', () => {
  it('defaults open=false, disabled=false, no value', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    document.body.appendChild(el);
    expect(el.hasAttribute('open')).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.hasAttribute('value')).toBe(false);
  });

  it('renders details, summary, label, caret, body parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const root = el.shadowRoot;
    expect(root?.querySelector('[part="details"]')).toBeTruthy();
    expect(root?.querySelector('[part="summary"]')).toBeTruthy();
    expect(root?.querySelector('[part="label"]')).toBeTruthy();
    expect(root?.querySelector('svg[part="caret"]')).toBeTruthy();
    expect(root?.querySelector('[part="body"]')).toBeTruthy();
  });

  it('uses native <details> + <summary> elements inside the shadow root', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(getDetails(el).tagName).toBe('DETAILS');
    expect(getSummary(el).tagName).toBe('SUMMARY');
  });
});

describe('FoundryDetails open/close via property', () => {
  it('writing open=true opens the native details', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { open: boolean };
    document.body.appendChild(el);
    el.open = true;
    expect(getDetails(el).open).toBe(true);
  });

  it('writing open=false closes the native details', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { open: boolean };
    el.setAttribute('open', '');
    document.body.appendChild(el);
    expect(getDetails(el).open).toBe(true);
    el.open = false;
    expect(getDetails(el).open).toBe(false);
  });

  it('preserves an open attribute set before connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    el.setAttribute('open', '');
    document.body.appendChild(el);
    expect(getDetails(el).open).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('is idempotent on repeated identical writes', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { open: boolean };
    document.body.appendChild(el);
    el.open = true;
    el.open = true;
    expect(getDetails(el).open).toBe(true);
  });
});

describe('FoundryDetails native toggle event', () => {
  it('native toggle with open=true flips host open to true', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    document.body.appendChild(el);
    expect(el.hasAttribute('open')).toBe(false);
    getDetails(el).open = true;
    fireToggle(el);
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('native toggle with open=false flips host open to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { open: boolean };
    el.setAttribute('open', '');
    document.body.appendChild(el);
    expect(el.hasAttribute('open')).toBe(true);
    getDetails(el).open = false;
    fireToggle(el);
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('does not feedback-loop when host-initiated open flips the native state', () => {
    // A feedback loop would manifest as either a stack overflow (recursive
    // propertyChanged → toggle → propertyChanged) or a wrong final state.
    // Verify by doing paired host writes + toggle-event replays and
    // observing the settled state.
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { open: boolean };
    document.body.appendChild(el);
    expect(() => {
      el.open = true;
      fireToggle(el);
      el.open = false;
      fireToggle(el);
      el.open = true;
      fireToggle(el);
    }).not.toThrow();
    expect(el.hasAttribute('open')).toBe(true);
    expect(getDetails(el).open).toBe(true);
  });
});

describe('FoundryDetails disabled handling', () => {
  it('reflects aria-disabled onto the summary', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { disabled: boolean };
    document.body.appendChild(el);
    expect(getSummary(el).hasAttribute('aria-disabled')).toBe(false);
    el.disabled = true;
    expect(getSummary(el).getAttribute('aria-disabled')).toBe('true');
    el.disabled = false;
    expect(getSummary(el).hasAttribute('aria-disabled')).toBe(false);
  });

  it('rejects programmatic open=true writes when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { open: boolean; disabled: boolean };
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    el.open = true;
    expect(el.hasAttribute('open')).toBe(false);
    expect(getDetails(el).open).toBe(false);
  });

  it('intercepts summary click when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    getSummary(el).dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });

  it('intercepts Enter/Space keydown on summary when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    el.setAttribute('disabled', '');
    document.body.appendChild(el);
    for (const key of ['Enter', ' ']) {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      getSummary(el).dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });
});

describe('FoundryDetails resolvedValue', () => {
  it('returns the value attribute when set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    el.setAttribute('value', 'profile');
    el.innerHTML = '<span slot="summary">Profile settings</span>';
    document.body.appendChild(el);
    expect(el.resolvedValue).toBe('profile');
  });

  it('falls back to trimmed summary slot text', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    el.innerHTML = '<span slot="summary">  Billing  </span>';
    document.body.appendChild(el);
    await raf();
    expect(el.resolvedValue).toBe('Billing');
  });

  it('returns empty string when both value and summary slot are empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    document.body.appendChild(el);
    await raf();
    expect(el.resolvedValue).toBe('');
  });

  it('reflects updated summary text', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    const span = document.createElement('span');
    span.setAttribute('slot', 'summary');
    span.textContent = 'Alpha';
    el.appendChild(span);
    document.body.appendChild(el);
    await raf();
    expect(el.resolvedValue).toBe('Alpha');
    span.textContent = 'Beta';
    expect(el.resolvedValue).toBe('Beta');
  });
});

describe('FoundryDetails propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const before = el.hasAttribute('open');
    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);
    expect(el.hasAttribute('open')).toBe(before);
  });
});

describe('FoundryDetails reopen after close', () => {
  it('open → close → open keeps native + host in sync', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails & { open: boolean };
    document.body.appendChild(el);
    el.open = true;
    el.open = false;
    el.open = true;
    expect(el.hasAttribute('open')).toBe(true);
    expect(getDetails(el).open).toBe(true);
  });

  it('disconnecting then reconnecting does not throw', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryDetails;
    document.body.appendChild(el);
    const parent = el.parentElement as HTMLElement;
    parent.removeChild(el);
    expect(() => parent.appendChild(el)).not.toThrow();
  });
});
