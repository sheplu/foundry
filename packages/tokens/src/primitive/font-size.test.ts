import { describe, expect, it } from 'vitest';
import { fontSize } from './font-size.ts';

describe('primitive font-size', () => {
  it('uses the 100/200/…/700 numeric scale', () => {
    expect(Object.keys(fontSize)).toEqual(['100', '200', '300', '400', '500', '600', '700']);
  });

  it('every value is rem-based', () => {
    for (const value of Object.values(fontSize)) {
      expect(value).toMatch(/rem$/);
    }
  });

  it('steps are strictly increasing', () => {
    const nums = Object.values(fontSize).map((v) => parseFloat(v));
    const sorted = [...nums].sort((a, b) => a - b);
    expect(nums).toEqual(sorted);
  });
});
