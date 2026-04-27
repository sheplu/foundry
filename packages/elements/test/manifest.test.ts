import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface NamedEntry { name: string }

interface Declaration {
  name: string;
  tagName?: string;
  attributes?: NamedEntry[];
  slots?: NamedEntry[];
  cssParts?: NamedEntry[];
  cssProperties?: NamedEntry[];
}

interface Manifest {
  schemaVersion: string;
  modules: { declarations: Declaration[] }[];
}

const manifestPath = resolve(process.cwd(), 'packages/elements/custom-elements.json');
const raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw) as Manifest;

function findByTag(tag: string): Declaration | undefined {
  return manifest.modules.flatMap((m) => m.declarations).find((d) => d.tagName === tag);
}

describe('custom-elements.json', () => {
  it('declares a valid schema version', () => {
    expect(manifest.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('declares <foundry-button> with its three attributes', () => {
    const button = findByTag('foundry-button');
    expect(button).toBeDefined();
    const attrs = (button?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['disabled', 'type', 'variant']);
  });

  it('declares the default slot and the button CSS part', () => {
    const button = findByTag('foundry-button');
    expect(button?.slots?.map((s) => s.name)).toContain('');
    expect(button?.cssParts?.map((p) => p.name)).toContain('button');
  });

  it('lists the expected component-tier CSS custom properties', () => {
    const button = findByTag('foundry-button');
    const props = (button?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-button-background');
    expect(props).toContain('--foundry-button-radius');
    expect(props).toContain('--foundry-button-focus-outline');
  });

  it('declares <foundry-heading> with its two attributes', () => {
    const heading = findByTag('foundry-heading');
    expect(heading).toBeDefined();
    const attrs = (heading?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['level', 'size']);
  });

  it('declares heading typography CSS custom properties', () => {
    const heading = findByTag('foundry-heading');
    const props = (heading?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-heading-font-weight');
    expect(props).toContain('--foundry-heading-line-height');
    expect(props).toContain('--foundry-heading-font-size-lg');
  });

  it('declares <foundry-text> with its one attribute', () => {
    const text = findByTag('foundry-text');
    expect(text).toBeDefined();
    const attrs = (text?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['variant']);
  });

  it('declares text typography CSS custom properties', () => {
    const text = findByTag('foundry-text');
    const props = (text?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-text-font-size');
    expect(props).toContain('--foundry-text-font-weight');
    expect(props).toContain('--foundry-text-line-height');
    expect(props).toContain('--foundry-text-font-size-caption');
  });
});
