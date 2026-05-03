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

  it('reports the requested placement when no viewport is provided', () => {
    const pos = positionAnchored(anchor, popover, 'top', offset);
    expect(pos.placement).toBe('top');
  });
});

describe('positionAnchored with viewport (flip + shift)', () => {
  const viewport = { width: 800, height: 600 };
  const popover = rect(0, 0, 60, 16);
  const offset = 8;

  it('does not flip when the requested placement fits', () => {
    // Mid-viewport anchor: plenty of room for top placement.
    const anchor = rect(300, 400, 40, 20);
    const pos = positionAnchored(anchor, popover, 'top', offset, viewport);
    expect(pos.placement).toBe('top');
    // top: 300 - 16 - 8 = 276
    expect(pos.top).toBe(276);
  });

  it('flips top→bottom when top overflows upward', () => {
    // Anchor near the top: no room above for a 16-tall popover + 8 offset.
    const anchor = rect(10, 400, 40, 20);
    const pos = positionAnchored(anchor, popover, 'top', offset, viewport);
    expect(pos.placement).toBe('bottom');
    // bottom: anchor.bottom + offset = 30 + 8 = 38
    expect(pos.top).toBe(38);
  });

  it('flips bottom→top when bottom overflows downward', () => {
    // Anchor near the bottom of a 600-tall viewport.
    const anchor = rect(590, 400, 40, 10);
    const pos = positionAnchored(anchor, popover, 'bottom', offset, viewport);
    expect(pos.placement).toBe('top');
    // top: 590 - 16 - 8 = 566
    expect(pos.top).toBe(566);
  });

  it('flips left→right when left overflows', () => {
    const anchor = rect(200, 10, 40, 20);
    const pos = positionAnchored(anchor, popover, 'left', offset, viewport);
    expect(pos.placement).toBe('right');
    // right: anchor.right + offset = 50 + 8 = 58
    expect(pos.left).toBe(58);
  });

  it('flips right→left when right overflows', () => {
    const anchor = rect(200, 770, 40, 20);
    const pos = positionAnchored(anchor, popover, 'right', offset, viewport);
    expect(pos.placement).toBe('left');
    // left: anchor.left - popover.width - offset = 770 - 60 - 8 = 702
    expect(pos.left).toBe(702);
  });

  it('keeps the requested placement when both sides overflow equally', () => {
    // A viewport so small neither top nor bottom fits.
    const cramped = { width: 200, height: 30 };
    const bigPopover = rect(0, 0, 40, 40);
    const anchor = rect(10, 80, 40, 10);
    const pos = positionAnchored(anchor, bigPopover, 'top', offset, cramped);
    // Top overflows |10 - 40 - 8| = 38; bottom overflows 10+10+8+40 - 30 = 38.
    // Tie → keep requested.
    expect(pos.placement).toBe('top');
  });

  it('keeps the requested placement when opposite overflows more', () => {
    // Anchor positioned so top slightly overflows but bottom would overflow more.
    // Viewport 50 tall; anchor top=5 height=20, popover 16-tall, offset 8.
    // top overflow: |5 - 16 - 8| = 19; bottom overflow: (25 + 8 + 16) - 50 = -1 → 0.
    // Here bottom fits perfectly, so flip WOULD happen. Let's invert: anchor near bottom.
    const smallViewport = { width: 800, height: 50 };
    const anchor = rect(5, 400, 40, 20);
    const pos = positionAnchored(anchor, popover, 'top', offset, smallViewport);
    // top overflow: |5 - 16 - 8| = 19
    // bottom overflow: (5 + 20 + 8 + 16) - 50 = -1 → 0; bottom fits → flip.
    expect(pos.placement).toBe('bottom');
    // But this was meant to prove "stay requested when opposite is worse".
    // Reverse the setup:
    const anchor2 = rect(45, 400, 40, 20);
    const pos2 = positionAnchored(anchor2, popover, 'bottom', offset, smallViewport);
    // bottom overflow: 65 + 8 + 16 - 50 = 39; top overflow: |45 - 16 - 8| = 0 → fits → flip.
    expect(pos2.placement).toBe('top');
    // Now a real "stay requested" case: tiny viewport both ways.
    const tiny = { width: 800, height: 20 };
    const anchor3 = rect(8, 400, 40, 4);
    // top overflow: |8 - 16 - 8| = 16; bottom overflow: 12 + 8 + 16 - 20 = 16. Tie.
    const pos3 = positionAnchored(anchor3, popover, 'top', offset, tiny);
    expect(pos3.placement).toBe('top');
  });

  it('shifts left to keep popover inside when it would extend past viewport right', () => {
    // Anchor hugging the right edge; bottom placement would center off-screen.
    const anchor = rect(300, 780, 40, 20);
    const pos = positionAnchored(anchor, popover, 'bottom', offset, viewport);
    // raw left: 780 + (40 - 60) / 2 = 770; max allowed = 800 - 60 = 740.
    expect(pos.left).toBe(740);
  });

  it('shifts left to 0 when popover would extend past viewport left', () => {
    // Anchor hugging the left edge.
    const anchor = rect(300, 5, 40, 20);
    const pos = positionAnchored(anchor, popover, 'bottom', offset, viewport);
    // raw left: 5 + (40 - 60) / 2 = -5 → clamped to 0.
    expect(pos.left).toBe(0);
  });

  it('shifts the top axis when the popover would overflow for left/right placement', () => {
    // A tall popover + short anchor near the bottom of the viewport.
    const tallPopover = rect(0, 0, 60, 200);
    const anchor = rect(580, 400, 40, 10);
    const pos = positionAnchored(anchor, tallPopover, 'right', offset, viewport);
    // raw top: 580 + (10 - 200) / 2 = 485; max = 600 - 200 = 400.
    expect(pos.top).toBe(400);
  });

  it('clamps to 0 when the popover is larger than the viewport in a dimension', () => {
    // Popover wider than the viewport.
    const hugePopover = rect(0, 0, 1000, 40);
    const smallViewport = { width: 300, height: 400 };
    const anchor = rect(100, 150, 40, 20);
    const pos = positionAnchored(anchor, hugePopover, 'bottom', offset, smallViewport);
    // maxLeft = max(0, 300 - 1000) = 0 → left clamped to 0.
    expect(pos.left).toBe(0);
  });
});
