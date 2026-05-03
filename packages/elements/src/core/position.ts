export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface Viewport {
  width: number;
  height: number;
}

export interface Position {
  top: number;
  left: number;
  /**
   * The placement actually used. Differs from the requested placement when
   * flip triggered (e.g. requested `top` on a near-the-top anchor flipped
   * to `bottom`). When `viewport` is omitted, this is always the requested
   * placement.
   */
  placement: PopoverPlacement;
}

const OPPOSITE: Record<PopoverPlacement, PopoverPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * Compute the top-left coordinates for a popover anchored to `anchor`.
 *
 * Coordinates are in the viewport coordinate space, matching `position:
 * fixed`. The popover is centered on the perpendicular axis:
 *  - For `top`/`bottom`, centered horizontally over the anchor.
 *  - For `left`/`right`, centered vertically over the anchor.
 *
 * When `viewport` is provided, adds two collision-handling passes:
 *  1. **Flip**: if the requested placement overflows along its primary
 *     axis, compute the opposite placement's overflow. Pick whichever
 *     overflows less.
 *  2. **Shift**: clamp the perpendicular axis so the popover stays
 *     inside the viewport.
 *
 * When `viewport` is omitted, the return clamps negatives to `0` and
 * reports the requested placement — the pre-flip behaviour preserved for
 * callers that want pure rect math.
 */
export function positionAnchored(
  anchor: DOMRect,
  popover: DOMRect,
  placement: PopoverPlacement,
  offset: number,
  viewport?: Viewport,
): Position {
  if (!viewport) {
    const raw = computeRaw(anchor, popover, placement, offset);
    return {
      top: Math.max(0, raw.top),
      left: Math.max(0, raw.left),
      placement,
    };
  }

  const chosen = pickPlacement(anchor, popover, placement, offset, viewport);
  const raw = computeRaw(anchor, popover, chosen, offset);
  const { top, left } = shiftInto(raw, popover, viewport);
  return { top, left, placement: chosen };
}

function computeRaw(
  anchor: DOMRect,
  popover: DOMRect,
  placement: PopoverPlacement,
  offset: number,
): { top: number; left: number } {
  switch (placement) {
    case 'top':
      return {
        top: anchor.top - popover.height - offset,
        left: anchor.left + (anchor.width - popover.width) / 2,
      };
    case 'bottom':
      return {
        top: anchor.bottom + offset,
        left: anchor.left + (anchor.width - popover.width) / 2,
      };
    case 'left':
      return {
        top: anchor.top + (anchor.height - popover.height) / 2,
        left: anchor.left - popover.width - offset,
      };
    case 'right':
      return {
        top: anchor.top + (anchor.height - popover.height) / 2,
        left: anchor.right + offset,
      };
  }
}

/**
 * Primary-axis overflow of a placement inside a viewport (how far the
 * popover would extend past the relevant viewport edge; `0` if it fits).
 * Perpendicular-axis overflow is handled by `shiftInto`, not flip.
 */
function primaryOverflow(
  anchor: DOMRect,
  popover: DOMRect,
  placement: PopoverPlacement,
  offset: number,
  viewport: Viewport,
): number {
  const { top, left } = computeRaw(anchor, popover, placement, offset);
  if (placement === 'top') return Math.max(0, -top);
  if (placement === 'bottom') return Math.max(0, top + popover.height - viewport.height);
  if (placement === 'left') return Math.max(0, -left);
  // right
  return Math.max(0, left + popover.width - viewport.width);
}

/**
 * Pick the placement that overflows less. Ties (including both-zero)
 * go to the requested placement so consumers' preference wins when it
 * fits equally well.
 */
function pickPlacement(
  anchor: DOMRect,
  popover: DOMRect,
  requested: PopoverPlacement,
  offset: number,
  viewport: Viewport,
): PopoverPlacement {
  const primary = primaryOverflow(anchor, popover, requested, offset, viewport);
  if (primary === 0) return requested;
  const opposite = OPPOSITE[requested];
  const oppositeOverflow = primaryOverflow(anchor, popover, opposite, offset, viewport);
  return oppositeOverflow < primary ? opposite : requested;
}

/**
 * Clamp raw coordinates so the popover stays inside the viewport on
 * both axes. When the popover is larger than the viewport in a
 * dimension, its position collapses to `0` in that dimension — the
 * best we can do without resizing.
 */
function shiftInto(
  raw: { top: number; left: number },
  popover: DOMRect,
  viewport: Viewport,
): { top: number; left: number } {
  const maxLeft = Math.max(0, viewport.width - popover.width);
  const maxTop = Math.max(0, viewport.height - popover.height);
  return {
    top: Math.min(Math.max(0, raw.top), maxTop),
    left: Math.min(Math.max(0, raw.left), maxLeft),
  };
}
