import { describe, expect, it } from 'vitest';
import { fontWeight } from './font-weight.ts';

describe('primitive font-weight', () => {
  it('uses the 100/.../900 numeric scale', () => {
    expect(Object.keys(fontWeight)).toEqual(['400', '500', '700']);
  });

  it('every value is an OpenType weight integer as a string', () => {
    for (const value of Object.values(fontWeight)) {
      expect(value).toMatch(/^\d{3}$/);
      expect(Number(value)).toBeGreaterThanOrEqual(100);
      expect(Number(value)).toBeLessThanOrEqual(900);
    }
  });
});
