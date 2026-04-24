import { describe, expect, it } from 'vitest';
import { primitives, semantics } from '../src/registry.ts';

const varRef = /var\(\s*(--foundry-[a-z0-9-]+)\s*\)/g;

function extractRefs(value: string): string[] {
  const refs: string[] = [];
  for (const m of value.matchAll(varRef)) {
    if (m[1]) refs.push(m[1]);
  }
  return refs;
}

describe('token tier boundaries', () => {
  const primitiveNames = new Set(primitives.map((p) => p.name));
  const semanticNames = new Set(semantics.map((s) => s.name));

  it('every semantic value references at least one var()', () => {
    for (const entry of semantics) {
      expect.soft(extractRefs(entry.value).length, `${entry.name} → ${entry.value}`)
        .toBeGreaterThan(0);
    }
  });

  it('every semantic var() reference resolves to a declared primitive', () => {
    for (const entry of semantics) {
      for (const ref of extractRefs(entry.value)) {
        expect.soft(primitiveNames.has(ref), `${entry.name} references unknown primitive ${ref}`)
          .toBe(true);
      }
    }
  });

  it('no semantic value references another semantic', () => {
    for (const entry of semantics) {
      for (const ref of extractRefs(entry.value)) {
        const msg = `${entry.name} references semantic ${ref} (not allowed)`;
        expect.soft(semanticNames.has(ref), msg).toBe(false);
      }
    }
  });

  it('primitive values never reference another token (they are raw)', () => {
    for (const entry of primitives) {
      expect.soft(extractRefs(entry.value).length, `${entry.name} primitive must not use var()`)
        .toBe(0);
    }
  });

  it('no duplicate token names across all tiers', () => {
    const seen = new Map<string, number>();
    for (const entry of [...primitives, ...semantics]) {
      seen.set(entry.name, (seen.get(entry.name) ?? 0) + 1);
    }
    for (const [name, count] of seen) {
      expect.soft(count, `${name} declared ${count} times`).toBe(1);
    }
  });
});
