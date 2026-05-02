export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface Position {
  top: number;
  left: number;
}

/**
 * Compute the top-left coordinates for a popover anchored to `anchor`,
 * given a `placement` and the offset between them.
 *
 * Coordinates are in the viewport coordinate space, matching
 * `position: fixed`. The popover is centered on the perpendicular axis:
 *  - For `top`/`bottom`, centered horizontally over the anchor.
 *  - For `left`/`right`, centered vertically over the anchor.
 *
 * Top/left are clamped to `>= 0` so an off-screen trigger doesn't
 * produce negative coordinates. Full flip/shift logic is deliberately
 * omitted — a future iteration (shared with `<foundry-select>` and
 * `<foundry-menu>`) will handle viewport collisions.
 */
export function positionAnchored(
  anchor: DOMRect,
  popover: DOMRect,
  placement: PopoverPlacement,
  offset: number,
): Position {
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'top':
      top = anchor.top - popover.height - offset;
      left = anchor.left + (anchor.width - popover.width) / 2;
      break;
    case 'bottom':
      top = anchor.bottom + offset;
      left = anchor.left + (anchor.width - popover.width) / 2;
      break;
    case 'left':
      top = anchor.top + (anchor.height - popover.height) / 2;
      left = anchor.left - popover.width - offset;
      break;
    case 'right':
      top = anchor.top + (anchor.height - popover.height) / 2;
      left = anchor.right + offset;
      break;
  }

  return {
    top: Math.max(0, top),
    left: Math.max(0, left),
  };
}
