# Manual accessibility checklist

Automated checks run in CI (Vitest unit + `@web/test-runner` + axe-core functional). This file captures the **manual** verifications AGENTS.md §7 requires per component. Update the relevant section in the same PR that adds or modifies a component.

## How to run a manual pass

1. Open Storybook (`npm run storybook`) and navigate to the component.
2. For each checklist item, use the real assistive tech / browser setting and observe behavior.
3. Record anything unexpected as a PR comment or follow-up issue.

---

## `<foundry-button>`

| Check | Expected |
|---|---|
| Screen reader — VoiceOver (macOS) | Announces "Button, <label>" when focused; "dimmed" when `disabled`. |
| Screen reader — NVDA (Windows) | Announces "<label>, button" when focused; "unavailable" when `disabled`. |
| Reduced motion (`prefers-reduced-motion: reduce`) | Hover / active transitions do not introduce motion; state changes remain visible. |
| Forced colors / high-contrast (Windows HC mode) | Button outline, label, and focus ring remain visible; background adapts to system color keywords. |
| Zoom 200% | Button text does not clip; focus ring stays visible; hit target does not overflow. |
| Keyboard — Tab | Moves focus to the button in DOM order. |
| Keyboard — Enter / Space | Activates the button (fires `click`). |
| Keyboard — Shift+Tab | Moves focus away in reverse DOM order. |
