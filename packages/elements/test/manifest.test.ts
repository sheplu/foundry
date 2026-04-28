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

  it('declares <foundry-stack> with its one attribute', () => {
    const stack = findByTag('foundry-stack');
    expect(stack).toBeDefined();
    const attrs = (stack?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['space']);
  });

  it('declares stack CSS custom properties', () => {
    const stack = findByTag('foundry-stack');
    const props = (stack?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-stack-gap');
    expect(props).toContain('--foundry-stack-gap-xs');
    expect(props).toContain('--foundry-stack-gap-md');
    expect(props).toContain('--foundry-stack-gap-lg');
  });

  it('declares <foundry-cluster> with its one attribute', () => {
    const cluster = findByTag('foundry-cluster');
    expect(cluster).toBeDefined();
    const attrs = (cluster?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['space']);
  });

  it('declares cluster CSS custom properties', () => {
    const cluster = findByTag('foundry-cluster');
    const props = (cluster?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-cluster-gap');
    expect(props).toContain('--foundry-cluster-gap-xs');
    expect(props).toContain('--foundry-cluster-gap-md');
    expect(props).toContain('--foundry-cluster-gap-lg');
    expect(props).toContain('--foundry-cluster-wrap');
    expect(props).toContain('--foundry-cluster-align');
  });

  it('declares <foundry-inset> with its one attribute', () => {
    const inset = findByTag('foundry-inset');
    expect(inset).toBeDefined();
    const attrs = (inset?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['space']);
  });

  it('declares inset CSS custom properties', () => {
    const inset = findByTag('foundry-inset');
    const props = (inset?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-inset-padding');
    expect(props).toContain('--foundry-inset-padding-sm');
    expect(props).toContain('--foundry-inset-padding-md');
    expect(props).toContain('--foundry-inset-padding-lg');
    expect(props).toContain('--foundry-inset-display');
  });

  it('declares <foundry-divider> with its one attribute', () => {
    const divider = findByTag('foundry-divider');
    expect(divider).toBeDefined();
    const attrs = (divider?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['orientation']);
  });

  it('declares divider CSS custom properties', () => {
    const divider = findByTag('foundry-divider');
    const props = (divider?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-divider-color');
    expect(props).toContain('--foundry-divider-thickness');
  });

  it('declares <foundry-badge> with its one attribute', () => {
    const badge = findByTag('foundry-badge');
    expect(badge).toBeDefined();
    const attrs = (badge?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toEqual(['variant']);
  });

  it('declares badge CSS custom properties', () => {
    const badge = findByTag('foundry-badge');
    const props = (badge?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-badge-background');
    expect(props).toContain('--foundry-badge-foreground');
    expect(props).toContain('--foundry-badge-padding');
    expect(props).toContain('--foundry-badge-radius');
    expect(props).toContain('--foundry-badge-font-size');
    expect(props).toContain('--foundry-badge-font-weight');
  });

  it('declares <foundry-alert> with its attributes', () => {
    const alert = findByTag('foundry-alert');
    expect(alert).toBeDefined();
    const attrs = (alert?.attributes ?? []).map((a) => a.name).sort();
    expect(attrs).toContain('variant');
  });

  it('declares both title and default slots for alert', () => {
    const alert = findByTag('foundry-alert');
    const slotNames = (alert?.slots ?? []).map((s) => s.name);
    expect(slotNames).toContain('title');
    expect(slotNames).toContain('');
  });

  it('declares alert CSS parts', () => {
    const alert = findByTag('foundry-alert');
    const parts = (alert?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('container');
    expect(parts).toContain('title');
    expect(parts).toContain('body');
  });

  it('declares alert CSS custom properties', () => {
    const alert = findByTag('foundry-alert');
    const props = (alert?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-alert-background');
    expect(props).toContain('--foundry-alert-foreground');
    expect(props).toContain('--foundry-alert-border-color');
    expect(props).toContain('--foundry-alert-border-width');
    expect(props).toContain('--foundry-alert-padding');
    expect(props).toContain('--foundry-alert-radius');
    expect(props).toContain('--foundry-alert-font-size');
    expect(props).toContain('--foundry-alert-line-height');
    expect(props).toContain('--foundry-alert-title-font-weight');
  });
});
