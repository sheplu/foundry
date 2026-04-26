import { describe, expect, it } from 'vitest';
import { componentTokenName, tokenName } from './types.ts';

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

describe('componentTokenName', () => {
  it('strips the foundry- prefix to avoid double-prefixing', () => {
    expect(componentTokenName('foundry-button', ['background', 'primary']))
      .toBe('--foundry-button-background-primary');
  });

  it('uses the raw component name when it does not start with foundry-', () => {
    expect(componentTokenName('dialog', ['padding-inline']))
      .toBe('--foundry-dialog-padding-inline');
  });

  it('handles single-segment paths', () => {
    expect(componentTokenName('foundry-icon', ['size'])).toBe('--foundry-icon-size');
  });
});
