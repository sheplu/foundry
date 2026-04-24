import { describe, expect, it } from 'vitest';
import { space } from './space.ts';

describe('primitive space', () => {
  it('uses the integer-step scale (0, 1, 2, 4, 8, 12, 16, 24, 32)', () => {
    expect(Object.keys(space)).toEqual(['0', '1', '2', '4', '8', '12', '16', '24', '32']);
  });

  it('step 0 is the literal "0" (not a rem)', () => {
    expect(space[0]).toBe('0');
  });

  it('non-zero steps are rem-based and strictly increasing', () => {
    const remSteps: number[] = [];
    for (const [key, value] of Object.entries(space)) {
      if (key === '0') continue;
      expect(value).toMatch(/rem$/);
      remSteps.push(parseFloat(value));
    }
    const sorted = [...remSteps].sort((a, b) => a - b);
    expect(remSteps).toEqual(sorted);
  });
});
