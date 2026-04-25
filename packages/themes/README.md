# @foundry/themes

Theme stylesheets for the foundry design system. Ships two stylesheets; no JavaScript runtime.

## Default theme

```css
@import '@foundry/themes/css/default.css';
```

Loads every primitive and semantic `--foundry-*` CSS custom property in one sheet. Apps only need this file to render components correctly.

## Dark mode

```css
@import '@foundry/themes/css/default.css';
@import '@foundry/themes/css/dark.css';
```

`dark.css` ships three rule groups:

1. `@media (prefers-color-scheme: dark) { :root { ... } }` — automatic dark values when the OS is set to dark mode.
2. `[data-theme="light"] { ... }` — explicit opt-out; restores the light values even when the OS prefers dark.
3. `[data-theme="dark"] { ... }` — explicit opt-in; applies dark values regardless of OS preference.

Set the data attribute on `<html>` (or any scoped ancestor) to override the default:

```html
<html data-theme="dark">
<html data-theme="light">
```

Leaving the attribute off lets the `@media` query drive the mode.

## What dark mode overrides

Only semantic **color** tokens — surfaces, text, borders, actions. Spacing, radius, and other categories pass through unchanged. See AGENTS.md §6.4 for the rationale (mode is a value swap at the semantic layer, never encoded in token names).

## Custom theming

To ship your own theme, override any semantic `--foundry-*` variable on `:root` or a scoped container:

```css
:root {
  --foundry-color-action-primary: #9333ea;
}
```

Only the semantic (and component) layers are meant to be overridden — never primitives.
