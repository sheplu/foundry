import { describe, expect, it } from 'vitest';
import { inline, inset, stack } from './space.ts';

const varRef = /^var\(--foundry-space-\d+\)$/;

describe('semantic space', () => {
  it('every value is a var() reference to a space primitive', () => {
    const all = [...Object.values(inline), ...Object.values(stack), ...Object.values(inset)];
    for (const value of all) {
      expect(value).toMatch(varRef);
    }
  });

  it('inline and stack share the xs/sm/md/lg t-shirt sizes', () => {
    expect(Object.keys(inline)).toEqual(['xs', 'sm', 'md', 'lg']);
    expect(Object.keys(stack)).toEqual(['xs', 'sm', 'md', 'lg']);
  });

  it('inset uses sm/md/lg only', () => {
    expect(Object.keys(inset)).toEqual(['sm', 'md', 'lg']);
  });
});
