import { expect } from '@open-wc/testing';
import {
  FoundryToast,
  FoundryToastRegion,
  type ToastHandle,
} from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryToastRegion.define();
FoundryToast.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('<foundry-toast-region> + <foundry-toast> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with an empty region', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    await expectA11y(el);
  });

  it('passes axe with an open toast', async () => {
    const el = mount<FoundryToastRegion>(`
      <foundry-toast-region>
        <foundry-toast slot="items" duration="0" variant="info">
          <span slot="title">Saved</span>
          Changes committed.
        </foundry-toast>
      </foundry-toast-region>
    `);
    await raf();
    // Slotted toast text is in the light DOM; axe's color-contrast rule
    // struggles with the fixed-position shadow surface.
    await expectA11y(el, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'] },
      rules: { 'color-contrast': { enabled: false } },
    });
  });

  it('region.add() creates a visible toast in the slot', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle = el.add({ variant: 'info', message: 'Hello', duration: 0 });
    await raf();
    expect(el.toasts.length).to.equal(1);
    expect(handle.toast.textContent).to.contain('Hello');
  });

  it('auto-dismisses after duration', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle = el.add({ message: 'Quick', duration: 120 });
    await handle.closed;
    expect(handle.toast.parentNode).to.equal(null);
  });

  it('hover pauses the auto-dismiss timer', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle = el.add({ message: 'Hover', duration: 150 });
    // Pause before timer fires.
    await sleep(50);
    handle.toast.dispatchEvent(new PointerEvent('pointerenter'));
    // Wait longer than the original duration; toast should still be present.
    await sleep(250);
    expect(handle.toast.parentNode).to.equal(el);
    handle.toast.dispatchEvent(new PointerEvent('pointerleave'));
    await handle.closed;
    expect(handle.toast.parentNode).to.equal(null);
  });

  it('focus-within pauses the timer', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle = el.add({ message: 'Focus', duration: 150 });
    await sleep(50);
    handle.toast.dispatchEvent(new FocusEvent('focusin'));
    await sleep(250);
    expect(handle.toast.parentNode).to.equal(el);
    handle.toast.dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }));
    await handle.closed;
    expect(handle.toast.parentNode).to.equal(null);
  });

  it('close-button click dispatches dismiss with close-button reason', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle: ToastHandle = el.add({ message: 'Manual', duration: 0 });
    let detail: { reason: string } | undefined;
    handle.toast.addEventListener('dismiss', (e) => {
      detail = (e as CustomEvent<{ reason: string }>).detail;
    });
    const btn = handle.toast.shadowRoot?.querySelector('button[part="close-button"]') as HTMLButtonElement;
    btn.click();
    await handle.closed;
    expect(detail?.reason).to.equal('close-button');
    expect(handle.toast.parentNode).to.equal(null);
  });

  it('preventDefault on dismiss keeps the toast alive', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle: ToastHandle = el.add({ message: 'Sticky', duration: 0 });
    handle.toast.addEventListener('dismiss', (e) => {
      e.preventDefault();
    });
    await handle.dismiss('manual');
    expect(handle.toast.parentNode).to.equal(el);
    expect(handle.toast.hasAttribute('open')).to.equal(true);
  });

  it('handle.closed resolves after removal', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle: ToastHandle = el.add({ message: 'Wait for close', duration: 50 });
    await handle.closed;
    // At this point the toast is definitively gone.
    expect(handle.toast.parentNode).to.equal(null);
  });

  it('Escape on the toast dispatches dismiss', async () => {
    const el = mount<FoundryToastRegion>('<foundry-toast-region></foundry-toast-region>');
    await raf();
    const handle: ToastHandle = el.add({ message: 'Escape me', duration: 0 });
    let detail: { reason: string } | undefined;
    handle.toast.addEventListener('dismiss', (e) => {
      detail = (e as CustomEvent<{ reason: string }>).detail;
    });
    handle.toast.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await handle.closed;
    expect(detail?.reason).to.equal('close-button');
  });
});
