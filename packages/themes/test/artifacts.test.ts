import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from '../scripts/build-artifacts.ts';
import { primitives, semantics } from '@foundry/tokens';
import { darkColor } from '../src/dark.ts';

let outDir: string;

beforeAll(() => {
  outDir = mkdtempSync(join(tmpdir(), 'foundry-themes-'));
  build(outDir);
});

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

describe('default theme artifact', () => {
  it('contains every primitive token exactly once', () => {
    const css = readFileSync(resolve(outDir, 'css', 'default.css'), 'utf8');
    for (const entry of primitives) {
      const matches = css.match(new RegExp(`${entry.name.replaceAll('-', '\\-')}:`, 'g'));
      expect(matches, `${entry.name} should appear exactly once`).toHaveLength(1);
    }
  });

  it('contains every semantic token exactly once', () => {
    const css = readFileSync(resolve(outDir, 'css', 'default.css'), 'utf8');
    for (const entry of semantics) {
      const matches = css.match(new RegExp(`${entry.name.replaceAll('-', '\\-')}:`, 'g'));
      expect(matches, `${entry.name} should appear exactly once`).toHaveLength(1);
    }
  });
});

describe('dark theme artifact', () => {
  it('wraps overrides in a prefers-color-scheme media query', () => {
    const css = readFileSync(resolve(outDir, 'css', 'dark.css'), 'utf8');
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{/);
  });

  it('declares the [data-theme="dark"] opt-in scope', () => {
    const css = readFileSync(resolve(outDir, 'css', 'dark.css'), 'utf8');
    expect(css).toContain('[data-theme="dark"] {');
  });

  it('declares the [data-theme="light"] opt-out scope', () => {
    const css = readFileSync(resolve(outDir, 'css', 'dark.css'), 'utf8');
    expect(css).toContain('[data-theme="light"] {');
  });

  it('every dark override appears in both @media and [data-theme="dark"]', () => {
    const css = readFileSync(resolve(outDir, 'css', 'dark.css'), 'utf8');
    for (const [name, value] of Object.entries(darkColor)) {
      const escapedValue = value.replaceAll(/[-()/\\]/g, '\\$&');
      const matches = css.match(
        new RegExp(`${name.replaceAll('-', '\\-')}:\\s*${escapedValue};`, 'g'),
      );
      expect(matches, `${name}: ${value} should appear twice (media + [data-theme="dark"])`)
        .toHaveLength(2);
    }
  });

  it('every semantic color has a light opt-out value', () => {
    const css = readFileSync(resolve(outDir, 'css', 'dark.css'), 'utf8');
    for (const name of Object.keys(darkColor)) {
      const lightBlockMatch = css.match(/\[data-theme="light"\] \{([^}]+)\}/);
      expect(lightBlockMatch?.[1]).toContain(name);
    }
  });
});
