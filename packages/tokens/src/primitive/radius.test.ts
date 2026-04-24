import { describe, expect, it } from 'vitest';
import { radius } from './radius.ts';

describe('primitive radius', () => {
  it('uses the integer-step scale (0, 2, 4, 8)', () => {
    expect(Object.keys(radius)).toEqual(['0', '2', '4', '8']);
  });

  it('step 0 is the literal "0"', () => {
    expect(radius[0]).toBe('0');
  });

  it('non-zero steps are rem-based', () => {
    for (const [key, value] of Object.entries(radius)) {
      if (key === '0') continue;
      expect(value).toMatch(/rem$/);
    }
  });
});
