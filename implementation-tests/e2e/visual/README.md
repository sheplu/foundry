# @foundry/visual-tests

Playwright visual-regression suite for the foundry design system. Snapshots the built Storybook (`apps/storybook/storybook-static/`) and compares against committed baselines.

## Running locally

```
npm run build                       # ensure storybook-static is fresh
npm run test:visual                 # compare against committed baselines
npm run test:visual:update          # regenerate baselines (Linux only — see below)
```

## Updating baselines

Baselines are captured inside the official Playwright Docker image so they match the CI environment exactly. CI runs this suite inside the same image (see `.github/workflows/quality-gates.yaml`). Always regenerate baselines through Docker — even on Linux hosts — or screenshots will drift between machines.

```
docker run --rm -v "$PWD":/work -w /work/implementation-tests/e2e/visual \
  mcr.microsoft.com/playwright:v1.59.1-noble \
  sh -c 'npm install --no-save --omit=optional && npx playwright test --update-snapshots'
```

Commit the regenerated `*.png` files under `tests/*-snapshots/`.

## Keeping the image tag in sync

Three places MUST reference the same Playwright version:

1. `@playwright/test` in `package.json`.
2. The `mcr.microsoft.com/playwright:<tag>` image in the `docker run` command above.
3. The `container.image` in `.github/workflows/quality-gates.yaml` (`visual-regression` job).

When bumping `@playwright/test`, update the image tag in both places and regenerate baselines. Mismatched tags will produce pixel drift that `maxDiffPixelRatio` can't absorb.

## When to update

- Intentional rendering change (new token value, new variant, CSS refactor).
- Font or layout change visible by eye.
- Playwright version bump (see above).

Never update baselines to "make CI pass" for a suspected test flake — investigate first. The allowed drift is `maxDiffPixelRatio: 0.01` (≤1% of pixels).
