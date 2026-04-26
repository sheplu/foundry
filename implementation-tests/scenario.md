# foundry canary reference screen

Shared scenario implemented identically by every `implementation-tests/*` app. Playwright E2E specs in `implementation-tests/e2e/functional/` drive this screen, so the layout and identifiers below are load-bearing.

When a new component lands that belongs on the reference screen, update this file and every canary app in the same PR — AGENTS.md §9 requires it.

## Layout

- **Header** (`data-testid="app-header"`)
  - Title: `foundry canary`.
  - Theme toggle button (`data-testid="theme-toggle"`). A native `<button>` (not a `<foundry-button>`) so the canary's theme wiring stays independent of any component under test.
- **Button grid** (`data-testid="button-grid"`)
  - Row 1 — enabled:
    - `<foundry-button variant="primary">primary</foundry-button>` with `data-testid="btn-primary"`.
    - `<foundry-button variant="secondary">secondary</foundry-button>` with `data-testid="btn-secondary"`.
    - `<foundry-button variant="danger">danger</foundry-button>` with `data-testid="btn-danger"`.
  - Row 2 — disabled:
    - Same three variants, each with the `disabled` attribute.
    - `data-testid` suffixed with `-disabled` (e.g. `btn-primary-disabled`).
  - Click counter beside the grid (`data-testid="click-count"`). Displays an integer; starts at 0.
- **Icon gallery** (`data-testid="icon-gallery"`, a `<ul>`)
  - Three `<li>` entries, one per registered icon:
    - `<foundry-icon name="check" label="Check"></foundry-icon>` with visible text `check`.
    - `<foundry-icon name="chevron-down" label="Chevron down"></foundry-icon>` with visible text `chevron-down`.
    - `<foundry-icon name="close" label="Close"></foundry-icon>` with visible text `close`.
- **Icon buttons** (`data-testid="icon-button-row"`)
  - Three `<foundry-icon-button>` elements:
    - `name="check" label="Confirm" variant="primary"` with `data-testid="iconbtn-confirm"`.
    - `name="close" label="Close" variant="secondary"` with `data-testid="iconbtn-close"`.
    - `name="close" label="Close disabled" variant="danger" disabled` with `data-testid="iconbtn-close-disabled"`.
  - Clicking an enabled icon button increments the same click counter as the regular button grid.

## Behavior

- Clicking the theme toggle flips `document.documentElement.dataset.theme` between `"light"` (default) and `"dark"`. Buttons' computed backgrounds change via the `@foundry/themes` `[data-theme]` scopes.
- Clicking any enabled `<foundry-button>` increments the click counter by 1.
- Clicking a disabled `<foundry-button>` does not increment the counter (native `<button>` suppresses the event).
- All three icons must render an `<svg>` element inside their shadow root once the page is ready.

## Why the scenario is minimal

The canary validates **consumption** — not component breadth. The smallest surface that exercises attributes, events, shadow DOM composition, theme CSS cascade, and the icon registry is enough to expose framework-specific bugs. More surface is added only when a new component needs coverage that isn't already here.
