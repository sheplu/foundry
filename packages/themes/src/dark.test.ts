import { describe, expect, it } from 'vitest';
import { semantics } from '@foundry/tokens';
import { darkColor } from './dark.ts';

const semanticColorNames = new Set(
  semantics.filter((s) => s.category === 'color').map((s) => s.name),
);

describe('dark theme color map', () => {
  it('every override targets a declared semantic color token', () => {
    for (const name of Object.keys(darkColor)) {
      expect.soft(semanticColorNames.has(name), `${name} is not a known semantic color token`)
        .toBe(true);
    }
  });

  it('every override value references a primitive color token', () => {
    const varRef = /^var\(\s*(--foundry-color-[a-z]+-\d+)\s*\)$/;
    for (const [name, value] of Object.entries(darkColor)) {
      expect.soft(value, `${name} → ${value}`).toMatch(varRef);
    }
  });

  it('covers every semantic color token (no accidental gaps)', () => {
    for (const name of semanticColorNames) {
      expect.soft(name in darkColor, `${name} has no dark-mode override`).toBe(true);
    }
  });
});
