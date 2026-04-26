# @foundry/html-js-canary

Plain HTML + ES-module consumer of the foundry design system — no bundler, no framework, no build step. Implements the reference screen from `implementation-tests/scenario.md`.

Serves as the AGENTS.md §9 canary proving that the published packages work in a browser directly.

## Running locally

```
npm run build -w @foundry/tokens -w @foundry/elements -w @foundry/icons -w @foundry/themes
npm run dev:html-js
# open http://127.0.0.1:5175/implementation-tests/html-js/
```

The packages must be built first so `node_modules/@foundry/*/dist/` contains the files the import map points at.

## How it works

- `<script type="importmap">` in `<head>` maps `@foundry/elements`, `@foundry/icons`, `@foundry/tokens` to their workspace-symlinked `dist/index.js` files under `node_modules/`.
- Theme CSS loads via a plain `<link rel="stylesheet">` pointing at `@foundry/themes/dist/css/default.css`.
- A single inline `<script type="module">` registers icons, defines the custom elements, and wires the theme toggle + click counter.

No framework runtime is involved — if this canary breaks, the component API is broken for every consumer.

## Monorepo-specific: why paths use `../../`

npm workspaces hoist dependency symlinks to the repo root's `node_modules/`, not the canary's. The import map therefore points at `../../node_modules/@foundry/*`, and `http-server` serves from the repo root (`../..`) so those paths resolve. A real consumer (not a workspace member) would use `./node_modules/@foundry/*` and serve from the app root as usual — the import-map shape stays the same, only the relative prefix changes.
