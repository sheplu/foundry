import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { primitives, semantics, type TokenEntry } from '@foundry/tokens';
import { darkColor } from '../src/dark.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultDist = resolve(__dirname, '..', 'dist');

function ruleBlock(selector: string, overrides: Readonly<Record<string, string>>): string {
  const lines = Object.entries(overrides).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

function cssSheet(entries: readonly TokenEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of entries) out[e.name] = e.value;
  return out;
}

function buildDefaultCss(): string {
  const primitiveBlock = ruleBlock(':root', cssSheet(primitives));
  const semanticBlock = ruleBlock(':root', cssSheet(semantics));
  return `/* @foundry/themes — default theme */\n${primitiveBlock}\n${semanticBlock}`;
}

function lightOverridesFor(keys: readonly string[]): Record<string, string> {
  const byName = cssSheet(semantics);
  const out: Record<string, string> = {};
  for (const key of keys) {
    const value = byName[key];
    if (!value) throw new Error(`light value for ${key} not found in @foundry/tokens semantics`);
    out[key] = value;
  }
  return out;
}

function buildDarkCss(overrides: Readonly<Record<string, string>>): string {
  const media = `@media (prefers-color-scheme: dark) {\n${ruleBlock(':root', overrides)
    .split('\n').map((l) => l ? `  ${l}` : l).join('\n').trimEnd()}\n}\n`;
  const optIn = ruleBlock('[data-theme="dark"]', overrides);
  const optOut = ruleBlock('[data-theme="light"]', lightOverridesFor(Object.keys(overrides)));
  return `/* @foundry/themes — dark theme */\n${media}\n${optOut}\n${optIn}`;
}

export function build(outDir: string = defaultDist): void {
  const cssOut = resolve(outDir, 'css');
  mkdirSync(cssOut, { recursive: true });

  writeFileSync(resolve(cssOut, 'default.css'), buildDefaultCss(), 'utf8');
  writeFileSync(resolve(cssOut, 'dark.css'), buildDarkCss(darkColor), 'utf8');
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  build();
  process.stdout.write(`Wrote theme artifacts to ${defaultDist}\n`);
}
