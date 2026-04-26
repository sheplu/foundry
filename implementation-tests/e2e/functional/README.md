# @foundry/functional-tests

Playwright E2E suite driving the shared reference screen from `implementation-tests/scenario.md`. Runs against each canary app listed in that folder.

Targets the React canary (`@foundry/react-canary`) on port 5173 and the Vue canary (`@foundry/vue-canary`) on port 5174. Angular and html-js canaries will hook into the same suite via additional spec files sharing the same scenario.

## Port allocation

| Canary | Port |
|---|---|
| React | 5173 |
| Vue | 5174 |
| (future) Angular | 5175 |
| (future) html-js | 5176 |

Each spec file declares its own `baseURL` via `test.use({ baseURL })` so spec files are self-contained.

## Running locally

```
npm run test:e2e
```

Playwright's `webServer` block spawns `npm run dev -w @foundry/react-canary` on port 5173 and tears it down after the run. Reuses an existing dev server outside of CI (`reuseExistingServer: !process.env.CI`).

## Prerequisites

- `@foundry/{tokens,elements,icons,themes}` built (`npm run build`). The React dev server resolves linked workspace deps against their `dist/`.
- Chromium installed via `npx playwright install chromium` (done once; CI has its own install step).

## Updating

- Edit `implementation-tests/scenario.md` in the same PR as the component change that drives it.
- When a new canary app lands, add a sibling `<framework>.spec.ts` pointing at that app's base URL (or share the spec if the scenario is identical).
