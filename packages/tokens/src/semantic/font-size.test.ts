import { describe, expect, it } from 'vitest';
import { body, caption, heading } from './font-size.ts';

const varRef = /^var\(--foundry-font-size-\d+\)$/;

describe('semantic font-size', () => {
  it('every value is a var() reference to a font-size primitive', () => {
    const all = [...Object.values(body), ...Object.values(heading), ...Object.values(caption)];
    for (const value of all) {
      expect(value).toMatch(varRef);
    }
  });

  it('body uses default + sm', () => {
    expect(Object.keys(body)).toEqual(['_', 'sm']);
  });

  it('heading uses sm/md/lg/xl t-shirt sizes', () => {
    expect(Object.keys(heading)).toEqual(['sm', 'md', 'lg', 'xl']);
  });

  it('caption has a single default', () => {
    expect(Object.keys(caption)).toEqual(['_']);
  });
});
