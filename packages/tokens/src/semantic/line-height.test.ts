import { describe, expect, it } from 'vitest';
import { body, caption, heading } from './line-height.ts';

const varRef = /^var\(--foundry-line-height-\d+\)$/;

describe('semantic line-height', () => {
  it('every value is a var() reference to a line-height primitive', () => {
    const all = [...Object.values(body), ...Object.values(heading), ...Object.values(caption)];
    for (const value of all) {
      expect(value).toMatch(varRef);
    }
  });

  it('each concept has a single default value', () => {
    expect(Object.keys(body)).toEqual(['_']);
    expect(Object.keys(heading)).toEqual(['_']);
    expect(Object.keys(caption)).toEqual(['_']);
  });
});
