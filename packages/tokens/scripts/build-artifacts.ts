import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { components, primitives, semantics } from '../src/registry.ts';
import type { TokenEntry } from '../src/types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

function cssSheet(entries: readonly TokenEntry[]): string {
  const lines = entries.map((e) => `  ${e.name}: ${e.value};`);
  return `:root {\n${lines.join('\n')}\n}\n`;
}

function jsonManifest(entries: readonly TokenEntry[]): string {
  const record: Record<string, { value: string; tier: string; category: string; path: string[] }>
    = {};
  for (const e of entries) {
    record[e.name] = { value: e.value, tier: e.tier, category: e.category, path: e.path };
  }
  return `${JSON.stringify(record, null, 2)}\n`;
}

export function build(outDir: string = distDir): void {
  const cssOut = resolve(outDir, 'css');
  mkdirSync(cssOut, { recursive: true });

  writeFileSync(resolve(cssOut, 'primitive.css'), cssSheet(primitives), 'utf8');
  writeFileSync(resolve(cssOut, 'semantic.css'), cssSheet(semantics), 'utf8');
  // Component tokens are declared inline on each component's `:host` using
  // var() fallback syntax — `var(--foundry-button-background, var(--semantic…))`.
  // Emitting a central :root sheet here would "freeze" the fallback chain at :root,
  // breaking scoped themes like `[data-theme="dark"]`. See AGENTS.md §6.1 and the
  // ADR-style comment on the approved plan for details.
  writeFileSync(
    resolve(outDir, 'tokens.json'),
    jsonManifest([...primitives, ...semantics, ...components]),
    'utf8',
  );
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  build();
  process.stdout.write(`Wrote token artifacts to ${distDir}\n`);
}
