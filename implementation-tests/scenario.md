# foundry canary reference screen

Shared scenario implemented identically by every `implementation-tests/*` app. Playwright E2E specs in `implementation-tests/e2e/functional/` drive this screen, so the layout and identifiers below are load-bearing.

When a new component lands that belongs on the reference screen, update this file and every canary app in the same PR — AGENTS.md §9 requires it.

## Layout

- **Header** (`data-testid="app-header"`)
  - Title: `foundry canary`.
  - Theme toggle button (`data-testid="theme-toggle"`). A native `<button>` (not a `<foundry-button>`) so the canary's theme wiring stays independent of any component under test.
- **Breadcrumbs** (`data-testid="breadcrumbs-row"`)
  - One `<foundry-breadcrumbs data-testid="breadcrumbs">` wrapping three `<foundry-breadcrumb>` items:
    - `<foundry-breadcrumb data-testid="bc-home">` containing `<foundry-link href="/">Home</foundry-link>`.
    - `<foundry-breadcrumb data-testid="bc-docs">` containing `<foundry-link href="/docs">Docs</foundry-link>`.
    - `<foundry-breadcrumb current data-testid="bc-current">Breadcrumbs</foundry-breadcrumb>` — plain text, current page. Expects `aria-current="page"` on the host and the trailing separator hidden via CSS.
- **Button grid** (`data-testid="button-grid"`)
  - Row 1 — enabled:
    - `<foundry-button variant="primary">primary</foundry-button>` with `data-testid="btn-primary"`.
    - `<foundry-button variant="secondary">secondary</foundry-button>` with `data-testid="btn-secondary"`.
    - `<foundry-button variant="danger">danger</foundry-button>` with `data-testid="btn-danger"`.
  - Row 2 — disabled (same three variants, each with the `disabled` attribute):
    - `<foundry-button variant="primary" disabled>primary</foundry-button>` with `data-testid="btn-primary-disabled"`.
    - `<foundry-button variant="secondary" disabled>secondary</foundry-button>` with `data-testid="btn-secondary-disabled"`.
    - `<foundry-button variant="danger" disabled>danger</foundry-button>` with `data-testid="btn-danger-disabled"`.
  - Row 3 — loading:
    - `<foundry-button variant="primary" loading>primary loading</foundry-button>` with `data-testid="btn-primary-loading"` — expects the inner `<button>` to carry `aria-busy="true"` and be disabled. Clicking it does NOT increment the counter.
  - Click counter beside the grid (`data-testid="click-count"`). Displays an integer; starts at 0.
- **Icon gallery** (`data-testid="icon-gallery"`, a `<ul>`)
  - Three `<li>` entries, one per registered icon:
    - `<foundry-icon name="check" label="Check"></foundry-icon>` with visible text `check`.
    - `<foundry-icon name="chevron-down" label="Chevron down"></foundry-icon>` with visible text `chevron-down`.
    - `<foundry-icon name="close" label="Close"></foundry-icon>` with visible text `close`.
- **Icon buttons** (`data-testid="icon-button-row"`)
  - Four `<foundry-icon-button>` elements:
    - `name="check" label="Confirm" variant="primary"` with `data-testid="iconbtn-confirm"`.
    - `name="close" label="Close" variant="secondary"` with `data-testid="iconbtn-close"`.
    - `name="close" label="Close disabled" variant="danger" disabled` with `data-testid="iconbtn-close-disabled"`.
    - `name="check" label="Save" variant="primary" loading` with `data-testid="iconbtn-loading"` — expects the inner native `<button>` to carry `aria-busy="true"` and be `disabled`; the `<foundry-icon>` is hidden (`display: none`) and a `<foundry-spinner>` renders in its place. Clicking it does NOT increment the click counter.
  - Clicking an enabled icon button increments the same click counter as the regular button grid.
- **Tooltips** (`data-testid="tooltip-row"`)
  - Three `<foundry-tooltip>` elements covering the placement + trigger-element branches. Each wraps a trigger (default slot) and a `<span slot="content">`:
    - `<foundry-tooltip placement="top" data-testid="tooltip-top">` around `<foundry-button data-testid="tooltip-top-trigger">Top</foundry-button>` with a "Top tooltip" content. Expects: on focusin of the trigger, the host gets `[open]` and the trigger gains `aria-describedby`; the surface carries `role="tooltip"` and `popover="manual"`.
    - `<foundry-tooltip placement="bottom" data-testid="tooltip-bottom">` around `<foundry-icon-button name="close" label="Close" data-testid="tooltip-bottom-trigger">` with "Close this panel" content. Covers the icon-button consumer.
    - `<foundry-tooltip placement="right" data-testid="tooltip-right">` around a plain `<button data-testid="tooltip-right-trigger">info</button>` with "Info tooltip" content. Covers the "any HTML element as trigger" case.
- **Popovers** (`data-testid="popover-row"`)
  - One `<foundry-popover placement="bottom" data-testid="popover-default">` wrapping a `<foundry-button data-testid="popover-trigger">Open</foundry-button>` (default slot) and a rich `<div slot="content" data-testid="popover-content">` with copy + a close button. Expects: clicking the trigger opens the popover — the host gains `[open]`, the trigger carries `aria-expanded="true"` + `aria-haspopup="dialog"` + `aria-controls={surfaceId}`, and the surface has `role="dialog"` + `popover="auto"`. Clicking the trigger again closes it. Pressing `Escape` also closes it.
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
- **Links** (`data-testid="link-row"`)
  - Three `<foundry-link>` elements covering the variant + target branches:
    - `<foundry-link href="/docs">docs</foundry-link>` (default `inline`, same-origin) with `data-testid="link-inline"`.
    - `<foundry-link variant="standalone" href="/nav">nav</foundry-link>` with `data-testid="link-standalone"`.
    - `<foundry-link href="https://example.com" target="_blank">external</foundry-link>` with `data-testid="link-external"` — expects the component to auto-add `rel="noopener"` to the inner `<a>`.
- **Stacks** (`data-testid="stack-row"`)
  - Four `<foundry-stack>` elements, one per space rung. Each contains two plain
    `<div>` children ("first" / "second") so the gap is visible:
    - `<foundry-stack space="xs">…</foundry-stack>` with `data-testid="stack-xs"`.
    - `<foundry-stack space="sm">…</foundry-stack>` with `data-testid="stack-sm"`.
    - `<foundry-stack>…</foundry-stack>` (default `md`) with `data-testid="stack-md"`.
    - `<foundry-stack space="lg">…</foundry-stack>` with `data-testid="stack-lg"`.
- **Clusters** (`data-testid="cluster-row"`)
  - Four `<foundry-cluster>` elements, one per space rung. Each contains two
    `<span>` children ("one" / "two") so the horizontal gap is visible:
    - `<foundry-cluster space="xs">…</foundry-cluster>` with `data-testid="cluster-xs"`.
    - `<foundry-cluster space="sm">…</foundry-cluster>` with `data-testid="cluster-sm"`.
    - `<foundry-cluster>…</foundry-cluster>` (default `md`) with `data-testid="cluster-md"`.
    - `<foundry-cluster space="lg">…</foundry-cluster>` with `data-testid="cluster-lg"`.
- **Insets** (`data-testid="inset-row"`)
  - Three `<foundry-inset>` elements, one per inset rung. Each wraps a single
    `<span>` ("padded") so the padding is visible:
    - `<foundry-inset space="sm">…</foundry-inset>` with `data-testid="inset-sm"`.
    - `<foundry-inset>…</foundry-inset>` (default `md`) with `data-testid="inset-md"`.
    - `<foundry-inset space="lg">…</foundry-inset>` with `data-testid="inset-lg"`.
- **Dividers** (`data-testid="divider-row"`)
  - One horizontal and one vertical `<foundry-divider>`. The vertical divider
    sits inside a small flex row with sibling text so it has a resolved height:
    - `<foundry-divider></foundry-divider>` (default horizontal) with `data-testid="divider-horizontal"`.
    - `<foundry-divider orientation="vertical"></foundry-divider>` with `data-testid="divider-vertical"`,
      flanked by `<span>before</span>` and `<span>after</span>` in an inline flex container.
- **Badges** (`data-testid="badge-row"`)
  - Five `<foundry-badge>` elements, one per intent:
    - `<foundry-badge>neutral</foundry-badge>` (default) with `data-testid="badge-neutral"`.
    - `<foundry-badge variant="info">info</foundry-badge>` with `data-testid="badge-info"`.
    - `<foundry-badge variant="success">success</foundry-badge>` with `data-testid="badge-success"`.
    - `<foundry-badge variant="warning">warning</foundry-badge>` with `data-testid="badge-warning"`.
    - `<foundry-badge variant="danger">danger</foundry-badge>` with `data-testid="badge-danger"`.
- **Tags** (`data-testid="tag-row"`)
  - Three `<foundry-tag>` elements covering the presentational / removable / disabled branches, plus a `<pre data-testid="tag-remove-log"></pre>` sibling that the canary's `remove` listener writes to:
    - `<foundry-tag data-testid="tag-plain">Read</foundry-tag>` — presentational (no `removable`).
    - `<foundry-tag removable value="design" data-testid="tag-removable">design</foundry-tag>` — removable. Clicking its close button dispatches `remove` with `detail.value === 'design'` and auto-removes the tag from the DOM (canary listener does NOT call `preventDefault()`), writing `"design"` into `tag-remove-log`.
    - `<foundry-tag removable disabled data-testid="tag-disabled">locked</foundry-tag>` — removable + disabled. Clicking its close button is a no-op; the tag stays mounted and the log is unchanged.
- **Avatars** (`data-testid="avatar-row"`)
  - Three `<foundry-avatar>` elements covering the initials / status / decorative branches:
    - `<foundry-avatar name="Ada Lovelace" data-testid="avatar-initials"></foundry-avatar>` — renders initials `AL` (no `src`). Host gets `role="img"` + `aria-label="Ada Lovelace"`.
    - `<foundry-avatar name="Grace Hopper" status="online" data-testid="avatar-status"></foundry-avatar>` — renders initials + the online status dot.
    - `<foundry-avatar data-testid="avatar-decorative"></foundry-avatar>` — no name / no label, host gets `aria-hidden="true"` and no `role`.
- **Alerts** (`data-testid="alert-row"`)
  - Three `<foundry-alert>` elements covering the role + title branches:
    - `<foundry-alert variant="info">` with a `<span slot="title">` and body copy, `data-testid="alert-info"` — expects `role="status"` and `has-title`.
    - `<foundry-alert variant="warning">` with body copy only (no title slot), `data-testid="alert-warning"` — expects `role="alert"` and no `has-title` attribute.
    - `<foundry-alert variant="danger">` with a `<span slot="title">` and body copy, `data-testid="alert-danger"` — expects `role="alert"` and `has-title`.
- **Spinners** (`data-testid="spinner-row"`)
  - Three `<foundry-spinner>` elements covering the size + accessible-name branches:
    - `<foundry-spinner data-testid="spinner-default"></foundry-spinner>` — default `md`, decorative. Expects `aria-hidden="true"` and no `role`.
    - `<foundry-spinner size="sm" data-testid="spinner-sm"></foundry-spinner>` — smaller variant, also decorative.
    - `<foundry-spinner size="lg" label="Loading" data-testid="spinner-labelled"></foundry-spinner>` — larger variant with accessible label. Expects `role="status"` and `aria-label="Loading"`.
- **Skeletons** (`data-testid="skeleton-row"`)
  - Three `<foundry-skeleton>` elements covering the shape + accessible-name branches:
    - `<foundry-skeleton data-testid="skeleton-text"></foundry-skeleton>` — default `text` shape, decorative. Expects `aria-hidden="true"` and no `role`.
    - `<foundry-skeleton shape="circle" data-testid="skeleton-circle"></foundry-skeleton>` — avatar placeholder, decorative.
    - `<foundry-skeleton shape="rect" label="Loading article" data-testid="skeleton-labelled"></foundry-skeleton>` — rect placeholder with accessible label. Expects `role="status"` and `aria-label="Loading article"`.
- **Progress** (`data-testid="progress-row"`)
  - Three `<foundry-progress>` elements covering the variant + custom-label branches:
    - `<foundry-progress value="40" data-testid="progress-default"></foundry-progress>` — neutral variant at 40%. Expects `role="progressbar"`, `aria-valuenow="40"`, `aria-valuemax="100"`, `aria-label="Progress"`.
    - `<foundry-progress variant="success" value="80" data-testid="progress-success"></foundry-progress>` — success variant at 80%.
    - `<foundry-progress value="3" max="10" variant="warning" label="Checklist" data-testid="progress-labelled"></foundry-progress>` — custom `max` + explicit label. Expects `aria-valuenow="3"`, `aria-valuemax="10"`, `aria-label="Checklist"`.
- **Dialogs** (`data-testid="dialog-row"`)
  - A native `<button data-testid="dialog-open">Open confirmation</button>` that
    calls `show()` on the adjacent `<foundry-modal data-testid="dialog-confirm" size="sm">`. The trigger stays native (not a `<foundry-button>`) so the dialog E2E flow isn't coupled to the button component under test.
  - The modal has `<span slot="title">Confirm action</span>`, `<span slot="description">Are you sure?</span>`, body copy, and a `<form slot="footer" method="dialog">` containing:
    - `<button type="submit" value="cancel" data-testid="dialog-cancel">Cancel</button>`
    - `<button type="submit" value="confirm" data-testid="dialog-confirm-btn">Confirm</button>`
  - A sibling `<pre data-testid="dialog-result"></pre>` captures the returnValue. The canary wires a `close` listener that writes `event.detail.returnValue` (or `"dismiss"` from backdrop click, or `""` from Escape) into that element.
  - Expects: opening sets the host `[open]` attribute and hoists the dialog into the top layer. Escape closes with an empty result. Backdrop click closes with `dismiss`. Cancel writes `cancel`; Confirm writes `confirm`. `aria-labelledby` points at the shadow-scoped title ID when open.
- **Tabs** (`data-testid="tabs-row"`)
  - One `<foundry-tabs data-testid="tabs-main">` wrapping three `<foundry-tab slot="tab">` items and three `<foundry-panel>` bodies, paired by DOM order:
    - `<foundry-tab slot="tab" value="overview" data-testid="tab-overview">Overview</foundry-tab>` → `<foundry-panel data-testid="panel-overview">` with plain text.
    - `<foundry-tab slot="tab" value="activity" data-testid="tab-activity">Activity</foundry-tab>` → `<foundry-panel data-testid="panel-activity">` with a short `<ul>` of events.
    - `<foundry-tab slot="tab" value="settings" data-testid="tab-settings">Settings</foundry-tab>` → `<foundry-panel data-testid="panel-settings">` containing a native `<button data-testid="tab-setting-btn">Save</button>`.
  - Expects: the first tab is selected by default (`selected` on the host tab, `aria-selected="true"`, `tabindex="0"`). Clicking another tab activates it, hides the previous panel, reveals the new one. ArrowRight on a focused tab moves focus but does NOT activate (manual activation); Enter activates. Each panel carries `role="tabpanel"` and `aria-labelledby` pointing at its paired tab's id. Only the currently-selected tab has `tabindex="0"`.
- **Form** (`data-testid="profile-form"`)
  - A `<form>` wrapping two `<foundry-text-field>` elements, one `<foundry-textarea>`, plus a native submit button, and a `<pre>` that displays the last submitted form data as JSON. The form's submit handler calls `event.preventDefault()`, serialises `new FormData(form)` to JSON, and renders it into `form-output`:
    - `<foundry-text-field name="email" type="email" required>` with a `<span slot="label">Email</span>` and a `<span slot="hint">We never share your email.</span>`, `data-testid="tf-email"`.
    - `<foundry-text-field name="username" required minlength="3">` with a `<span slot="label">Username</span>` and a `<span slot="error">Username must be at least 3 characters.</span>`, `data-testid="tf-username"`.
    - `<foundry-textarea name="bio" maxlength="500" rows="3">` with a `<span slot="label">Bio</span>` and a `<span slot="hint">Up to 500 characters.</span>`, `data-testid="tf-bio"` — optional, not required.
    - `<foundry-checkbox name="subscribe" value="weekly">` with a `<span slot="label">Send me weekly updates</span>`, `data-testid="cb-subscribe"` — optional. When unchecked, the field is omitted from the submitted `FormData` (native checkbox semantics); when checked, `subscribe=weekly` surfaces in the JSON output.
    - `<foundry-switch name="notifications" value="on">` with a `<span slot="label">Enable notifications</span>`, `data-testid="sw-notifications"` — optional, initially off. When toggled on, `notifications=on` surfaces in the submitted JSON; when off, the field is omitted (native checkbox semantics with `role="switch"` on the inner input).
    - `<foundry-select name="timezone" placeholder="Select a timezone" required>` with a `<span slot="label">Timezone</span>` and four `<foundry-option>` children, `data-testid="sel-timezone"`:
      - `<foundry-option value="utc">UTC</foundry-option>`
      - `<foundry-option value="est">Eastern (EST)</foundry-option>`
      - `<foundry-option value="pst">Pacific (PST)</foundry-option>`
      - `<foundry-option value="cet">Central European (CET)</foundry-option>`
      - Required — must be selected for the form to submit successfully. Initial value is empty (placeholder shown); selecting one causes `timezone=<value>` to surface in the JSON output. In Phase 1 the listbox does not open on click; the `value` is driven via the host property or the `value` attribute (real-browser E2E tests exercise the FormData round-trip programmatically).
    - A `<fieldset>` with `<legend>Plan</legend>` wrapping three `<foundry-radio name="plan">` elements:
      - `<foundry-radio name="plan" value="free" checked>` with a `<span slot="label">Free</span>`, `data-testid="rd-plan-free"` — initially selected so the form always submits a plan.
      - `<foundry-radio name="plan" value="pro">` with a `<span slot="label">Pro</span>`, `data-testid="rd-plan-pro"`.
      - `<foundry-radio name="plan" value="enterprise">` with a `<span slot="label">Enterprise</span>`, `data-testid="rd-plan-enterprise"`.
      - Clicking a different radio in the group unchecks its siblings; only the checked radio's `name=value` surfaces in the JSON output.
    - `<button type="submit" data-testid="form-submit">Save</button>` (a native HTML button, deliberately — the form-control under test is the text-field, and keeping submit native lets Playwright rely on browser-level constraint validation without indirection).
    - `<pre data-testid="form-output"></pre>` — empty initially; populated on successful submit.

## Behavior

- Clicking the theme toggle flips `document.documentElement.dataset.theme` between `"light"` (default) and `"dark"`. Buttons' computed backgrounds change via the `@foundry/themes` `[data-theme]` scopes.
- Clicking any enabled `<foundry-button>` increments the click counter by 1.
- Clicking a disabled `<foundry-button>` does not increment the counter (native `<button>` suppresses the event).
- All three icons must render an `<svg>` element inside their shadow root once the page is ready.
- Clicking `form-submit` with empty required fields does NOT update `form-output` — HTML constraint validation blocks submission.
- Submitting the form without selecting a timezone fails constraint validation (required + empty). Setting `timezone` to one of the option values and submitting causes `timezone=<value>` to appear in the JSON output.
- Filling the required fields with valid values and clicking `form-submit` renders the `FormData` serialised as JSON into `form-output`.

## Why the scenario is minimal

The canary validates **consumption** — not component breadth. The smallest surface that exercises attributes, events, shadow DOM composition, theme CSS cascade, and the icon registry is enough to expose framework-specific bugs. More surface is added only when a new component needs coverage that isn't already here.
