import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface AttributeEntry {
  name: string;
  type?: { text?: string };
  description?: string;
}

interface Declaration {
  tagName?: string;
  description?: string;
  attributes?: AttributeEntry[];
}

interface Manifest {
  modules: { declarations: Declaration[] }[];
}

export interface Tag {
  name: string;
  description?: string;
  attributes: {
    name: string;
    description?: string;
    values?: { name: string }[];
  }[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..');

export const manifestPaths = [
  resolve(repoRoot, 'packages/elements/custom-elements.json'),
  resolve(repoRoot, 'packages/icons/custom-elements.json'),
];
export const outPath = resolve(__dirname, '..', 'html-custom-data.json');

function parseValues(type: string | undefined): { name: string }[] | undefined {
  if (!type) return undefined;
  // Simple string-literal-union parser: "'a' | 'b' | 'c'" -> [{name:'a'}, …].
  // Skips anything that isn't clean literals (e.g. 'string', 'boolean', generics).
  const literalRe = /^\s*'([^']+)'(\s*\|\s*'([^']+)')*\s*$/;
  if (!literalRe.test(type)) return undefined;
  const matches = [...type.matchAll(/'([^']+)'/g)];
  return matches
    .map((m) => m[1])
    .filter((name): name is string => name !== undefined)
    .map((name) => ({ name }));
}

export function loadTags(paths: readonly string[] = manifestPaths): Tag[] {
  const tags: Tag[] = [];
  for (const path of paths) {
    const raw = readFileSync(path, 'utf8');
    const manifest = JSON.parse(raw) as Manifest;
    for (const mod of manifest.modules) {
      for (const decl of mod.declarations ?? []) {
        if (!decl.tagName) continue;
        tags.push({
          name: decl.tagName,
          description: decl.description,
          attributes: (decl.attributes ?? []).map((a) => {
            const values = parseValues(a.type?.text);
            return {
              name: a.name,
              description: a.description,
              ...(values ? { values } : {}),
            };
          }),
        });
      }
    }
  }
  return tags.sort((a, b) => a.name.localeCompare(b.name));
}

export function render(tags: readonly Tag[]): string {
  const data = {
    version: 1.1,
    tags,
  };
  return `${JSON.stringify(data, null, 2)}\n`;
}

export function generate(target: string = outPath): string {
  const content = render(loadTags());
  writeFileSync(target, content, 'utf8');
  return content;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  generate();
  process.stdout.write(`Wrote html custom data to ${outPath}\n`);
}
