import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { FoundryModal } from './modal.ts';

// jsdom doesn't implement the <dialog> API (showModal/close/returnValue).
// Shim these on HTMLDialogElement.prototype for the duration of the suite.
function installDialogShim(): () => void {
  const proto = HTMLDialogElement.prototype as unknown as {
    showModal?: () => void;
    close?: (v?: string) => void;
    returnValue?: string;
  };
  const originalShow = proto.showModal;
  const originalClose = proto.close;
  const rvDescriptor = Object.getOwnPropertyDescriptor(proto, 'returnValue');

  // Per-element returnValue storage since jsdom doesn't provide it.
  const rvStore = new WeakMap<HTMLDialogElement, string>();
  Object.defineProperty(proto, 'returnValue', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return rvStore.get(this) ?? '';
    },
    set(this: HTMLDialogElement, value: string) {
      rvStore.set(this, String(value));
    },
  });

  proto.showModal = function (this: HTMLDialogElement): void {
    this.setAttribute('open', '');
  };
  proto.close = function (this: HTMLDialogElement): void {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };

  return (): void => {
    if (originalShow === undefined) delete proto.showModal;
    else proto.showModal = originalShow;
    if (originalClose === undefined) delete proto.close;
    else proto.close = originalClose;
    if (rvDescriptor) Object.defineProperty(proto, 'returnValue', rvDescriptor);
    else delete proto.returnValue;
  };
}

let shimTeardown: () => void;
beforeAll(() => {
  FoundryModal.define();
  shimTeardown = installDialogShim();
});
afterAll(() => {
  shimTeardown();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-modal-test-${++counter}`;
  class Sub extends FoundryModal {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getDialog(el: HTMLElement): HTMLDialogElement {
  const d = el.shadowRoot?.querySelector('dialog[part="dialog"]');
  if (!(d instanceof HTMLDialogElement)) throw new Error('inner dialog not found');
  return d;
}

function getCloseButton(el: HTMLElement): HTMLButtonElement {
  const b = el.shadowRoot?.querySelector('button[part="close-button"]');
  if (!(b instanceof HTMLButtonElement)) throw new Error('close button not found');
  return b;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryModal.define', () => {
  it('registers the default tag', () => {
    expect(customElements.get('foundry-modal')).toBe(FoundryModal);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-modal-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryModal.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });

  it('is idempotent when called twice', () => {
    expect(() => FoundryModal.define()).not.toThrow();
    expect(customElements.get('foundry-modal')).toBe(FoundryModal);
  });

  it('inlines the close icon SVG so modal has no runtime icon-registry coupling', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    const svg = el.shadowRoot?.querySelector('svg[part="close-icon"]');
    expect(svg).toBeTruthy();
  });
});

describe('FoundryModal defaults', () => {
  it('defaults open=false, size=md, dismiss-on-backdrop=true, hide-close-button=false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal & {
      dismissOnBackdrop: boolean;
      hideCloseButton: boolean;
    };
    document.body.appendChild(el);
    expect(el.hasAttribute('open')).toBe(false);
    expect(el.getAttribute('size')).toBe('md');
    // Boolean-default-true: attribute absence = true (matches native
    // `<input>` required/disabled semantics inverted). Read the property.
    expect(el.dismissOnBackdrop).toBe(true);
    expect(el.hideCloseButton).toBe(false);
  });

  it('renders dialog, header, body, footer, close-button parts', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.shadowRoot?.querySelector('[part="dialog"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="header"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="title"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="description"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="body"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="footer"]')).toBeTruthy();
    expect(el.shadowRoot?.querySelector('[part="close-button"]')).toBeTruthy();
  });

  it('inner dialog element has the "dialog" part', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(getDialog(el).tagName).toBe('DIALOG');
  });
});

describe('FoundryModal open/close via methods', () => {
  it('show() opens the native dialog', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    expect(getDialog(el).hasAttribute('open')).toBe(true);
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('close() closes the native dialog', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    el.close();
    expect(getDialog(el).hasAttribute('open')).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('close(returnValue) sets the dialog returnValue', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    el.close('confirm');
    expect(el.returnValue).toBe('confirm');
  });

  it('show() while open is a no-op', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    const spy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    el.show();
    el.show();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('close() while closed is a no-op', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    expect(() => el.close()).not.toThrow();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('setting the open property triggers showModal', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal & { open: boolean };
    document.body.appendChild(el);
    el.open = true;
    expect(getDialog(el).hasAttribute('open')).toBe(true);
  });

  it('setting open=true before connect opens on connect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    el.setAttribute('open', '');
    document.body.appendChild(el);
    expect(getDialog(el).hasAttribute('open')).toBe(true);
  });

  it('opening resets the previous returnValue', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    el.close('confirm');
    expect(el.returnValue).toBe('confirm');
    el.show();
    expect(el.returnValue).toBe('');
  });

  it('returnValue setter proxies to the dialog', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.returnValue = 'x';
    expect(getDialog(el).returnValue).toBe('x');
  });
});

describe('FoundryModal close event', () => {
  it('native close event flips open=false', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    getDialog(el).dispatchEvent(new Event('close'));
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('re-dispatches a bubbling+composed close event with returnValue detail', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    el.close('confirm');
    expect(detail?.returnValue).toBe('confirm');
  });

  it('close event bubbles across shadow boundary (composed)', () => {
    const { tag } = uniqueSubclass();
    const outer = document.createElement('div');
    const el = document.createElement(tag) as FoundryModal;
    outer.appendChild(el);
    document.body.appendChild(outer);
    el.show();
    let received = false;
    outer.addEventListener('close', () => {
      received = true;
    });
    el.close();
    expect(received).toBe(true);
  });
});

describe('FoundryModal backdrop click', () => {
  it('click on the dialog surface (target === dialog) closes with returnValue="dismiss"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    const dialog = getDialog(el);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.hasAttribute('open')).toBe(false);
    expect(el.returnValue).toBe('dismiss');
  });

  it('click on an inner element does NOT close', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    const body = el.shadowRoot?.querySelector('[part="body"]') as HTMLElement;
    body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('dismiss-on-backdrop=false suppresses backdrop dismiss', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    el.setAttribute('dismiss-on-backdrop', 'false');
    // boolean attrs: presence = true, absence = false; explicitly remove it
    el.removeAttribute('dismiss-on-backdrop');
    document.body.appendChild(el);
    el.show();
    getDialog(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('re-enabling dismiss-on-backdrop at runtime works', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal & { dismissOnBackdrop: boolean };
    document.body.appendChild(el);
    el.dismissOnBackdrop = false;
    el.show();
    getDialog(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.hasAttribute('open')).toBe(true);
    el.dismissOnBackdrop = true;
    getDialog(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryModal close button', () => {
  it('clicking the close button closes the modal', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    getCloseButton(el).click();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('hide-close-button reflects as an attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal & { hideCloseButton: boolean };
    document.body.appendChild(el);
    el.hideCloseButton = true;
    expect(el.hasAttribute('hide-close-button')).toBe(true);
  });
});

describe('FoundryModal aria-labelledby / aria-describedby', () => {
  it('wires aria-labelledby when title slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="title">Confirm</span>';
    document.body.appendChild(el);
    await raf();
    const dialog = getDialog(el);
    expect(dialog.getAttribute('aria-labelledby')).toMatch(/^foundry-modal-title-\d+$/);
  });

  it('clears aria-labelledby when title slot is empty', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    await raf();
    expect(getDialog(el).hasAttribute('aria-labelledby')).toBe(false);
  });

  it('wires aria-describedby when description slot has content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = '<span slot="description">Details</span>';
    document.body.appendChild(el);
    await raf();
    const dialog = getDialog(el);
    expect(dialog.getAttribute('aria-describedby')).toMatch(/^foundry-modal-desc-\d+$/);
  });

  it('title and description IDs are unique per instance', async () => {
    const { tag: tagA } = uniqueSubclass();
    const { tag: tagB } = uniqueSubclass();
    const a = document.createElement(tagA);
    const b = document.createElement(tagB);
    a.innerHTML = '<span slot="title">A</span>';
    b.innerHTML = '<span slot="title">B</span>';
    document.body.append(a, b);
    await raf();
    const aId = getDialog(a).getAttribute('aria-labelledby');
    const bId = getDialog(b).getAttribute('aria-labelledby');
    expect(aId).not.toBe(bId);
  });

  it('reflects has-title / has-description / has-footer via slot observation', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.innerHTML = `
      <span slot="title">T</span>
      <span slot="description">D</span>
      <div slot="footer">F</div>
    `;
    document.body.appendChild(el);
    await raf();
    expect(el.hasAttribute('has-title')).toBe(true);
    expect(el.hasAttribute('has-description')).toBe(true);
    expect(el.hasAttribute('has-footer')).toBe(true);
  });
});

describe('FoundryModal form integration', () => {
  it('submitting a <form method="dialog"> inside the body closes via native close flow', () => {
    // Native dialog behavior: a form submit with method=dialog calls
    // dialog.close(button.value). jsdom doesn't implement this, so we
    // simulate the effect directly: the dialog's close() with a value.
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    el.innerHTML = `
      <form method="dialog">
        <button type="submit" value="confirm">Confirm</button>
      </form>
    `;
    document.body.appendChild(el);
    el.show();

    // Simulate the outcome of a form-method=dialog submit: the dialog
    // ends up closed with the button's value as returnValue. The
    // component's #onDialogClose must still fire and propagate.
    const dialog = getDialog(el);
    dialog.returnValue = 'confirm';
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));

    expect(el.hasAttribute('open')).toBe(false);
    expect(el.returnValue).toBe('confirm');
  });

  it('host close event carries the form submit returnValue', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    const dialog = getDialog(el);
    dialog.returnValue = 'cancel';
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
    expect(detail?.returnValue).toBe('cancel');
  });
});

describe('FoundryModal size attribute', () => {
  it('reflects the size attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal & { size: string };
    el.setAttribute('size', 'lg');
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('lg');
    el.size = 'sm';
    expect(el.getAttribute('size')).toBe('sm');
  });

  it('defaults to md when no attribute is set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('md');
  });
});

describe('FoundryModal reuse on reopen', () => {
  it('open → close → open leaves the dialog reusable', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    el.close('first');
    expect(el.returnValue).toBe('first');
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
    expect(el.returnValue).toBe('');
  });
});

describe('FoundryModal disconnect cleanup', () => {
  it('closes a still-open dialog on disconnect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    el.show();
    const dialog = getDialog(el);
    expect(dialog.hasAttribute('open')).toBe(true);
    el.remove();
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('does not throw when reconnected after disconnect', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    const parent = el.parentElement as HTMLElement;
    parent.removeChild(el);
    expect(() => parent.appendChild(el)).not.toThrow();
  });
});

describe('FoundryModal propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryModal;
    document.body.appendChild(el);
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
    expect(el.hasAttribute('open')).toBe(false);
  });
});
