import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundryTag, resolveTagValue } from './tag.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-tag-test-${++counter}`;
  class Sub extends FoundryTag {}
  customElements.define(tag, Sub);
  return { tag };
}

function getClose(el: HTMLElement): HTMLButtonElement {
  const btn = el.shadowRoot?.querySelector('button[part="close"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('inner close button missing');
  return btn;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('resolveTagValue', () => {
  it('returns the explicit value when non-empty', () => {
    expect(resolveTagValue('design', 'Design')).toBe('design');
  });

  it('falls back to trimmed text when value is empty', () => {
    expect(resolveTagValue('', '  Design  ')).toBe('Design');
  });

  it('returns empty string when both are empty', () => {
    expect(resolveTagValue('', '')).toBe('');
  });
});

describe('FoundryTag.define', () => {
  it('registers the given tag', () => {
    const name = `foundry-tag-define-${++counter}`;
    FoundryTag.define(name);
    expect(customElements.get(name)).toBe(FoundryTag);
  });

  it('does not re-register an existing tag', () => {
    const name = `foundry-tag-noop-${++counter}`;
    class Existing extends FoundryTag {}
    customElements.define(name, Existing);

    expect(() => FoundryTag.define(name)).not.toThrow();
    expect(customElements.get(name)).toBe(Existing);
  });
});

describe('FoundryTag defaults', () => {
  it('defaults variant to "neutral"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('neutral');
  });

  it('defaults removable and disabled to false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('removable')).toBe(false);
    expect(el.hasAttribute('disabled')).toBe(false);
  });
});

describe('FoundryTag variant', () => {
  it('respects a pre-set variant attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('variant', 'success');
    document.body.appendChild(el);
    expect(el.getAttribute('variant')).toBe('success');
  });

  it('reflects variant changes made via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTag & { variant: string };
    document.body.appendChild(el);
    el.variant = 'danger';
    expect(el.getAttribute('variant')).toBe('danger');
  });
});

describe('FoundryTag removable rendering', () => {
  it('close button has tabindex=-1 and aria-hidden by default', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.textContent = 'design';
    document.body.appendChild(el);
    const close = getClose(el);
    expect(close.tabIndex).toBe(-1);
    expect(close.getAttribute('aria-hidden')).toBe('true');
  });

  it('close button becomes focusable and gets aria-label when removable', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'design';
    document.body.appendChild(el);
    const close = getClose(el);
    expect(close.tabIndex).toBe(0);
    expect(close.hasAttribute('aria-hidden')).toBe(false);
    expect(close.getAttribute('aria-label')).toBe('Remove design');
  });

  it('aria-label uses the value attribute when provided', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.setAttribute('value', 'design-token');
    el.textContent = 'Design';
    document.body.appendChild(el);
    expect(getClose(el).getAttribute('aria-label')).toBe('Remove design-token');
  });
});

describe('FoundryTag remove event', () => {
  it('dispatches a "remove" CustomEvent on close click', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'design';
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener('remove', handler);
    getClose(el).click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0]?.[0] as CustomEvent;
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
    expect(event.cancelable).toBe(true);
  });

  it('bubbles the remove event to ancestors', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'x';
    const parent = document.createElement('div');
    parent.appendChild(el);
    document.body.appendChild(parent);

    const handler = vi.fn();
    parent.addEventListener('remove', handler);
    getClose(el).click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('detail.value contains the value attribute when set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.setAttribute('value', 'design');
    el.textContent = 'Design';
    document.body.appendChild(el);

    let detail: { value: string } | undefined;
    el.addEventListener('remove', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
      e.preventDefault();
    });
    getClose(el).click();
    expect(detail?.value).toBe('design');
  });

  it('detail.value falls back to slotted text when value is absent', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = '  design  ';
    document.body.appendChild(el);

    let detail: { value: string } | undefined;
    el.addEventListener('remove', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
      e.preventDefault();
    });
    getClose(el).click();
    expect(detail?.value).toBe('design');
  });

  it('Enter key on the close button dispatches remove', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'x';
    document.body.appendChild(el);

    const handler = vi.fn((e: Event) => e.preventDefault());
    el.addEventListener('remove', handler);
    getClose(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('Space key on the close button dispatches remove', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'x';
    document.body.appendChild(el);

    const handler = vi.fn((e: Event) => e.preventDefault());
    el.addEventListener('remove', handler);
    getClose(el).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('ignores keys other than Enter and Space', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'x';
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener('remove', handler);
    getClose(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });
});

describe('FoundryTag auto-remove', () => {
  it('removes itself from the DOM when the event is not prevented', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'x';
    const parent = document.createElement('div');
    parent.appendChild(el);
    document.body.appendChild(parent);

    expect(parent.contains(el)).toBe(true);
    getClose(el).click();
    expect(parent.contains(el)).toBe(false);
  });

  it('stays in the DOM when the listener calls preventDefault()', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.textContent = 'x';
    const parent = document.createElement('div');
    parent.appendChild(el);
    document.body.appendChild(parent);

    el.addEventListener('remove', (e) => e.preventDefault());
    getClose(el).click();
    expect(parent.contains(el)).toBe(true);
  });
});

describe('FoundryTag disabled', () => {
  it('ignores close click when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.setAttribute('disabled', '');
    el.textContent = 'x';
    const parent = document.createElement('div');
    parent.appendChild(el);
    document.body.appendChild(parent);

    const handler = vi.fn();
    el.addEventListener('remove', handler);
    getClose(el).click();
    expect(handler).not.toHaveBeenCalled();
    expect(parent.contains(el)).toBe(true);
  });

  it('ignores Enter key when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    el.setAttribute('disabled', '');
    el.textContent = 'x';
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener('remove', handler);
    getClose(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('forwards disabled to the inner close button', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryTag & { disabled: boolean };
    el.setAttribute('removable', '');
    document.body.appendChild(el);
    expect(getClose(el).disabled).toBe(false);

    el.disabled = true;
    expect(getClose(el).disabled).toBe(true);
  });
});

describe('FoundryTag propertyChanged filter', () => {
  it('ignores property names outside the known set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('removable', '');
    document.body.appendChild(el);
    const before = getClose(el).tabIndex;

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(getClose(el).tabIndex).toBe(before);
  });
});
