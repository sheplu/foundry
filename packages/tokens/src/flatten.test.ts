import { describe, expect, it } from 'vitest';
import { flatten } from './flatten.ts';

describe('flatten', () => {
  it('produces one entry per leaf', () => {
    const entries = flatten('primitive', 'space', { 0: '0', 4: '1rem' });
    expect(entries).toEqual([
      { name: '--foundry-space-0', value: '0', tier: 'primitive', category: 'space', path: ['0'] },
      { name: '--foundry-space-4', value: '1rem', tier: 'primitive', category: 'space', path: ['4'] },
    ]);
  });

  it('nests paths with - joiner', () => {
    const entries = flatten('primitive', 'color', { blue: { 500: '#3b82f6' } });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      name: '--foundry-color-blue-500',
      value: '#3b82f6',
      path: ['blue', '500'],
    });
  });

  it('treats "_" keys as the parent path itself', () => {
    const entries = flatten('semantic', 'color', {
      surface: { _: 'var(--foundry-color-gray-50)', subtle: 'var(--foundry-color-gray-100)' },
    });
    expect(entries.find((e) => e.name === '--foundry-color-surface')).toBeDefined();
    expect(entries.find((e) => e.name === '--foundry-color-surface-subtle')).toBeDefined();
  });
});
