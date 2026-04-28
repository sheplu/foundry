import { describe, expect, it } from 'vitest';
import { action, border, intent, surface, text } from './color.ts';

const varRef = /^var\(--foundry-color-[a-z0-9-]+\)$/;

describe('semantic color', () => {
  it('every value is a var() reference to a color primitive', () => {
    const flat = { ...surface, ...text, ...border, ...action };
    for (const value of Object.values(flat)) {
      expect(value).toMatch(varRef);
    }
    for (const family of Object.values(intent)) {
      for (const value of Object.values(family)) {
        expect(value).toMatch(varRef);
      }
    }
  });

  it('exposes the expected top-level groups', () => {
    expect(Object.keys(surface)).toContain('_');
    expect(Object.keys(text)).toContain('body');
    expect(Object.keys(action)).toContain('primary');
    expect(Object.keys(action)).toContain('primary-hover');
  });

  it('intent family covers five status variants, each with bg + fg', () => {
    expect(Object.keys(intent).sort()).toEqual(['danger', 'info', 'neutral', 'success', 'warning']);
    for (const family of Object.values(intent)) {
      expect(Object.keys(family).sort()).toEqual(['background', 'foreground']);
    }
  });
});
