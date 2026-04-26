import { describe, expect, it } from 'vitest';
import { lineHeight } from './line-height.ts';

describe('primitive line-height', () => {
  it('uses the 100/200/300 numeric scale', () => {
    expect(Object.keys(lineHeight)).toEqual(['100', '200', '300']);
  });

  it('values are unitless multipliers, strictly increasing', () => {
    const nums: number[] = [];
    for (const value of Object.values(lineHeight)) {
      expect(value).not.toMatch(/rem|px|%/);
      nums.push(parseFloat(value));
    }
    const sorted = [...nums].sort((a, b) => a - b);
    expect(nums).toEqual(sorted);
  });
});
