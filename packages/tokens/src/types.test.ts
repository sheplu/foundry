import { describe, expect, it } from 'vitest';
import { tokenName } from './types.ts';

describe('tokenName', () => {
  it('joins segments with -foundry- prefix', () => {
    expect(tokenName('color', ['blue', '500'])).toBe('--foundry-color-blue-500');
    expect(tokenName('space', ['4'])).toBe('--foundry-space-4');
    expect(tokenName('radius', ['2'])).toBe('--foundry-radius-2');
  });

  it('preserves already-kebab-cased segments', () => {
    expect(tokenName('color', ['action', 'primary-hover']))
      .toBe('--foundry-color-action-primary-hover');
  });

  it('handles single-segment paths', () => {
    expect(tokenName('color', ['surface'])).toBe('--foundry-color-surface');
  });
});
