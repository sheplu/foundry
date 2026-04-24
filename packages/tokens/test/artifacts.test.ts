import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from '../scripts/build-artifacts.ts';
import { primitives, semantics } from '../src/registry.ts';

let outDir: string;

beforeAll(() => {
  outDir = mkdtempSync(join(tmpdir(), 'foundry-tokens-'));
  build(outDir);
});

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

describe('token artifacts', () => {
  it('writes primitive.css with every primitive token', () => {
    const css = readFileSync(resolve(outDir, 'css', 'primitive.css'), 'utf8');
    for (const entry of primitives) {
      expect(css).toContain(`${entry.name}: ${entry.value};`);
    }
  });

  it('writes semantic.css with every semantic token', () => {
    const css = readFileSync(resolve(outDir, 'css', 'semantic.css'), 'utf8');
    for (const entry of semantics) {
      expect(css).toContain(`${entry.name}: ${entry.value};`);
    }
  });

  it('writes tokens.json with every token as a flat record', () => {
    const raw = readFileSync(resolve(outDir, 'tokens.json'), 'utf8');
    interface ManifestEntry {
      value: string;
      tier: string;
      category: string;
      path: string[];
    }
    const json = JSON.parse(raw) as Record<string, ManifestEntry>;

    for (const entry of [...primitives, ...semantics]) {
      expect(json[entry.name]).toEqual({
        value: entry.value,
        tier: entry.tier,
        category: entry.category,
        path: entry.path,
      });
    }
  });

  it('each token name appears exactly once in the CSS sheets', () => {
    const primitiveCss = readFileSync(resolve(outDir, 'css', 'primitive.css'), 'utf8');
    const semanticCss = readFileSync(resolve(outDir, 'css', 'semantic.css'), 'utf8');
    const combined = primitiveCss + '\n' + semanticCss;

    for (const entry of [...primitives, ...semantics]) {
      const matches = combined.match(new RegExp(`${entry.name.replaceAll('-', '\\-')}:`, 'g'));
      expect(matches).toHaveLength(1);
    }
  });
});
