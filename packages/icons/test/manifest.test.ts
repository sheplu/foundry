import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

interface NamedEntry { name: string }

interface Declaration {
  name: string;
  tagName?: string;
  attributes?: NamedEntry[];
  cssParts?: NamedEntry[];
  cssProperties?: NamedEntry[];
}

interface Manifest {
  schemaVersion: string;
  modules: { declarations: Declaration[] }[];
}

const manifestPath = resolve(process.cwd(), 'packages/icons/custom-elements.json');
const raw = readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw) as Manifest;

function findByTag(tag: string): Declaration | undefined {
  return manifest.modules.flatMap((m) => m.declarations).find((d) => d.tagName === tag);
}

describe('@foundry/icons custom-elements.json', () => {
  it('declares a valid schema version', () => {
    expect(manifest.schemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('declares <foundry-icon> with its two attributes', () => {
    const icon = findByTag('foundry-icon');
    expect(icon).toBeDefined();
    const attrs = (icon?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['label', 'name']);
  });

  it('declares the inner CSS part on <foundry-icon>', () => {
    const icon = findByTag('foundry-icon');
    expect(icon?.cssParts?.map((p) => p.name)).toContain('inner');
  });

  it('lists --foundry-icon-size as a CSS custom property', () => {
    const icon = findByTag('foundry-icon');
    const props = (icon?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-icon-size');
  });

  it('declares <foundry-icon-button> with its six attributes', () => {
    const btn = findByTag('foundry-icon-button');
    expect(btn).toBeDefined();
    const attrs = (btn?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['disabled', 'label', 'loading', 'name', 'type', 'variant']);
  });

  it('declares button, icon, and spinner CSS parts on <foundry-icon-button>', () => {
    const btn = findByTag('foundry-icon-button');
    const parts = (btn?.cssParts ?? []).map((p) => p.name).sort();
    expect(parts).toEqual(['button', 'icon', 'spinner']);
  });
});
