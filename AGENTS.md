# AGENTS.md — foundry

This file is the source of truth for any agent (human or AI) working in this repository. Read it before writing code. Keep it up to date when decisions change.

---

## 1. Project mission

**foundry** is a design system built **exclusively on native Web Components**. It prioritizes, in order:

1. **Performance** — zero runtime framework, evergreen-only browsers, no polyfills.
2. **Accessibility** — WCAG 2.2 AA floor, ARIA APG patterns per interactive component.
3. **Theming** — design tokens exposed as CSS custom properties, overridable at runtime, works through shadow DOM.
4. **Testing rigor** — unit (≥90% coverage, enforced), functional (real browser), end-to-end, visual regression, plus canary apps in four host frameworks.

If a change would compromise one of these pillars, it does not belong here.

---

## 2. Golden rules

- **No framework runtime** inside any published `@foundry/*` package. Never add `react`, `vue`, `@angular/*`, `lit`, `stencil`, `@microsoft/fast-*`, or any similar dependency.
- **No polyfills.** If a feature isn't supported on the declared browser matrix (§12), don't use it.
- **Every component ships with two author-owned test layers plus Storybook stories**: unit (Vitest), functional+a11y (@web/test-runner), and default/states/theming stories in Storybook. Visual-regression and E2E are repo-level gates authors only touch when the component participates in the reference screen. See §8 for the full contract.
- **Coverage thresholds are CI gates.** Don't lower them to get green — fix the code or add the tests.
- **Shadow DOM, open mode.** Public styling happens exclusively through `--foundry-*` CSS custom properties and documented CSS parts.
- **Public API is typed.** No `any` in exported surfaces. Every event carries a typed `detail`.
- **Template rendering is standardized** (§5). Hand-rolled rendering libraries or runtime `innerHTML` are not allowed.

---

## 3. Tech stack

| Concern | Tool | Notes |
|---|---|---|
| Language | TypeScript (strict) | No `any` in public API |
| Runtime | Node.js 24 | Pinned via `engines` in every `package.json`. No `.nvmrc`. |
| Web Component base | Native `HTMLElement` (vanilla custom elements) | Wrapped by internal `FoundryElement` base class |
| Workspace manager | **npm workspaces** | Chosen for ubiquity and zero install friction for contributors. Not pnpm/yarn/Nx — don't propose migrations without an RFC. |
| Build tool | **Vite** (library mode for packages, default for apps/Storybook) | One tool end-to-end. Handles `?raw` template imports, `?inline` CSS, constructable stylesheets, and `.d.ts` via `vite-plugin-dts`. |
| CI | **GitHub Actions** | Workflows live in `.github/workflows/`. Matrix across Node 24 only for now. |
| Unit tests / coverage | Vitest | Thresholds ≥90% (lines, branches, functions, statements) |
| Functional tests | @web/test-runner | Real browser, real shadow DOM. This is where a11y assertions live. |
| E2E tests | Playwright | Runs same suite against all 4 implementation-test apps |
| Visual regression | Playwright screenshots | Per-component snapshots across themes + impl apps |
| Docs / preview | Storybook (Web Components, Vite builder) | Sole consumer-facing docs surface |
| Accessibility | axe-core | Runs in **functional** tests (real browser only) |
| Linting | ESLint + Prettier | Config lives at the repo root |
| Component manifest | `custom-elements-manifest` analyzer | Emits `custom-elements.json` for IDE/framework/Storybook integration |

---

## 4. Repository layout

```
foundry/
├── AGENTS.md
├── README.md
├── package.json                     # root — npm workspaces
├── tsconfig.base.json
├── packages/
│   ├── tokens/                      # @foundry/tokens — design tokens (data)
│   │   ├── src/                     #   TS source of truth (color, spacing, …)
│   │   ├── dist/                    #   emitted CSS + JS + JSON artifacts
│   │   └── package.json
│   ├── themes/                      # @foundry/themes — token value sets as CSS
│   │   ├── src/                     #   default, plus sample themes
│   │   └── package.json
│   ├── icons/                       # @foundry/icons — icon set + <foundry-icon>
│   │   ├── src/
│   │   │   ├── svg/                 #   raw SVGs (source of truth)
│   │   │   └── icon.ts              #   <foundry-icon> element
│   │   └── package.json
│   └── elements/                    # @foundry/elements — the components
│       ├── src/
│       │   ├── components/<name>/   # one folder per component
│       │   │   ├── <name>.ts              # class + .define() + event-detail types
│       │   │   ├── <name>.template.html   # structural HTML (imported via `?raw`)
│       │   │   ├── <name>.css             # component styles (imported via `?inline`)
│       │   │   └── <name>.test.ts         # Vitest unit tests
│       │   ├── core/                # FoundryElement base, mixins, utils
│       │   └── index.ts
│       ├── test/
│       │   ├── unit/                # cross-cutting Vitest specs
│       │   ├── functional/          # @web/test-runner + axe specs
│       │   └── setup/
│       ├── vitest.config.ts
│       ├── web-test-runner.config.js
│       └── package.json
├── apps/
│   └── storybook/                   # docs surface, not published
├── implementation-tests/
│   ├── html-js/                     # pure HTML+JS consumer app
│   ├── react/                       # React consumer app
│   ├── angular/                     # Angular consumer app
│   ├── vue/                         # Vue consumer app
│   ├── scenario.md                  # shared reference-screen definition
│   └── e2e/                         # Playwright — functional + visual, × 4 apps
└── docs/
    └── a11y-checklist.md            # per-component manual SR / zoom / HC checklist
```

### Package split rationale

| Package | Reason for its own package |
|---|---|
| `@foundry/tokens` | Tokens are *data*. They have legitimate consumers beyond the components (docs, Figma/Style Dictionary pipelines, emails, native apps). Separate semver cadence — a color tweak doesn't force a major on components. |
| `@foundry/themes` | A theme is a token value-set compiled to CSS. Keeping it separate lets brand variants ship without re-releasing tokens or components. Depends on `@foundry/tokens`. |
| `@foundry/icons` | Icons balloon over time; consumers want subsets. Separate package avoids bundling the full set when one icon is needed. Ships `<foundry-icon>` element + SVG assets. |
| `@foundry/elements` | The components themselves. Depends on `@foundry/tokens`; optionally pulls `@foundry/icons` for composite components. |

**Not separate packages (kept inside `@foundry/elements`):**
- `FoundryElement` base class and core mixins — implementation detail; no external demand for building third-party components on it yet.
- Test utilities — split into `@foundry/test-utils` only when consumers start testing against our components.

---

## 5. Component authoring conventions

### Base class
- Every component extends the shared **`FoundryElement`** base (`packages/elements/src/core/`), which:
  - Wraps `HTMLElement`.
  - Handles attribute ↔ property reflection with typed descriptors.
  - Attaches an **open** shadow root (`{ mode: 'open' }`).
  - Adopts constructable stylesheets (one shared stylesheet instance per component class).
  - Provides a lifecycle hook layer (`connected`, `disconnected`, `attributeChanged`, `propertyChanged`).
  - Clones the component's `<template>` into the shadow root and caches refs to elements marked with `data-ref="…"`, per the canonical authoring pattern below.

### Naming
- Tag names follow the **`foundry-*`** prefix (e.g. `<foundry-button>`, `<foundry-dialog>`, `<foundry-icon>`).
- CSS custom properties follow the **`--foundry-*`** prefix.

### Module exports
Each component module exports:
- The class.
- A `.define(tag?: string)` registrar — consumers may rename the tag.
- A typed event-detail map.

### Generated artifacts (not module exports)
- `custom-elements.json` is emitted at the package root by the `custom-elements-manifest` analyzer during build. It is a metadata artifact consumed by IDEs, framework integrations, and Storybook — not something component modules export or commit by hand.

### Template rendering — the one canonical pattern

Every component authors its DOM the same way. No alternatives, no per-author judgment calls.

1. Structural HTML lives in `<name>.template.html` next to the component source.
2. At module load it is imported via Vite's `?raw` query, parsed once into an `HTMLTemplateElement`, and kept in module scope.
3. On `connectedCallback` the base class clones that template into the open shadow root and caches refs to elements marked with `data-ref="…"`.
4. Dynamic updates are applied imperatively on those cached refs (`textContent`, `setAttribute`, `classList.toggle`, `toggleAttribute`) — never by re-rendering HTML.

Component styles follow the same pattern: `<name>.css` is imported via Vite's `?inline` query as a string, wrapped once into a `CSSStyleSheet`, and adopted by every instance of that component class. One stylesheet instance per class, shared across instances.

**Explicitly forbidden:**
- Runtime `innerHTML` (destroys focus/selection state, XSS foot-gun).
- Hand-rolled tagged-template rendering libraries (reinvents Lit — if you want Lit, we don't).
- `.css.ts` / CSS-in-JS authoring — keep CSS as `.css` so editors, stylelint, and Vite CSS tooling all work natively.
- `document.createElement` cascades in lieu of a template (even for tiny components — the consistency matters more than saving 8 lines).

### Styling rules
- All CSS lives inside the shadow root.
- Only `--foundry-*` CSS custom properties are part of the public styling API.
- Expose `::part()` hooks only where structural styling cannot be achieved via tokens — document each part in the manifest.
- No global stylesheets. No light-DOM style injection. No `@import` in component CSS.

### State & events
- Prefer properties for rich data, attributes for primitives.
- All emitted events are `CustomEvent<Detail>` with typed details, and are documented in JSDoc and the manifest.
- Form-associated components use the `ElementInternals` / Form-Associated Custom Elements API.

---

## 6. Theming contract

### 6.1 Token tiers

Tokens live in `@foundry/tokens` as the TypeScript source of truth and are modeled in **three tiers**. Each tier may only reference the tier immediately above it.

| Tier | Purpose | References | Example |
|---|---|---|---|
| **1. Primitive** | Raw values, no semantics. Stable, rarely changed. | — | `--foundry-color-blue-500`, `--foundry-space-4`, `--foundry-font-size-300` |
| **2. Semantic** | Intent — *why* a value exists. | Primitives only. | `--foundry-color-action-primary`, `--foundry-space-inline-md`, `--foundry-font-size-body` |
| **3. Component** | Per-component bindings. Optional — introduced only when a component needs per-component theming hooks that shouldn't live on the global semantic layer. | Semantic tokens only (never primitives). | `--foundry-button-background-primary`, `--foundry-dialog-padding-inline` |

Rules:
- Components consume **semantic or component tokens only** — never primitives.
- Component tokens are added when a theme author would reasonably want to re-skin one component without shifting a global semantic meaning. If in doubt, use a semantic token.
- Categories covered across all tiers: color, spacing, radius, typography, motion, elevation, z-index.

### 6.2 Naming grammar

Every token name is lowercase, joined by `-` (kebab-case, forced by CSS custom property syntax), singular, and prefixed with `--foundry-`. Grammar is defined per tier and per category — one primitive shape doesn't fit all categories.

**Primitive tier** — per-category, since color ramps, spacing steps, and named curves don't share a shape.

| Category | Grammar | Examples |
|---|---|---|
| Color | `--foundry-color-<ramp>-<step>` | `--foundry-color-blue-500`, `--foundry-color-gray-900` |
| Spacing | `--foundry-space-<step>` | `--foundry-space-0`, `--foundry-space-4`, `--foundry-space-8` |
| Radius | `--foundry-radius-<step>` | `--foundry-radius-0`, `--foundry-radius-2`, `--foundry-radius-4` |
| Font size | `--foundry-font-size-<step>` | `--foundry-font-size-100`, `--foundry-font-size-300` |
| Font weight | `--foundry-font-weight-<step>` | `--foundry-font-weight-400`, `--foundry-font-weight-700` |
| Line height | `--foundry-line-height-<step>` | `--foundry-line-height-100`, `--foundry-line-height-200` |
| Motion duration | `--foundry-motion-duration-<step>` | `--foundry-motion-duration-100` |
| Motion easing | `--foundry-motion-easing-<name>` | `--foundry-motion-easing-standard`, `--foundry-motion-easing-emphasized` |
| Elevation | `--foundry-elevation-<step>` | `--foundry-elevation-100`, `--foundry-elevation-300` |
| Z-index | `--foundry-z-<name>` | `--foundry-z-dropdown`, `--foundry-z-modal` |

`<step>` is **numeric** across every scalar primitive category above (see §6.3). `<name>` is used where the concept is a named curve or layer rather than a scale (easings, z-index layers).

**Semantic tier:**
```
--foundry-<category>-<concept>[-<variant>][-<state>]
```
Both `<variant>` and `<state>` are optional. Examples: `--foundry-color-surface`, `--foundry-color-text-body`, `--foundry-color-action-primary`, `--foundry-color-action-primary-hover`, `--foundry-space-inline-md`.

**Component tier:**
```
--foundry-<component>-<property>[-<variant>][-<state>]
```
Both `<variant>` and `<state>` are optional. Examples: `--foundry-button-background`, `--foundry-button-background-primary`, `--foundry-button-background-primary-hover`, `--foundry-dialog-padding-inline`.

Segment definitions:
- **category** — the token family, matching the primitive categories above (`color`, `space`, `radius`, `font-size`, `font-weight`, `line-height`, `motion-duration`, `motion-easing`, `elevation`, `z`).
- **concept** — the subject within the category: `blue`, `gray` (primitive color ramps); `text`, `surface`, `action`, `border` (semantic color); `inline`, `stack`, `inset` (semantic spacing).
- **property** (component tier) — the CSS property the token feeds: `background`, `color`, `border`, `padding`, `padding-inline`, `gap`, etc.
- **variant** — an alternative at the same level: `primary`, `secondary`, `danger`, `subtle`.
- **state** — interaction/status, **always last**: `hover`, `active`, `focus`, `pressed`, `disabled`, `selected`, `visited`. Canonical list — no synonyms.
- **step** — primitive numeric step (§6.3).

### 6.3 Scale conventions

- **Primitive tier uses numeric `<step>` only** — no t-shirt sizes on primitives.
  - Scalar ramps with fine-grained progressions use a **100/200/…/900** scale (color ramps, font-size, font-weight, line-height, motion-duration, elevation).
  - Integer-step ramps where the value maps to a small index use a **0/1/2/4/8/…** scale (spacing, radius).
  - A primitive category picks one of the two and stays with it.
- **Named primitives** (motion easings, z-index layers) use a descriptive `<name>` instead of a numeric step — those categories have no natural ordering.
- **Semantic and component tiers may use t-shirt sizes** where ordinal size is the intent itself (`--foundry-space-inline-sm/md/lg`). Pick one style per (tier × category) and stay consistent.
- **Scale direction is consistent system-wide.** Higher number = larger value (spacing, font-size, elevation) or higher intensity (color ramps). Document any exception in the tokens package README.

### 6.4 Mode

Mode (light/dark/high-contrast/etc.) is **not encoded in token names**. Modes are expressed by *swapping the value* of the same semantic/component token under a scope — e.g. `[data-theme="dark"] { --foundry-color-surface: … }`. This keeps component CSS mode-agnostic: one token name, many values.

### 6.5 Tokens package artifacts

`@foundry/tokens` builds three artifacts from the TS source of truth:
- Typed JS constants (tree-shakeable).
- JSON manifest (for external pipelines like Style Dictionary, Figma).
- CSS variable sheets — one file per tier.

### 6.6 Themes

- **Themes** (`@foundry/themes`) are stylesheets that override **semantic and/or component** `--foundry-*` variables on `:root` (or any scoped ancestor). A theme never overrides primitives — swap at the meaning layer, not the raw-value layer. A theme has no JS.
- The default theme lives here too.
- A minimal `applyTheme` JS helper is available for convenience, but is **not** required — loading a stylesheet is always enough.
- Consumers theme by:
  1. Loading a provided theme stylesheet from `@foundry/themes`, **or**
  2. Overriding specific semantic/component `--foundry-*` vars themselves on `:root` or a scoped container.

### 6.7 Component defaults

Each component emits its own `:host` defaults using semantic (or its own component) tokens, so any component is themable in isolation even without a theme loaded. All components MUST work correctly with only the defaults, and MUST respect any overridden tokens cascaded from ancestors.

### 6.8 Token "do not" list

- ❌ Don't reference primitives from components or themes. Go through semantic (and optionally component) tokens.
- ❌ Don't mix naming styles within a tier (e.g. `--foundry-space-inline-md` and `--foundry-space-inline-4` in the same system).
- ❌ Don't name for visual value: `--foundry-color-text-red` — name the intent: `--foundry-color-text-danger`.
- ❌ Don't abbreviate aggressively: no `btn-bg-pri-hvr`.
- ❌ Don't place state anywhere except at the end: `--foundry-color-action-hover-primary` is wrong; `--foundry-color-action-primary-hover` is right.
- ❌ Don't encode mode in names (`--foundry-color-surface-dark`). Swap values under a scope instead.
- ❌ Don't invent state synonyms (`over`, `pressed-in`, `inactive`). Use the canonical list in §6.2.
- ❌ Don't introduce a component token when a semantic token would do — component tokens expand the API surface and are hard to remove later.

---

## 7. Accessibility contract

- **Floor:** WCAG 2.2 AA. Aim higher per component where feasible.
- Every interactive component follows the matching **ARIA APG pattern** (roles, states, keyboard interactions, focus management).
- **Automated checks run in the real browser only.** `axe-core` is invoked in functional tests (@web/test-runner), never in unit tests — jsdom/happy-dom don't compute layout or styles accurately enough to trust their a11y signal.
- Keyboard-interaction specs are mandatory for any focusable/interactive component.
- Manual checks: each component has an entry in `docs/a11y-checklist.md` covering SR output (VoiceOver, NVDA), reduced-motion, forced-colors / high-contrast, and zoom behaviors.
- Focus is visible at all times (`:focus-visible`) and respects user agent settings; no disabled outline-removal.

---

## 8. Testing contract

Five surfaces exist. Three are the **per-component author's responsibility** on every component change; two are **repo-level gates** authors only touch when the component participates in that surface.

### 8.1 Per-component minimum

Every new or modified component MUST ship all three:

| Surface | Tool | Location | Scope |
|---|---|---|---|
| **Unit** | Vitest | `<name>.test.ts` colocated | Pure logic, attribute/property reflection, event dispatch shape, internal state transitions, token resolution. **No a11y assertions.** |
| **Functional + a11y** | @web/test-runner | `packages/elements/test/functional/<name>.spec.ts` | Real-browser behavior: shadow DOM composition, focus, keyboard, slot assignment, layout, CSS custom property cascade, plus an axe-core scan of the rendered component. |
| **Storybook stories** | Storybook (WC + Vite) | `apps/storybook/` | Default, states, and theming stories (§10). Storybook is the docs surface — every component must be documented. |

Missing any of these blocks merge.

**Coverage thresholds (CI-enforced on unit tests):** lines ≥ 90, branches ≥ 90, functions ≥ 90, statements ≥ 90. Set in `vitest.config.ts`. Never lowered to fix a build.

### 8.2 Repo-level gates (touched when relevant)

| Surface | Tool | Location | When an author updates it |
|---|---|---|---|
| **Visual regression** | Playwright screenshots | `implementation-tests/e2e/visual/` | When the component appears in the reference screen or its rendered output changes — snapshots are created/updated and reviewed in the PR. Default theme + one alternate theme, Chromium baseline. |
| **End-to-end** | Playwright | `implementation-tests/e2e/functional/` | When the component changes a user flow in `scenario.md`. The same scenario suite runs against all four impl apps; any framework-specific divergence is a bug in the component API. |

### 8.3 CI gates
A PR cannot merge unless all of the following pass:
`typecheck`, `lint`, `test:unit` (with coverage thresholds), `test:functional` (includes a11y), `test:visual`, `test:e2e`, `build`, and the Storybook build.

---

## 9. Implementation-tests (canaries)

**Purpose.** Custom-element behavior differs subtly across host frameworks (attribute-vs-property passing, event naming, SSR hydration, template compilers, Angular schema metadata, React's historical quirks pre-19). The `implementation-tests/` workspaces are our canaries: the same reference demo app, implemented four times, exercised by the same Playwright suite.

**Rules**
- Each app imports the **built** `@foundry/*` packages from the workspace — no source re-imports.
- No framework-specific wrappers around components. If a wrapper would be needed, the component API is the thing to fix.
- The reference screen is defined once in `implementation-tests/scenario.md` and each app implements it idiomatically for its framework (JSX, templates, directives, etc.).
- When a component is added, its usage is added to the reference screen in all four apps in the same PR if it's part of the reference surface.

**Apps**
| App | Stack |
|---|---|
| `html-js` | Plain HTML + ES modules, no bundler required |
| `react` | React (latest stable) + Vite |
| `angular` | Angular (latest stable) + Angular CLI |
| `vue` | Vue 3 + Vite |

---

## 10. Docs & preview — Storybook

- Location: `apps/storybook/`.
- Framework: Storybook with the Web Components renderer and Vite builder.
- Every component has at least: a default story, a states story (all variants/states), and a theming story (same component under multiple themes).
- Storybook reads `custom-elements.json` for automatic props/events/slots/CSS-parts documentation — keep the manifest fresh.
- Storybook is built in CI as a smoke test and deployed as the public docs surface. It is **not** a substitute for the impl-test apps — it runs components in isolation; canary apps run them inside real frameworks.

---

## 11. Root scripts

Defined at the repo root `package.json`; they fan out through npm workspaces.

| Script | What it does |
|---|---|
| `build` | Builds every `@foundry/*` package, Storybook, and every impl-test app |
| `typecheck` | `tsc --noEmit` across all workspaces |
| `lint` | ESLint + Prettier check |
| `test:unit` | Vitest with coverage thresholds |
| `test:functional` | @web/test-runner (includes a11y) |
| `test:visual` | Playwright visual regression |
| `test:e2e` | Playwright functional E2E against all four impl apps |
| `test` | Runs typecheck → lint → unit → functional → visual → e2e |
| `coverage` | Generates HTML coverage report |
| `storybook` | Runs Storybook locally |

---

## 12. Browser support

**Evergreen only**, no polyfills:
- Chrome (current)
- Edge (current)
- Firefox (current)
- Safari (latest 2 major versions)

If a CSS or JS feature is not supported across that matrix, it is not used. No `@webcomponents/*` polyfills, no constructable-stylesheet shims, no focus-visible polyfill.

---

## 13. What NOT to do

- ❌ Add a framework runtime dependency to any `@foundry/*` package.
- ❌ Introduce polyfills.
- ❌ Lower coverage thresholds to unblock CI.
- ❌ Bypass `FoundryElement` in a new component without an RFC note in the PR.
- ❌ Use `innerHTML` at runtime, or build a hand-rolled tagged-template rendering layer.
- ❌ Use a `closed` shadow root.
- ❌ Put axe assertions in unit tests (jsdom a11y signal is unreliable).
- ❌ Author CSS-in-JS / `.css.ts`. CSS lives in `.css` files.
- ❌ Style components from light DOM in ways other than overriding `--foundry-*` tokens.
- ❌ Reference primitive tokens from component CSS or from themes — always go through the semantic (or component) tier.
- ❌ Encode mode (light/dark/HC) in token names — swap values under a scope instead.
- ❌ Place `state` anywhere but last in a token name, or invent state synonyms outside the canonical list.
- ❌ Ship a component without unit tests, functional+a11y tests, AND Storybook stories (default, states, theming).
- ❌ Add a framework-specific wrapper in `implementation-tests/` to paper over a bad API.
- ❌ Use `any` in exported types or `// @ts-ignore` in published source.
- ❌ Re-import `@foundry/*` source from the impl apps — always consume the built package.

---

## 14. Review checklist for a new component

Before approving a PR that adds or modifies a component:

**Author-owned (always required):**
- [ ] Tag registered via `.define()` and defaulted to `foundry-<name>`.
- [ ] Extends `FoundryElement`; open shadow root; template cloned from `<name>.template.html`; styles from `<name>.css`.
- [ ] Styled exclusively via semantic (or the component's own) `--foundry-*` tokens — never primitives. Token names follow the §6.2 grammar.
- [ ] Public properties, attributes, events, slots, CSS parts, and CSS custom properties documented via JSDoc (manifest is regenerated at build).
- [ ] If interactive: follows the matching ARIA APG pattern (roles, states, keyboard).
- [ ] Unit tests present; coverage thresholds still green.
- [ ] Functional (WTR) tests present, including axe-core scan.
- [ ] Storybook stories added/updated (default, states, theming).
- [ ] No new dependencies in `@foundry/*` packages (or explicitly justified in the PR).

**Only if the component participates in that surface:**
- [ ] Used in the four impl-test apps if part of the reference screen; Playwright E2E scenarios updated.
- [ ] Visual regression snapshots created / updated and reviewed.

---

## 15. Keeping this file current

When a decision in this document changes:

1. Update the relevant section here in the same PR that implements the change.
2. If the change affects the golden rules (§2), tech stack (§3), or testing contract (§8), call it out in the PR description.
3. Never let this file drift from the actual tooling and conventions — an out-of-date AGENTS.md is worse than none.
