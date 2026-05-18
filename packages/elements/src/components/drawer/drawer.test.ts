import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryDrawer } from './drawer.ts';

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
  FoundryDrawer.define();
  shimTeardown = installDialogShim();
});
afterAll(() => {
  shimTeardown();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-drawer-test-${++counter}`;
  class Sub extends FoundryDrawer {}
  customElements.define(tag, Sub);
  return { tag };
}

function makeDrawer(opts: {
  placement?: 'start' | 'end' | 'top' | 'bottom';
  open?: boolean;
  dismissOnBackdrop?: boolean;
  hideCloseButton?: boolean;
  innerHTML?: string;
} = {}): FoundryDrawer {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryDrawer;
  if (opts.placement) el.setAttribute('placement', opts.placement);
  if (opts.open) el.setAttribute('open', '');
  if (opts.dismissOnBackdrop === false) el.setAttribute('dismiss-on-backdrop', '');
  if (opts.hideCloseButton) el.setAttribute('hide-close-button', '');
  if (opts.innerHTML) el.innerHTML = opts.innerHTML;
  document.body.appendChild(el);
  return el;
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

describe('FoundryDrawer.define', () => {
  it('registers the default tag', () => {
    expect(customElements.get('foundry-drawer')).toBe(FoundryDrawer);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-drawer-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryDrawer.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });

  it('is idempotent when called twice', () => {
    expect(() => FoundryDrawer.define()).not.toThrow();
    expect(customElements.get('foundry-drawer')).toBe(FoundryDrawer);
  });
});

describe('FoundryDrawer defaults', () => {
  it('defaults placement to "end" and reflects onto the host', () => {
    const el = makeDrawer();
    expect(el.getAttribute('placement')).toBe('end');
  });

  it('defaults open=false, dismissOnBackdrop=true, hideCloseButton=false', () => {
    const el = makeDrawer();
    expect(el.hasAttribute('open')).toBe(false);
    expect((el as unknown as { dismissOnBackdrop: boolean }).dismissOnBackdrop).toBe(true);
    expect((el as unknown as { hideCloseButton: boolean }).hideCloseButton).toBe(false);
  });
});

describe('FoundryDrawer — open / close', () => {
  it('show() opens the native dialog and flips the open attribute', () => {
    const el = makeDrawer();
    el.show();
    expect(el.hasAttribute('open')).toBe(true);
    expect(getDialog(el).hasAttribute('open')).toBe(true);
  });

  it('close() closes the native dialog', () => {
    const el = makeDrawer({ open: true });
    expect(getDialog(el).hasAttribute('open')).toBe(true);
    el.close();
    expect(getDialog(el).hasAttribute('open')).toBe(false);
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('show() is idempotent', () => {
    const el = makeDrawer();
    el.show();
    expect(() => el.show()).not.toThrow();
    expect(el.hasAttribute('open')).toBe(true);
  });

  it('close() is idempotent when already closed', () => {
    const el = makeDrawer();
    expect(() => el.close()).not.toThrow();
    expect(el.hasAttribute('open')).toBe(false);
  });

  it('initial open="" is honored at connect time', () => {
    const el = makeDrawer({ open: true });
    expect(getDialog(el).hasAttribute('open')).toBe(true);
  });
});

describe('FoundryDrawer — events', () => {
  it('closing dispatches a bubbling+composed close event with returnValue', () => {
    const el = makeDrawer({ open: true });
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    el.close('confirm');
    expect(detail?.returnValue).toBe('confirm');
  });

  it('close without a returnValue still dispatches (detail.returnValue="")', () => {
    const el = makeDrawer({ open: true });
    let fired = 0;
    el.addEventListener('close', () => {
      fired += 1;
    });
    el.close();
    expect(fired).toBe(1);
  });
});

describe('FoundryDrawer — backdrop', () => {
  it('clicking the dialog itself (backdrop) closes with returnValue="dismiss"', () => {
    const el = makeDrawer({ open: true });
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    const dialog = getDialog(el);
    // Click on the dialog element itself (target === dialog).
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(detail?.returnValue).toBe('dismiss');
  });

  it('clicking on inner content does not dismiss', () => {
    const el = makeDrawer({ open: true });
    let fired = 0;
    el.addEventListener('close', () => {
      fired += 1;
    });
    const body = el.shadowRoot?.querySelector('[part="body"]') as HTMLElement;
    body.click();
    expect(fired).toBe(0);
  });

  it('dismiss-on-backdrop=false disables backdrop close', () => {
    const el = makeDrawer({ open: true });
    (el as unknown as { dismissOnBackdrop: boolean }).dismissOnBackdrop = false;
    let fired = 0;
    el.addEventListener('close', () => {
      fired += 1;
    });
    const dialog = getDialog(el);
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fired).toBe(0);
  });
});

describe('FoundryDrawer — close button', () => {
  it('clicking the close button closes the drawer', () => {
    const el = makeDrawer({ open: true });
    getCloseButton(el).click();
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryDrawer — form method=dialog', () => {
  it('submitting a slotted <form method="dialog"> closes with the submitter value', () => {
    const el = makeDrawer({
      open: true,
      innerHTML: `
        <form method="dialog" slot="footer">
          <button type="submit" value="cancel">Cancel</button>
          <button type="submit" value="confirm">Confirm</button>
        </form>
      `,
    });
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    const confirmBtn = el.querySelector<HTMLButtonElement>('button[value="confirm"]');
    confirmBtn?.click();
    expect(detail?.returnValue).toBe('confirm');
  });

  it('submits without a submitter close with empty returnValue', () => {
    const el = makeDrawer({
      open: true,
      innerHTML: '<form method="dialog"><button type="submit">OK</button></form>',
    });
    let detail: { returnValue: string } | undefined;
    el.addEventListener('close', (e) => {
      detail = (e as CustomEvent<{ returnValue: string }>).detail;
    });
    // Dispatch a submit event with no submitter (simulates form.submit() path).
    const form = el.querySelector('form');
    form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(detail?.returnValue).toBe('');
  });

  it('ignores submits from a non-dialog form', () => {
    const el = makeDrawer({
      open: true,
      innerHTML: '<form action="/x"><button type="submit">Send</button></form>',
    });
    let fired = 0;
    el.addEventListener('close', () => {
      fired += 1;
    });
    const form = el.querySelector('form');
    form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(fired).toBe(0);
  });
});

describe('FoundryDrawer — slots + aria wiring', () => {
  it('reflects has-title when the title slot has content + wires aria-labelledby', () => {
    const el = makeDrawer({
      innerHTML: '<span slot="title">My drawer</span>',
    });
    expect(el.hasAttribute('has-title')).toBe(true);
    const dialog = getDialog(el);
    expect(dialog.getAttribute('aria-labelledby')).toMatch(/^foundry-drawer-title-/);
  });

  it('does not set aria-labelledby when title slot is empty', () => {
    const el = makeDrawer();
    expect(el.hasAttribute('has-title')).toBe(false);
    expect(getDialog(el).hasAttribute('aria-labelledby')).toBe(false);
  });

  it('reflects has-description + wires aria-describedby', () => {
    const el = makeDrawer({
      innerHTML: '<span slot="description">Details about this drawer</span>',
    });
    expect(el.hasAttribute('has-description')).toBe(true);
    expect(getDialog(el).getAttribute('aria-describedby')).toMatch(/^foundry-drawer-desc-/);
  });

  it('reflects has-footer when the footer slot has content', () => {
    const el = makeDrawer({
      innerHTML: '<div slot="footer"><button>OK</button></div>',
    });
    expect(el.hasAttribute('has-footer')).toBe(true);
  });
});

describe('FoundryDrawer — placement', () => {
  it('accepts placement="start"', () => {
    const el = makeDrawer({ placement: 'start' });
    expect(el.getAttribute('placement')).toBe('start');
  });

  it('accepts placement="top"', () => {
    const el = makeDrawer({ placement: 'top' });
    expect(el.getAttribute('placement')).toBe('top');
  });

  it('accepts placement="bottom"', () => {
    const el = makeDrawer({ placement: 'bottom' });
    expect(el.getAttribute('placement')).toBe('bottom');
  });
});

describe('FoundryDrawer — propertyChanged filter', () => {
  it('ignores unknown property names', () => {
    const el = makeDrawer();
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});

describe('FoundryDrawer — returnValue getter/setter', () => {
  it('returns the dialog returnValue', () => {
    const el = makeDrawer({ open: true });
    el.close('foo');
    expect(el.returnValue).toBe('foo');
  });

  it('can be set directly', () => {
    const el = makeDrawer();
    el.returnValue = 'bar';
    expect(el.returnValue).toBe('bar');
  });
});
