import { describe, expect, it } from 'vitest';
import { action, border, surface, text } from './color.ts';

const varRef = /^var\(--foundry-color-[a-z0-9-]+\)$/;

describe('semantic color', () => {
  it('every value is a var() reference to a color primitive', () => {
    const all = { ...surface, ...text, ...border, ...action };
    for (const value of Object.values(all)) {
      expect(value).toMatch(varRef);
    }
  });

  it('exposes the expected top-level groups', () => {
    expect(Object.keys(surface)).toContain('_');
    expect(Object.keys(text)).toContain('body');
    expect(Object.keys(action)).toContain('primary');
    expect(Object.keys(action)).toContain('primary-hover');
  });
});
