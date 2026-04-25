import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundryButton } from './button.ts';

let counter = 0;

function uniqueSubclass(): { tag: string; Ctor: typeof FoundryButton } {
  const tag = `foundry-button-test-${++counter}`;
  class Sub extends FoundryButton {}
  customElements.define(tag, Sub);
  return { tag, Ctor: Sub };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryButton.define', () => {
  it('registers the given tag with FoundryButton', () => {
    const tag = `foundry-button-define-${++counter}`;
    FoundryButton.define(tag);

    expect(customElements.get(tag)).toBe(FoundryButton);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-button-noop-${++counter}`;
    class Existing extends FoundryButton {}
    customElements.define(tag, Existing);

    expect(() => FoundryButton.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryButton rendering', () => {
  it('renders an inner native <button> cached as this.refs.inner', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton;
    document.body.appendChild(el);

    const inner = el.shadowRoot?.querySelector('button');
    expect(inner).toBeInstanceOf(HTMLButtonElement);
    // refs is protected; access via a subclass probe
    class Probe extends FoundryButton {
      inspect() { return this.refs['inner']; }
    }
    const probeTag = `foundry-button-probe-${++counter}`;
    customElements.define(probeTag, Probe);
    const probe = document.createElement(probeTag) as Probe;
    document.body.appendChild(probe);
    expect(probe.inspect()).toBe(probe.shadowRoot?.querySelector('button'));
  });

  it('attaches its shadow root with delegatesFocus: true', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton;
    const spy = vi.spyOn(el, 'attachShadow');
    document.body.appendChild(el);

    expect(spy).toHaveBeenCalledWith({ mode: 'open', delegatesFocus: true });
  });
});

describe('FoundryButton attribute forwarding', () => {
  it('forwards disabled attribute to the inner <button>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton & { disabled: boolean };
    document.body.appendChild(el);

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    expect(inner.disabled).toBe(false);

    el.setAttribute('disabled', '');
    expect(inner.disabled).toBe(true);

    el.removeAttribute('disabled');
    expect(inner.disabled).toBe(false);
  });

  it('forwards disabled set via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton & { disabled: boolean };
    document.body.appendChild(el);
    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

    el.disabled = true;
    expect(inner.disabled).toBe(true);
    expect(el.hasAttribute('disabled')).toBe(true);
  });

  it('forwards type="submit" to the inner <button>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton & { type: 'button' | 'submit' | 'reset' };
    document.body.appendChild(el);
    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;

    expect(inner.type).toBe('button');

    el.type = 'submit';
    expect(inner.type).toBe('submit');
  });
});

describe('FoundryButton variant', () => {
  it('defaults variant to "primary" and reflects it to the host attribute when set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton & { variant: string };
    document.body.appendChild(el);

    expect(el.variant).toBe('primary');
    expect(el.hasAttribute('variant')).toBe(false);

    el.variant = 'danger';
    expect(el.getAttribute('variant')).toBe('danger');
  });
});

describe('FoundryButton click behavior', () => {
  it('bubbles clicks on the inner button out of the host', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton;
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener('click', handler);

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    inner.click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire click on the host when disabled', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryButton & { disabled: boolean };
    document.body.appendChild(el);

    el.disabled = true;

    const handler = vi.fn();
    el.addEventListener('click', handler);

    const inner = el.shadowRoot?.querySelector('button') as HTMLButtonElement;
    inner.click();

    expect(handler).not.toHaveBeenCalled();
  });
});
