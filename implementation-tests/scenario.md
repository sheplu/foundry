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
  - Row 2 — disabled (same three variants, each with the `disabled` attribute):
    - `<foundry-button variant="primary" disabled>primary</foundry-button>` with `data-testid="btn-primary-disabled"`.
    - `<foundry-button variant="secondary" disabled>secondary</foundry-button>` with `data-testid="btn-secondary-disabled"`.
    - `<foundry-button variant="danger" disabled>danger</foundry-button>` with `data-testid="btn-danger-disabled"`.
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
- **Headings** (`data-testid="heading-row"`)
  - Three `<foundry-heading>` elements, one per level tier:
    - `<foundry-heading level="1">Page title</foundry-heading>` with `data-testid="heading-page"`.
    - `<foundry-heading level="2" size="lg">Section title</foundry-heading>` with `data-testid="heading-section"`.
    - `<foundry-heading level="3" size="sm">Subsection title</foundry-heading>` with `data-testid="heading-sub"`.
- **Text** (`data-testid="text-row"`)
  - Four `<foundry-text>` elements, one per variant:
    - `<foundry-text>Body text</foundry-text>` with `data-testid="text-body"`.
    - `<foundry-text variant="body-sm">Small body text</foundry-text>` with `data-testid="text-body-sm"`.
    - `<foundry-text variant="caption">Caption</foundry-text>` with `data-testid="text-caption"`.
    - `<foundry-text variant="emphasis">Emphasis</foundry-text>` with `data-testid="text-emphasis"`.
- **Stacks** (`data-testid="stack-row"`)
  - Four `<foundry-stack>` elements, one per space rung. Each contains two plain
    `<div>` children ("first" / "second") so the gap is visible:
    - `<foundry-stack space="xs">…</foundry-stack>` with `data-testid="stack-xs"`.
    - `<foundry-stack space="sm">…</foundry-stack>` with `data-testid="stack-sm"`.
    - `<foundry-stack>…</foundry-stack>` (default `md`) with `data-testid="stack-md"`.
    - `<foundry-stack space="lg">…</foundry-stack>` with `data-testid="stack-lg"`.

## Behavior

- Clicking the theme toggle flips `document.documentElement.dataset.theme` between `"light"` (default) and `"dark"`. Buttons' computed backgrounds change via the `@foundry/themes` `[data-theme]` scopes.
- Clicking any enabled `<foundry-button>` increments the click counter by 1.
- Clicking a disabled `<foundry-button>` does not increment the counter (native `<button>` suppresses the event).
- All three icons must render an `<svg>` element inside their shadow root once the page is ready.

## Why the scenario is minimal

The canary validates **consumption** — not component breadth. The smallest surface that exercises attributes, events, shadow DOM composition, theme CSS cascade, and the icon registry is enough to expose framework-specific bugs. More surface is added only when a new component needs coverage that isn't already here.
