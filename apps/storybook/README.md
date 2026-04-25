# @foundry/storybook

Docs surface for the foundry design system. Built with Storybook, the Web Components renderer, and the Vite builder.

## Run locally

```
npm run storybook           # dev server at http://localhost:6006
npm run build-storybook     # emits apps/storybook/storybook-static/
```

Stories live next to the components in `packages/elements/src/**/*.stories.ts`. A global theme toolbar (top right) toggles `data-theme` on the preview root, so every story can be inspected in light and dark.
