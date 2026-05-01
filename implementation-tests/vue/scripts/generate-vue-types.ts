import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface AttributeEntry {
  name: string;
  type?: { text?: string };
}

interface Declaration {
  tagName?: string;
  attributes?: AttributeEntry[];
}

interface Manifest {
  modules: { declarations: Declaration[] }[];
}

export interface Tag {
  name: string;
  attributes: { name: string; type: string }[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..');

export const manifestPaths = [
  resolve(repoRoot, 'packages/elements/custom-elements.json'),
  resolve(repoRoot, 'packages/icons/custom-elements.json'),
];
export const outPath = resolve(__dirname, '..', 'src', 'vue-env.d.ts');

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
          attributes: (decl.attributes ?? []).map((a) => ({
            name: a.name,
            type: a.type?.text ?? 'string',
          })),
        });
      }
    }
  }
  return tags.sort((a, b) => a.name.localeCompare(b.name));
}

function renderProp(attr: { name: string; type: string }): string {
  return `      ${attr.name}?: ${attr.type};`;
}

function renderTag(tag: Tag): string {
  if (tag.attributes.length === 0) {
    return `    '${tag.name}': DefineComponent<Record<string, never>>;`;
  }
  const props = tag.attributes.map(renderProp).join('\n');
  return `    '${tag.name}': DefineComponent<{\n${props}\n    }>;`;
}

export function render(tags: readonly Tag[]): string {
  const entries = tags.map(renderTag).join('\n');
  return `/// <reference types="vite/client" />

// Generated from @foundry/elements and @foundry/icons custom-elements.json.
// DO NOT EDIT BY HAND — run \`npm run generate:types -w @foundry/vue-canary\`
// after changing a component's public API. The manifest is the source of truth.

import type { DefineComponent } from 'vue';

declare module '*.vue' {
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}

declare module 'vue' {
  interface GlobalComponents {
${entries}
  }
}
`;
}

export function generate(target: string = outPath): string {
  const content = render(loadTags());
  writeFileSync(target, content, 'utf8');
  return content;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  generate();
  process.stdout.write(`Wrote Vue types to ${outPath}\n`);
}
