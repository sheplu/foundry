import { describe, expect, it } from 'vitest';
import { body, emphasis, heading } from './font-weight.ts';

const varRef = /^var\(--foundry-font-weight-\d+\)$/;

describe('semantic font-weight', () => {
  it('every value is a var() reference to a font-weight primitive', () => {
    const all = [...Object.values(body), ...Object.values(heading), ...Object.values(emphasis)];
    for (const value of all) {
      expect(value).toMatch(varRef);
    }
  });

  it('each concept has a single default value', () => {
    expect(Object.keys(body)).toEqual(['_']);
    expect(Object.keys(heading)).toEqual(['_']);
    expect(Object.keys(emphasis)).toEqual(['_']);
  });
});
