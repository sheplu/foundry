import { describe, expect, it } from 'vitest';
import { radius } from './radius.ts';

const varRef = /^var\(--foundry-radius-\d+\)$/;

describe('semantic radius', () => {
  it('uses t-shirt sizes mapped to primitives', () => {
    expect(Object.keys(radius)).toEqual(['sharp', 'sm', 'md', 'lg']);
    for (const value of Object.values(radius)) {
      expect(value).toMatch(varRef);
    }
  });
});
