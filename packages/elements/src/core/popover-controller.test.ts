import { afterEach, describe, expect, it, vi } from 'vitest';
import { PopoverController } from './popover-controller.ts';
import type { PopoverPlacement } from './position.ts';

interface Harness {
  host: HTMLElement;
  surface: HTMLElement;
  anchor: HTMLElement;
  controller: PopoverController;
  placement: PopoverPlacement;
}

function makeRect(top: number, left: number, width: number, height: number): DOMRect {
  return {
    top,
    left,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() { return this; },
  } as DOMRect;
}

function harness(
  placement: PopoverPlacement = 'top',
  anchorRect = makeRect(200, 100, 40, 20),
  popoverRect = makeRect(0, 0, 60, 16),
): Harness {
  const host = document.createElement('div');
  const surface = document.createElement('div');
  const anchor = document.createElement('button');

  // Override getBoundingClientRect on the two elements whose rects the
  // controller reads. jsdom returns zero-sized rects by default.
  anchor.getBoundingClientRect = () => anchorRect;
  surface.getBoundingClientRect = () => popoverRect;

  host.appendChild(surface);
  document.body.appendChild(host);
  document.body.appendChild(anchor);

  const ref = { placement };
  const controller = new PopoverController({
    host,
    surface,
    getAnchor: () => anchor,
    getPlacement: () => ref.placement,
    offset: 8,
  });

  return {
    host,
    surface,
    anchor,
    controller,
    get placement(): PopoverPlacement {
      return ref.placement;
    },
    set placement(value: PopoverPlacement) {
      ref.placement = value;
    },
  } as Harness;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PopoverController show/hide', () => {
  it('show() sets the open attribute on the host', () => {
    const h = harness();
    h.controller.show();
    expect(h.host.hasAttribute('open')).toBe(true);
    expect(h.controller.isOpen).toBe(true);
  });

  it('hide() removes the open attribute on the host', () => {
    const h = harness();
    h.controller.show();
    h.controller.hide();
    expect(h.host.hasAttribute('open')).toBe(false);
    expect(h.controller.isOpen).toBe(false);
  });

  it('show() is idempotent (calling twice while open is a no-op)', () => {
    const h = harness();
    h.controller.show();
    h.controller.show();
    expect(h.host.hasAttribute('open')).toBe(true);
    expect(h.controller.isOpen).toBe(true);
  });

  it('hide() is idempotent (calling twice while closed is a no-op)', () => {
    const h = harness();
    h.controller.hide();
    h.controller.hide();
    expect(h.host.hasAttribute('open')).toBe(false);
  });
});

describe('PopoverController reposition', () => {
  it('writes top/left on the surface based on the current placement', () => {
    const h = harness('top');
    h.controller.show();
    // top placement: top=200-16-8=176, left=100+(40-60)/2=90
    expect(h.surface.style.top).toBe('176px');
    expect(h.surface.style.left).toBe('90px');
  });

  it('uses the latest placement on each reposition call', () => {
    const h = harness('top');
    h.controller.show();
    const topY = h.surface.style.top;

    h.placement = 'bottom';
    h.controller.reposition();
    expect(h.surface.style.top).not.toBe(topY);
    // bottom placement: top = anchor.bottom + offset = 220 + 8 = 228
    expect(h.surface.style.top).toBe('228px');
  });

  it('no-ops when getAnchor returns undefined', () => {
    const host = document.createElement('div');
    const surface = document.createElement('div');
    host.appendChild(surface);
    document.body.appendChild(host);
    const controller = new PopoverController({
      host,
      surface,
      getAnchor: () => undefined,
      getPlacement: () => 'top',
      offset: 8,
    });
    controller.show();
    // No throw, no style writes.
    expect(surface.style.top).toBe('');
    expect(surface.style.left).toBe('');
  });
});

describe('PopoverController viewport listeners', () => {
  it('scroll while open triggers reposition', () => {
    const h = harness('top');
    h.controller.attach();
    h.controller.show();
    // Change the anchor rect to simulate layout shift.
    h.anchor.getBoundingClientRect = () => makeRect(300, 100, 40, 20);
    window.dispatchEvent(new Event('scroll'));
    // New anchor top 300: popover.top = 300 - 16 - 8 = 276
    expect(h.surface.style.top).toBe('276px');
  });

  it('scroll while closed does not trigger reposition', () => {
    const h = harness('top');
    h.controller.attach();
    const before = h.surface.style.top;
    window.dispatchEvent(new Event('scroll'));
    expect(h.surface.style.top).toBe(before);
  });

  it('resize while open behaves like scroll', () => {
    const h = harness('top');
    h.controller.attach();
    h.controller.show();
    h.anchor.getBoundingClientRect = () => makeRect(400, 100, 40, 20);
    window.dispatchEvent(new Event('resize'));
    expect(h.surface.style.top).toBe('376px');
  });
});

describe('PopoverController attach/detach', () => {
  it('detach() removes window listeners', () => {
    const h = harness('top');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    h.controller.attach();
    h.controller.detach();
    const calls = removeSpy.mock.calls.map((c) => c[0]);
    expect(calls).toContain('scroll');
    expect(calls).toContain('resize');
    removeSpy.mockRestore();
  });

  it('detach() hides the popover if still open', () => {
    const h = harness();
    h.controller.attach();
    h.controller.show();
    expect(h.host.hasAttribute('open')).toBe(true);
    h.controller.detach();
    expect(h.host.hasAttribute('open')).toBe(false);
  });

  it('attach() is idempotent (calling twice adds listeners only once)', () => {
    const h = harness('top');
    const addSpy = vi.spyOn(window, 'addEventListener');
    h.controller.attach();
    h.controller.attach();
    const scrollAdditions = addSpy.mock.calls.filter((c) => c[0] === 'scroll').length;
    expect(scrollAdditions).toBe(1);
    addSpy.mockRestore();
  });

  it('detach() is idempotent (calling twice is a no-op)', () => {
    const h = harness();
    h.controller.attach();
    h.controller.detach();
    // Second detach must not throw.
    expect(() => h.controller.detach()).not.toThrow();
  });
});
