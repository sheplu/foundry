# @foundry/icons

The `<foundry-icon>` custom element and a curated set of SVG icons for the foundry design system. Ships three icons in v1: `check`, `chevron-down`, `close`.

## Why a separate package

Icons accumulate. Keeping them out of `@foundry/elements` means consumers only bundle what they register.

## Usage

Register the icons you need once at startup, then define the element:

```ts
import { FoundryIcon, check, chevronDown, close } from '@foundry/icons';

FoundryIcon.register({ check, 'chevron-down': chevronDown, close });
FoundryIcon.define(); // registers as <foundry-icon>
```

Then use it in markup:

```html
<foundry-icon name="check"></foundry-icon>
<foundry-icon name="close" label="Close dialog"></foundry-icon>
```

## Accessibility

Icons are **decorative by default** (`aria-hidden="true"`). Pair them with text for meaning, e.g. inside a button:

```html
<foundry-button>
  <foundry-icon name="check"></foundry-icon>
  Save
</foundry-button>
```

Set `label` when an icon stands alone and needs to announce itself:

```html
<foundry-icon name="close" label="Close dialog"></foundry-icon>
```

With `label`, the host element becomes `role="img"` with `aria-label="…"`.

## Sizing and color

The icon sizes to `--foundry-icon-size` (defaults `1em`, so it matches the surrounding text) and inherits `color`:

```css
.toolbar foundry-icon {
  --foundry-icon-size: 1.5rem;
  color: var(--foundry-color-text-muted);
}
```

## Authoring new icons

SVGs live under `src/svg/` and follow strict rules:

- `viewBox="0 0 24 24"` — no other sizes.
- `stroke="currentColor"` or `fill="currentColor"` — no hardcoded colors.
- No `width`/`height` attributes on the root `<svg>`.
- No `<?xml ?>` prolog, no `xmlns`.

A test in `foundry-icon.test.ts` validates every registered icon against these rules.

## XSS guard

`<foundry-icon>` inlines the registered SVG via `innerHTML` on a private shadow-DOM span. To make that safe, the registry only accepts values of the branded `IconSvg` type, which can only be produced by `loadIcon(svg)`. The package's three built-in exports (`check`, `chevronDown`, `close`) are already branded.

```ts
import { FoundryIcon, loadIcon } from '@foundry/icons';

// Consumer adding a custom icon from a trusted source:
const my = loadIcon(/* svg string */);
FoundryIcon.register({ my });
```

`loadIcon()` throws on any SVG containing `<script>` tags, `on*=` event-handler attributes, or `javascript:` URIs. The type brand prevents accidentally passing a raw string from (say) user input into `register()`.
