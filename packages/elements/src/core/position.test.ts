import { describe, expect, it } from 'vitest';
import { positionAnchored } from './position.ts';

// Construct a plain rect (jsdom's DOMRect constructor exists, but we mimic
// just the shape we use — keeps the test portable).
function rect(top: number, left: number, width: number, height: number): DOMRect {
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

describe('positionAnchored', () => {
  // A 40×20 anchor sitting at (100, 200). A 60×16 popover.
  const anchor = rect(200, 100, 40, 20);
  const popover = rect(0, 0, 60, 16);
  const offset = 8;

  it('top: popover sits above the anchor, centered horizontally', () => {
    const pos = positionAnchored(anchor, popover, 'top', offset);
    // top: anchor.top - popover.height - offset = 200 - 16 - 8 = 176
    // left: anchor.left + (anchor.width - popover.width) / 2 = 100 + (40 - 60) / 2 = 90
    expect(pos.top).toBe(176);
    expect(pos.left).toBe(90);
  });

  it('bottom: popover sits below the anchor, centered horizontally', () => {
    const pos = positionAnchored(anchor, popover, 'bottom', offset);
    // top: anchor.bottom + offset = 220 + 8 = 228
    expect(pos.top).toBe(228);
    expect(pos.left).toBe(90);
  });

  it('left: popover sits to the left of the anchor, centered vertically', () => {
    const pos = positionAnchored(anchor, popover, 'left', offset);
    // top: anchor.top + (anchor.height - popover.height) / 2 = 200 + (20 - 16) / 2 = 202
    // left: anchor.left - popover.width - offset = 100 - 60 - 8 = 32
    expect(pos.top).toBe(202);
    expect(pos.left).toBe(32);
  });

  it('right: popover sits to the right of the anchor, centered vertically', () => {
    const pos = positionAnchored(anchor, popover, 'right', offset);
    // left: anchor.right + offset = 140 + 8 = 148
    expect(pos.top).toBe(202);
    expect(pos.left).toBe(148);
  });

  it('clamps negative top to 0 (off-screen-top anchor)', () => {
    const tinyAnchor = rect(0, 100, 40, 20);
    const pos = positionAnchored(tinyAnchor, popover, 'top', offset);
    // top would be 0 - 16 - 8 = -24 → clamped to 0
    expect(pos.top).toBe(0);
  });

  it('clamps negative left to 0 (off-screen-left anchor)', () => {
    const leftAnchor = rect(200, 0, 40, 20);
    const pos = positionAnchored(leftAnchor, popover, 'left', offset);
    // left would be 0 - 60 - 8 = -68 → clamped to 0
    expect(pos.left).toBe(0);
  });

  it('offset scales the gap (larger offset pushes the popover further away)', () => {
    const near = positionAnchored(anchor, popover, 'bottom', 4);
    const far = positionAnchored(anchor, popover, 'bottom', 20);
    expect(far.top - near.top).toBe(16);
  });
});
