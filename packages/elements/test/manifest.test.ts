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
  events?: NamedEntry[];
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

  it('declares <foundry-text-field> with its form-control attributes', () => {
    const tf = findByTag('foundry-text-field');
    expect(tf).toBeDefined();
    const attrs = (tf?.attributes ?? []).map((a) => a.name);
    // Spot-check the surface; full set is declared by JSDoc.
    expect(attrs).toContain('name');
    expect(attrs).toContain('value');
    expect(attrs).toContain('type');
    expect(attrs).toContain('required');
    expect(attrs).toContain('disabled');
    expect(attrs).toContain('readonly');
    expect(attrs).toContain('pattern');
    expect(attrs).toContain('invalid');
  });

  it('declares label, hint, and error slots for text-field', () => {
    const tf = findByTag('foundry-text-field');
    const slots = (tf?.slots ?? []).map((s) => s.name);
    expect(slots).toContain('label');
    expect(slots).toContain('hint');
    expect(slots).toContain('error');
  });

  it('declares CSS parts for text-field', () => {
    const tf = findByTag('foundry-text-field');
    const parts = (tf?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('container');
    expect(parts).toContain('label');
    expect(parts).toContain('input');
    expect(parts).toContain('hint');
    expect(parts).toContain('error');
  });

  it('declares text-field CSS custom properties', () => {
    const tf = findByTag('foundry-text-field');
    const props = (tf?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-text-field-border-color');
    expect(props).toContain('--foundry-text-field-border-color-invalid');
    expect(props).toContain('--foundry-text-field-background');
    expect(props).toContain('--foundry-text-field-foreground');
    expect(props).toContain('--foundry-text-field-focus-outline');
    expect(props).toContain('--foundry-text-field-label-font-weight');
    expect(props).toContain('--foundry-text-field-hint-color');
    expect(props).toContain('--foundry-text-field-error-color');
  });

  it('declares <foundry-textarea> with its form-control attributes', () => {
    const ta = findByTag('foundry-textarea');
    expect(ta).toBeDefined();
    const attrs = (ta?.attributes ?? []).map((a) => a.name);
    // Spot-check the surface.
    expect(attrs).toContain('name');
    expect(attrs).toContain('value');
    expect(attrs).toContain('placeholder');
    expect(attrs).toContain('required');
    expect(attrs).toContain('disabled');
    expect(attrs).toContain('readonly');
    expect(attrs).toContain('minlength');
    expect(attrs).toContain('maxlength');
    expect(attrs).toContain('rows');
    expect(attrs).toContain('invalid');
  });

  it('declares label, hint, and error slots for textarea', () => {
    const ta = findByTag('foundry-textarea');
    const slots = (ta?.slots ?? []).map((s) => s.name);
    expect(slots).toContain('label');
    expect(slots).toContain('hint');
    expect(slots).toContain('error');
  });

  it('declares CSS parts for textarea', () => {
    const ta = findByTag('foundry-textarea');
    const parts = (ta?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('container');
    expect(parts).toContain('label');
    expect(parts).toContain('input');
    expect(parts).toContain('hint');
    expect(parts).toContain('error');
  });

  it('declares textarea CSS custom properties', () => {
    const ta = findByTag('foundry-textarea');
    const props = (ta?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-textarea-border-color');
    expect(props).toContain('--foundry-textarea-border-color-invalid');
    expect(props).toContain('--foundry-textarea-background');
    expect(props).toContain('--foundry-textarea-foreground');
    expect(props).toContain('--foundry-textarea-focus-outline');
    expect(props).toContain('--foundry-textarea-label-font-weight');
    expect(props).toContain('--foundry-textarea-hint-color');
    expect(props).toContain('--foundry-textarea-error-color');
    expect(props).toContain('--foundry-textarea-resize');
    expect(props).toContain('--foundry-textarea-min-block-size');
  });

  it('declares <foundry-checkbox> with its form-control attributes', () => {
    const cb = findByTag('foundry-checkbox');
    expect(cb).toBeDefined();
    const attrs = (cb?.attributes ?? []).map((a) => a.name);
    expect(attrs).toContain('name');
    expect(attrs).toContain('value');
    expect(attrs).toContain('checked');
    expect(attrs).toContain('required');
    expect(attrs).toContain('disabled');
    expect(attrs).toContain('invalid');
  });

  it('declares the label slot for checkbox', () => {
    const cb = findByTag('foundry-checkbox');
    const slots = (cb?.slots ?? []).map((s) => s.name);
    expect(slots).toContain('label');
  });

  it('declares CSS parts for checkbox', () => {
    const cb = findByTag('foundry-checkbox');
    const parts = (cb?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('wrapper');
    expect(parts).toContain('input');
    expect(parts).toContain('box');
    expect(parts).toContain('label');
  });

  it('declares checkbox CSS custom properties', () => {
    const cb = findByTag('foundry-checkbox');
    const props = (cb?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-checkbox-gap');
    expect(props).toContain('--foundry-checkbox-box-size');
    expect(props).toContain('--foundry-checkbox-radius');
    expect(props).toContain('--foundry-checkbox-border-color');
    expect(props).toContain('--foundry-checkbox-border-color-invalid');
    expect(props).toContain('--foundry-checkbox-background');
    expect(props).toContain('--foundry-checkbox-background-checked');
    expect(props).toContain('--foundry-checkbox-check-color');
    expect(props).toContain('--foundry-checkbox-label-color');
    expect(props).toContain('--foundry-checkbox-focus-outline');
  });

  it('declares <foundry-radio> with its form-control attributes', () => {
    const rd = findByTag('foundry-radio');
    expect(rd).toBeDefined();
    const attrs = (rd?.attributes ?? []).map((a) => a.name);
    expect(attrs).toContain('name');
    expect(attrs).toContain('value');
    expect(attrs).toContain('checked');
    expect(attrs).toContain('required');
    expect(attrs).toContain('disabled');
    expect(attrs).toContain('invalid');
  });

  it('declares the label slot for radio', () => {
    const rd = findByTag('foundry-radio');
    const slots = (rd?.slots ?? []).map((s) => s.name);
    expect(slots).toContain('label');
  });

  it('declares CSS parts for radio', () => {
    const rd = findByTag('foundry-radio');
    const parts = (rd?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('wrapper');
    expect(parts).toContain('input');
    expect(parts).toContain('box');
    expect(parts).toContain('label');
  });

  it('declares radio CSS custom properties', () => {
    const rd = findByTag('foundry-radio');
    const props = (rd?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-radio-gap');
    expect(props).toContain('--foundry-radio-box-size');
    expect(props).toContain('--foundry-radio-dot-size');
    expect(props).toContain('--foundry-radio-border-color');
    expect(props).toContain('--foundry-radio-border-color-invalid');
    expect(props).toContain('--foundry-radio-background');
    expect(props).toContain('--foundry-radio-background-checked');
    expect(props).toContain('--foundry-radio-dot-color');
    expect(props).toContain('--foundry-radio-label-color');
    expect(props).toContain('--foundry-radio-focus-outline');
  });

  it('declares <foundry-switch> with its form-control attributes', () => {
    const sw = findByTag('foundry-switch');
    expect(sw).toBeDefined();
    const attrs = (sw?.attributes ?? []).map((a) => a.name);
    expect(attrs).toContain('name');
    expect(attrs).toContain('value');
    expect(attrs).toContain('checked');
    expect(attrs).toContain('required');
    expect(attrs).toContain('disabled');
    expect(attrs).toContain('invalid');
  });

  it('declares the label slot for switch', () => {
    const sw = findByTag('foundry-switch');
    const slots = (sw?.slots ?? []).map((s) => s.name);
    expect(slots).toContain('label');
  });

  it('declares CSS parts for switch', () => {
    const sw = findByTag('foundry-switch');
    const parts = (sw?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('wrapper');
    expect(parts).toContain('input');
    expect(parts).toContain('track');
    expect(parts).toContain('thumb');
    expect(parts).toContain('label');
  });

  it('declares <foundry-avatar> with its profile-image attributes', () => {
    const av = findByTag('foundry-avatar');
    expect(av).toBeDefined();
    const attrs = (av?.attributes ?? []).map((a) => a.name);
    expect(attrs).toContain('src');
    expect(attrs).toContain('name');
    expect(attrs).toContain('label');
    expect(attrs).toContain('size');
    expect(attrs).toContain('shape');
    expect(attrs).toContain('status');
  });

  it('declares default slot + parts for avatar', () => {
    const av = findByTag('foundry-avatar');
    expect((av?.slots ?? []).map((s) => s.name)).toContain('');
    const parts = (av?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('container');
    expect(parts).toContain('image');
    expect(parts).toContain('initials');
    expect(parts).toContain('status');
  });

  it('declares avatar CSS custom properties', () => {
    const av = findByTag('foundry-avatar');
    const props = (av?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-avatar-size-sm');
    expect(props).toContain('--foundry-avatar-size-md');
    expect(props).toContain('--foundry-avatar-size-lg');
    expect(props).toContain('--foundry-avatar-radius');
    expect(props).toContain('--foundry-avatar-background');
    expect(props).toContain('--foundry-avatar-foreground');
    expect(props).toContain('--foundry-avatar-status-online');
    expect(props).toContain('--foundry-avatar-status-offline');
    expect(props).toContain('--foundry-avatar-status-away');
    expect(props).toContain('--foundry-avatar-status-busy');
  });

  it('declares <foundry-breadcrumbs> with the default slot and parts', () => {
    const bc = findByTag('foundry-breadcrumbs');
    expect(bc).toBeDefined();
    expect((bc?.slots ?? []).map((s) => s.name)).toContain('');
    const parts = (bc?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('nav');
    expect(parts).toContain('list');
  });

  it('declares breadcrumbs CSS custom properties', () => {
    const bc = findByTag('foundry-breadcrumbs');
    const props = (bc?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-breadcrumbs-gap');
    expect(props).toContain('--foundry-breadcrumbs-font-size');
    expect(props).toContain('--foundry-breadcrumbs-color');
  });

  it('declares <foundry-breadcrumb> with its current attribute and slots', () => {
    const bc = findByTag('foundry-breadcrumb');
    expect(bc).toBeDefined();
    const attrs = (bc?.attributes ?? []).map((a) => a.name);
    expect(attrs).toContain('current');
    const slots = (bc?.slots ?? []).map((s) => s.name);
    expect(slots).toContain('');
    expect(slots).toContain('separator');
    const parts = (bc?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('item');
    expect(parts).toContain('content');
    expect(parts).toContain('separator');
  });

  it('declares breadcrumb CSS custom properties', () => {
    const bc = findByTag('foundry-breadcrumb');
    const props = (bc?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-breadcrumb-separator-color');
    expect(props).toContain('--foundry-breadcrumb-separator-margin');
    expect(props).toContain('--foundry-breadcrumb-current-color');
    expect(props).toContain('--foundry-breadcrumb-current-font-weight');
  });

  it('declares <foundry-link> with its navigation attributes', () => {
    const lk = findByTag('foundry-link');
    expect(lk).toBeDefined();
    const attrs = (lk?.attributes ?? []).map((a) => a.name);
    expect(attrs).toContain('variant');
    expect(attrs).toContain('href');
    expect(attrs).toContain('target');
    expect(attrs).toContain('rel');
    expect(attrs).toContain('download');
  });

  it('declares the default slot and anchor part for link', () => {
    const lk = findByTag('foundry-link');
    expect((lk?.slots ?? []).map((s) => s.name)).toContain('');
    expect((lk?.cssParts ?? []).map((p) => p.name)).toContain('anchor');
  });

  it('declares link CSS custom properties', () => {
    const lk = findByTag('foundry-link');
    const props = (lk?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-link-color');
    expect(props).toContain('--foundry-link-color-hover');
    expect(props).toContain('--foundry-link-color-active');
    expect(props).toContain('--foundry-link-color-visited');
    expect(props).toContain('--foundry-link-underline-thickness');
    expect(props).toContain('--foundry-link-underline-offset');
    expect(props).toContain('--foundry-link-focus-outline');
  });

  it('declares switch CSS custom properties', () => {
    const sw = findByTag('foundry-switch');
    const props = (sw?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-switch-gap');
    expect(props).toContain('--foundry-switch-track-width');
    expect(props).toContain('--foundry-switch-track-height');
    expect(props).toContain('--foundry-switch-track-radius');
    expect(props).toContain('--foundry-switch-track-border-color');
    expect(props).toContain('--foundry-switch-track-background');
    expect(props).toContain('--foundry-switch-track-background-checked');
    expect(props).toContain('--foundry-switch-thumb-size');
    expect(props).toContain('--foundry-switch-thumb-color');
    expect(props).toContain('--foundry-switch-label-color');
    expect(props).toContain('--foundry-switch-focus-outline');
  });

  it('declares <foundry-tag> with its attributes', () => {
    const t = findByTag('foundry-tag');
    expect(t).toBeDefined();
    const attrs = (t?.attributes ?? []).map((a) => a.name);
    expect(attrs).toContain('variant');
    expect(attrs).toContain('value');
    expect(attrs).toContain('removable');
    expect(attrs).toContain('disabled');
  });

  it('declares default slot and parts for tag', () => {
    const t = findByTag('foundry-tag');
    expect((t?.slots ?? []).map((s) => s.name)).toContain('');
    const parts = (t?.cssParts ?? []).map((p) => p.name);
    expect(parts).toContain('wrapper');
    expect(parts).toContain('content');
    expect(parts).toContain('close');
    expect(parts).toContain('close-icon');
  });

  it('declares tag CSS custom properties', () => {
    const t = findByTag('foundry-tag');
    const props = (t?.cssProperties ?? []).map((p) => p.name);
    expect(props).toContain('--foundry-tag-background');
    expect(props).toContain('--foundry-tag-foreground');
    expect(props).toContain('--foundry-tag-padding');
    expect(props).toContain('--foundry-tag-radius');
    expect(props).toContain('--foundry-tag-close-size');
    expect(props).toContain('--foundry-tag-close-color');
    expect(props).toContain('--foundry-tag-focus-outline');
  });

  it('declares the tag "remove" event on its CEM entry', () => {
    const t = findByTag('foundry-tag');
    const events = (t?.events ?? []).map((e) => e.name);
    expect(events).toContain('remove');
  });
});
