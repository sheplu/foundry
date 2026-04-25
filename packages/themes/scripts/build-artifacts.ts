import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { darkColor } from '../src/dark.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');
const tokensRoot = resolve(packageRoot, '..', 'tokens', 'dist', 'css');
const defaultDist = resolve(packageRoot, 'dist');

function requireTokensCss(): { primitive: string; semantic: string } {
  const primitive = resolve(tokensRoot, 'primitive.css');
  const semantic = resolve(tokensRoot, 'semantic.css');
  if (!existsSync(primitive) || !existsSync(semantic)) {
    throw new Error(
      `@foundry/tokens CSS artifacts missing at ${tokensRoot}. `
      + 'Run `npm run build -w @foundry/tokens` first.',
    );
  }
  return {
    primitive: readFileSync(primitive, 'utf8'),
    semantic: readFileSync(semantic, 'utf8'),
  };
}

function ruleBlock(selector: string, overrides: Readonly<Record<string, string>>): string {
  const lines = Object.entries(overrides).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

function buildDefaultCss(primitive: string, semantic: string): string {
  return `/* @foundry/themes — default theme */\n${primitive}\n${semantic}`;
}

function extractLightOverrides(
  semanticCss: string,
  keys: readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const match = semanticCss.match(new RegExp(`${key.replaceAll('-', '\\-')}:\\s*([^;]+);`));
    if (!match?.[1]) {
      throw new Error(`light value for ${key} not found in @foundry/tokens/semantic.css`);
    }
    out[key] = match[1].trim();
  }
  return out;
}

function buildDarkCss(
  overrides: Readonly<Record<string, string>>,
  semanticCss: string,
): string {
  const media = `@media (prefers-color-scheme: dark) {\n${ruleBlock(':root', overrides)
    .split('\n').map((l) => l ? `  ${l}` : l).join('\n').trimEnd()}\n}\n`;
  const optIn = ruleBlock('[data-theme="dark"]', overrides);
  const light = extractLightOverrides(semanticCss, Object.keys(overrides));
  const optOut = ruleBlock('[data-theme="light"]', light);
  return `/* @foundry/themes — dark theme */\n${media}\n${optOut}\n${optIn}`;
}

export function build(outDir: string = defaultDist): void {
  const cssOut = resolve(outDir, 'css');
  mkdirSync(cssOut, { recursive: true });

  const { primitive, semantic } = requireTokensCss();
  writeFileSync(resolve(cssOut, 'default.css'), buildDefaultCss(primitive, semantic), 'utf8');
  writeFileSync(resolve(cssOut, 'dark.css'), buildDarkCss(darkColor, semantic), 'utf8');
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  build();
  process.stdout.write(`Wrote theme artifacts to ${defaultDist}\n`);
}
