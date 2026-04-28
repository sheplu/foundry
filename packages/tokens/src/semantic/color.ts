export const surface = {
  _: 'var(--foundry-color-gray-50)',
  subtle: 'var(--foundry-color-gray-100)',
  inverse: 'var(--foundry-color-gray-900)',
} as const;

export const text = {
  body: 'var(--foundry-color-gray-900)',
  muted: 'var(--foundry-color-gray-600)',
  inverse: 'var(--foundry-color-gray-50)',
} as const;

export const border = {
  _: 'var(--foundry-color-gray-200)',
  strong: 'var(--foundry-color-gray-400)',
} as const;

export const action = {
  primary: 'var(--foundry-color-blue-600)',
  'primary-hover': 'var(--foundry-color-blue-700)',
  'primary-active': 'var(--foundry-color-blue-800)',
  'primary-disabled': 'var(--foundry-color-gray-300)',
  danger: 'var(--foundry-color-red-600)',
  'danger-hover': 'var(--foundry-color-red-700)',
} as const;

/**
 * Status intent palette for surfaces like badges, alerts, and inline hints.
 * Each family pairs a soft `background` with a dark `foreground` rung —
 * designed to clear WCAG AA contrast at body-text size in both themes.
 *
 * Deliberately separate from `action.danger`: action-danger is a solid-red
 * CTA button color; `intent.danger` is the soft-pill status-surface color.
 * They may share a primitive rung today but evolve independently.
 */
export const intent = {
  neutral: {
    background: 'var(--foundry-color-gray-200)',
    foreground: 'var(--foundry-color-gray-700)',
  },
  info: {
    background: 'var(--foundry-color-blue-100)',
    foreground: 'var(--foundry-color-blue-800)',
  },
  success: {
    background: 'var(--foundry-color-green-100)',
    foreground: 'var(--foundry-color-green-800)',
  },
  warning: {
    background: 'var(--foundry-color-yellow-100)',
    foreground: 'var(--foundry-color-yellow-800)',
  },
  danger: {
    background: 'var(--foundry-color-red-100)',
    foreground: 'var(--foundry-color-red-800)',
  },
} as const;
