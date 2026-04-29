import type { Meta, StoryObj } from '@storybook/web-components';
import { html, type TemplateResult } from 'lit';
import { components, primitives, semantics } from './registry.ts';
import type { TokenEntry } from './types.ts';

/**
 * Foundations / Tokens — live reference for every emitted design token.
 *
 * Three stories, one per tier, iterating the registered `TokenEntry` arrays
 * from `./registry.ts`. When a token is added in a primitive/semantic/component
 * file, it appears here automatically — no hand-maintained list.
 *
 * Color/space/radius/typography swatches resolve via `var(--foundry-…)` so the
 * Storybook theme switcher (decorator in apps/storybook/.storybook/preview.ts)
 * flips semantic + component swatches when dark mode is active. Primitive
 * swatches stay static because the primitive palette is the single source.
 */

const meta: Meta = {
  title: 'Foundations/Tokens',
  parameters: { controls: { disable: true } },
};

export default meta;

type Story = StoryObj;

// ----- helpers -----

function groupByCategory(entries: readonly TokenEntry[]): Map<string, TokenEntry[]> {
  const out = new Map<string, TokenEntry[]>();
  for (const entry of entries) {
    const list = out.get(entry.category) ?? [];
    list.push(entry);
    out.set(entry.category, list);
  }
  return out;
}

function prettyCategory(category: string): string {
  // foundry-button → "foundry-button" (kept as-is, it's a tag)
  if (category.startsWith('foundry-')) return category;
  // color / space / radius / font-size → Title Case with dashes preserved
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ----- category renderers -----

function renderColorGrid(entries: readonly TokenEntry[]): TemplateResult {
  return html`
    <div
      style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));
             gap:0.75rem;"
    >
      ${entries.map((t) => html`
        <div
          style="display:flex; flex-direction:column; gap:0.375rem;
                 padding:0.5rem; border:1px solid var(--foundry-color-border);
                 border-radius:var(--foundry-radius-sm);
                 background:var(--foundry-color-surface);"
        >
          <div
            style="block-size:48px; border-radius:var(--foundry-radius-sm);
                   background:var(${t.name});
                   border:1px solid var(--foundry-color-border);"
            aria-hidden="true"
          ></div>
          <code style="font-size:0.75rem; word-break:break-all;">${t.name}</code>
          <code
            style="font-size:0.6875rem; color:var(--foundry-color-text-muted);
                   word-break:break-all;"
          >${t.value}</code>
        </div>
      `)}
    </div>
  `;
}

function renderSpaceRuler(entries: readonly TokenEntry[]): TemplateResult {
  return html`
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      ${entries.map((t) => html`
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div
            style="block-size:16px;
                   inline-size:var(${t.name});
                   background:var(--foundry-color-action-primary);
                   border-radius:var(--foundry-radius-sm);
                   min-inline-size:1px;"
            aria-hidden="true"
          ></div>
          <code style="font-size:0.8125rem;">${t.name}</code>
          <code
            style="font-size:0.75rem; color:var(--foundry-color-text-muted);"
          >${t.value}</code>
        </div>
      `)}
    </div>
  `;
}

function renderRadiusCurves(entries: readonly TokenEntry[]): TemplateResult {
  return html`
    <div style="display:flex; flex-wrap:wrap; gap:1.25rem;">
      ${entries.map((t) => html`
        <div style="display:flex; flex-direction:column; align-items:center; gap:0.375rem;">
          <div
            style="block-size:56px; inline-size:56px;
                   border-radius:var(${t.name});
                   background:var(--foundry-color-surface-subtle);
                   border:1px solid var(--foundry-color-border);"
            aria-hidden="true"
          ></div>
          <code style="font-size:0.75rem;">${t.name}</code>
          <code
            style="font-size:0.6875rem; color:var(--foundry-color-text-muted);"
          >${t.value}</code>
        </div>
      `)}
    </div>
  `;
}

function renderFontSizeSamples(entries: readonly TokenEntry[]): TemplateResult {
  return html`
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      ${entries.map((t) => html`
        <div style="display:flex; align-items:baseline; gap:0.75rem;">
          <span style="font-size:var(${t.name}); line-height:1;" aria-hidden="true">Ag</span>
          <code style="font-size:0.8125rem;">${t.name}</code>
          <code
            style="font-size:0.75rem; color:var(--foundry-color-text-muted);"
          >${t.value}</code>
        </div>
      `)}
    </div>
  `;
}

function renderFontWeightSamples(entries: readonly TokenEntry[]): TemplateResult {
  return html`
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      ${entries.map((t) => html`
        <div style="display:flex; align-items:baseline; gap:0.75rem;">
          <span
            style="font-weight:var(${t.name}); font-size:1.25rem; line-height:1;"
            aria-hidden="true"
          >Ag</span>
          <code style="font-size:0.8125rem;">${t.name}</code>
          <code
            style="font-size:0.75rem; color:var(--foundry-color-text-muted);"
          >${t.value}</code>
        </div>
      `)}
    </div>
  `;
}

function renderLineHeightSamples(entries: readonly TokenEntry[]): TemplateResult {
  return html`
    <div style="display:flex; flex-direction:column; gap:1rem;">
      ${entries.map((t) => html`
        <div style="display:flex; flex-direction:column; gap:0.25rem;">
          <div
            style="font-size:0.875rem; line-height:var(${t.name});
                   padding:0.25rem 0.5rem;
                   border-left:2px solid var(--foundry-color-border);"
          >
            Two lines of body copy illustrating the ${t.name} line height.
            The vertical rhythm reflects the resolved value.
          </div>
          <div style="display:flex; gap:0.75rem;">
            <code style="font-size:0.8125rem;">${t.name}</code>
            <code
              style="font-size:0.75rem; color:var(--foundry-color-text-muted);"
            >${t.value}</code>
          </div>
        </div>
      `)}
    </div>
  `;
}

function renderValueTable(entries: readonly TokenEntry[]): TemplateResult {
  return html`
    <table
      style="width:100%; border-collapse:collapse; font-size:0.8125rem;
             border:1px solid var(--foundry-color-border);"
    >
      <thead>
        <tr style="background:var(--foundry-color-surface-subtle); text-align:left;">
          <th style="padding:0.5rem; border-bottom:1px solid var(--foundry-color-border);">
            Token
          </th>
          <th style="padding:0.5rem; border-bottom:1px solid var(--foundry-color-border);">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((t) => html`
          <tr>
            <td
              style="padding:0.5rem; border-bottom:1px solid var(--foundry-color-border);
                     font-family:ui-monospace, SFMono-Regular, Menlo, monospace;"
            >${t.name}</td>
            <td
              style="padding:0.5rem; border-bottom:1px solid var(--foundry-color-border);
                     font-family:ui-monospace, SFMono-Regular, Menlo, monospace;
                     color:var(--foundry-color-text-muted);"
            >${t.value}</td>
          </tr>
        `)}
      </tbody>
    </table>
  `;
}

// ----- dispatch + tier scaffold -----

function renderCategory(category: string, entries: readonly TokenEntry[]): TemplateResult {
  switch (category) {
    case 'color': return renderColorGrid(entries);
    case 'space': return renderSpaceRuler(entries);
    case 'radius': return renderRadiusCurves(entries);
    case 'font-size': return renderFontSizeSamples(entries);
    case 'font-weight': return renderFontWeightSamples(entries);
    case 'line-height': return renderLineHeightSamples(entries);
    default: return renderValueTable(entries);
  }
}

function renderTier(
  entries: readonly TokenEntry[],
  tierLabel: string,
): TemplateResult {
  const groups = [...groupByCategory(entries).entries()].sort(([a], [b]) => a.localeCompare(b));

  return html`
    <div
      style="display:flex; flex-direction:column; gap:2rem;
             padding:1rem; font-family:system-ui, sans-serif;
             color:var(--foundry-color-text-body);
             background:var(--foundry-color-surface);"
    >
      <header>
        <h1 style="margin:0 0 0.25rem; font-size:1.5rem;">${tierLabel} tokens</h1>
        <p style="margin:0; color:var(--foundry-color-text-muted); font-size:0.875rem;">
          ${entries.length} tokens across ${groups.length} categor${groups.length === 1 ? 'y' : 'ies'}.
          Swatches resolve via CSS custom properties, so the theme toggle in the toolbar
          flips ${tierLabel === 'Primitive' ? 'nothing (primitives are constants)' : 'semantic values where applicable'}.
        </p>
      </header>

      ${groups.map(([category, catEntries]) => html`
        <section style="display:flex; flex-direction:column; gap:0.75rem;">
          <h2 style="margin:0; font-size:1.125rem;">${prettyCategory(category)}</h2>
          ${renderCategory(category, catEntries)}
        </section>
      `)}
    </div>
  `;
}

// ----- stories -----

export const Primitive: Story = {
  render: () => renderTier(primitives, 'Primitive'),
};

export const Semantic: Story = {
  render: () => renderTier(semantics, 'Semantic'),
};

export const Component: Story = {
  render: () => renderTier(components, 'Component'),
};
