/**
 * Primitive line height scale. Unitless multipliers so line-height scales with
 * the element's own font-size.
 * 100 = 1.0 (tight, display); 200 = 1.4 (body); 300 = 1.6 (loose, long-form).
 */
export const lineHeight = {
  100: '1',
  200: '1.4',
  300: '1.6',
} as const;
