import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryToastRegion } from './toast-region.ts';
import { FoundryToast } from '../toast/toast.ts';

beforeAll(() => {
  FoundryToastRegion.define();
});

let counter = 0;

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function fastExit(el: HTMLElement): void {
  queueMicrotask(() => {
    el.dispatchEvent(new Event('transitionend'));
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryToastRegion.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-toast-region')).toBe(FoundryToastRegion);
  });

  it('defines foundry-toast as a side-effect', () => {
    FoundryToastRegion.define();
    expect(customElements.get('foundry-toast')).toBe(FoundryToast);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-toast-region-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryToastRegion.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryToastRegion defaults', () => {
  it('reflects position=bottom-end by default', () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    expect(el.getAttribute('position')).toBe('bottom-end');
  });

  it('region part has aria-live="polite"', () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    const region = el.shadowRoot?.querySelector('[part="region"]');
    expect(region?.getAttribute('aria-live')).toBe('polite');
  });

  it('exposes toasts getter after slotchange', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    const t = document.createElement('foundry-toast');
    t.setAttribute('slot', 'items');
    t.setAttribute('duration', '0');
    t.textContent = 'hi';
    el.appendChild(t);
    document.body.appendChild(el);
    await raf();
    expect(el.toasts.length).toBe(1);
  });
});

describe('FoundryToastRegion position reflection', () => {
  it('accepts each position value', () => {
    const positions = [
      'top-start', 'top-center', 'top-end',
      'bottom-start', 'bottom-center', 'bottom-end',
    ] as const;
    for (const p of positions) {
      const el = document.createElement('foundry-toast-region');
      el.setAttribute('position', p);
      document.body.appendChild(el);
      expect(el.getAttribute('position')).toBe(p);
      el.remove();
    }
  });

  it('updates at runtime via property', () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion & {
      position: string;
    };
    document.body.appendChild(el);
    el.position = 'top-center';
    expect(el.getAttribute('position')).toBe('top-center');
  });
});

describe('FoundryToastRegion imperative add()', () => {
  it('returns a handle with toast + dismiss + closed', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    await raf();

    const handle = el.add({ variant: 'info', message: 'Hello', duration: 0 });
    expect(handle.toast).toBeInstanceOf(FoundryToast);
    expect(typeof handle.dismiss).toBe('function');
    expect(handle.closed).toBeInstanceOf(Promise);
  });

  it('adds the toast to the slot', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    await raf();

    el.add({ message: 'Hi', duration: 0 });
    await raf();
    expect(el.toasts.length).toBe(1);
    expect(el.toasts[0]?.getAttribute('slot')).toBe('items');
  });

  it('passes variant, title, duration, message through', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    await raf();

    const handle = el.add({
      variant: 'danger',
      title: 'Oops',
      message: 'Something broke.',
      duration: 0,
    });
    expect(handle.toast.getAttribute('variant')).toBe('danger');
    expect(handle.toast.getAttribute('duration')).toBe('0');
    expect(handle.toast.querySelector('[slot="title"]')?.textContent).toBe('Oops');
    expect(handle.toast.textContent?.trim()).toContain('Something broke.');
  });

  it('closeable=false disables the close button', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    await raf();

    const handle = el.add({ message: 'Hi', duration: 0, closeable: false });
    expect(handle.toast.hasAttribute('closeable')).toBe(false);
  });

  it('handle.dismiss() triggers removal + closed resolves', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    await raf();

    const handle = el.add({ message: 'Hi', duration: 0 });
    fastExit(handle.toast);
    await handle.dismiss('manual');
    await handle.closed;
    expect(handle.toast.parentNode).toBeNull();
  });

  it('handle.closed resolves after the close event fires', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    await raf();

    const handle = el.add({ message: 'Hi', duration: 0 });
    let closeSeen = false;
    handle.toast.addEventListener('close', () => {
      closeSeen = true;
    });
    fastExit(handle.toast);
    await handle.dismiss('manual');
    await handle.closed;
    expect(closeSeen).toBe(true);
  });
});

describe('FoundryToastRegion max enforcement', () => {
  it('auto-dismisses the oldest toast when max is exceeded', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    el.setAttribute('max', '2');
    document.body.appendChild(el);
    await raf();

    const a = el.add({ message: 'A', duration: 0 });
    const b = el.add({ message: 'B', duration: 0 });
    fastExit(a.toast);
    // Third exceeds the cap → oldest (a) should be dismissed.
    const c = el.add({ message: 'C', duration: 0 });
    await raf();
    await a.closed;
    expect(a.toast.parentNode).toBeNull();
    expect(b.toast.parentNode).toBe(el);
    expect(c.toast.parentNode).toBe(el);
  });

  it('max=0 or non-finite disables enforcement', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    el.setAttribute('max', '0');
    document.body.appendChild(el);
    await raf();

    const handles = Array.from({ length: 5 }, (_, i) =>
      el.add({ message: `T${i}`, duration: 0 }));
    await raf();
    expect(el.toasts.length).toBe(5);
    // Cleanup:
    for (const h of handles) {
      fastExit(h.toast);
      await h.dismiss('manual');
    }
  });
});

describe('FoundryToastRegion declarative children', () => {
  it('discovers slotted toast children', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    el.innerHTML = `
      <foundry-toast slot="items" duration="0">A</foundry-toast>
      <foundry-toast slot="items" duration="0">B</foundry-toast>
    `;
    document.body.appendChild(el);
    await raf();
    expect(el.toasts.length).toBe(2);
  });

  it('ignores non-toast children', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    el.innerHTML = `
      <foundry-toast slot="items" duration="0">A</foundry-toast>
      <span slot="items">garbage</span>
    `;
    document.body.appendChild(el);
    await raf();
    expect(el.toasts.length).toBe(1);
  });

  it('slotchange updates the toasts list when children are removed', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    el.innerHTML = `
      <foundry-toast slot="items" duration="0">A</foundry-toast>
    `;
    document.body.appendChild(el);
    await raf();
    expect(el.toasts.length).toBe(1);
    el.innerHTML = '';
    await raf();
    expect(el.toasts.length).toBe(0);
  });
});

describe('FoundryToastRegion cleanup', () => {
  it('disconnecting the region does not throw; reconnect works', async () => {
    const el = document.createElement('foundry-toast-region') as FoundryToastRegion;
    document.body.appendChild(el);
    await raf();
    expect(() => {
      el.remove();
      document.body.appendChild(el);
    }).not.toThrow();
  });
});
