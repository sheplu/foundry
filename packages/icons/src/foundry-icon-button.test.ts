import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FoundryIcon } from './foundry-icon.ts';
import { FoundryIconButton } from './foundry-icon-button.ts';
import { check, close } from './icons.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-icon-button-test-${++counter}`;
  class Sub extends FoundryIconButton {}
  customElements.define(tag, Sub);
  return { tag };
}

beforeEach(() => {
  FoundryIcon.registry.clear();
  FoundryIcon.register({ check, close });
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryIconButton.define', () => {
  it('registers the given tag and also defines foundry-icon as a side effect', () => {
    const tag = `foundry-icon-button-define-${++counter}`;
    FoundryIconButton.define(tag);
    expect(customElements.get(tag)).toBe(FoundryIconButton);
    // Side effect: the inner <foundry-icon> must be registered for composition to work.
    expect(customElements.get('foundry-icon')).toBeDefined();
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-icon-button-noop-${++counter}`;
    class Existing extends FoundryIconButton {}
    customElements.define(tag, Existing);

    expect(() => FoundryIconButton.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryIconButton rendering', () => {
  it('renders a native <button> cached as refs.inner', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const btn = el.shadowRoot?.querySelector('button');
    expect(btn).toBeInstanceOf(HTMLButtonElement);
  });

  it('renders a <foundry-icon> cached as refs.icon', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const icon = el.shadowRoot?.querySelector('foundry-icon');
    expect(icon).not.toBeNull();
  });

  it('attaches its shadow root with delegatesFocus: true', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    const spy = vi.spyOn(el, 'attachShadow');
    document.body.appendChild(el);

    expect(spy).toHaveBeenCalledWith({ mode: 'open', delegatesFocus: true });
  });
});

describe('FoundryIconButton attribute forwarding', () => {
  it('forwards disabled to the inner <button>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { disabled: boolean };
    document.body.appendChild(el);

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(inner.disabled).toBe(false);

    el.setAttribute('disabled', '');
    expect(inner.disabled).toBe(true);

    el.removeAttribute('disabled');
    expect(inner.disabled).toBe(false);
  });

  it('forwards type="submit" to the inner <button>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton
      & { type: 'button' | 'submit' | 'reset' };
    document.body.appendChild(el);
    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

    expect(inner.type).toBe('button');
    el.type = 'submit';
    expect(inner.type).toBe('submit');
  });

  it('forwards label to the inner <button> as aria-label', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { label: string };
    el.setAttribute('label', 'Close dialog');
    document.body.appendChild(el);

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(inner.getAttribute('aria-label')).toBe('Close dialog');
  });

  it('removes aria-label when label is cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { label: string };
    el.setAttribute('label', 'Close');
    document.body.appendChild(el);

    el.removeAttribute('label');
    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(inner.hasAttribute('aria-label')).toBe(false);
  });

  it('propagates name to the inner <foundry-icon>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { name: string };
    el.setAttribute('name', 'check');
    document.body.appendChild(el);

    const icon = el.shadowRoot?.querySelector('foundry-icon');
    expect(icon?.getAttribute('name')).toBe('check');
  });

  it('removes icon name attribute when name is cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { name: string };
    el.setAttribute('name', 'check');
    document.body.appendChild(el);

    el.removeAttribute('name');
    const icon = el.shadowRoot?.querySelector('foundry-icon');
    expect(icon?.hasAttribute('name')).toBe(false);
  });
});

describe('FoundryIconButton variant', () => {
  it('defaults to "secondary"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { variant: string };
    document.body.appendChild(el);

    expect(el.variant).toBe('secondary');
  });

  it('reflects variant changes to the host attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { variant: string };
    document.body.appendChild(el);

    el.variant = 'danger';
    expect(el.getAttribute('variant')).toBe('danger');
  });
});

describe('FoundryIconButton click behavior', () => {
  it('bubbles clicks out of the host', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener('click', handler);

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    inner.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire click when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryIconButton & { disabled: boolean };
    document.body.appendChild(el);

    el.disabled = true;

    const handler = vi.fn();
    el.addEventListener('click', handler);

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    inner.click();
    expect(handler).not.toHaveBeenCalled();
  });
});
