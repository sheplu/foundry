export const foundryButton = {
  background: {
    _: 'var(--foundry-color-action-primary)',
    hover: 'var(--foundry-color-action-primary-hover)',
    active: 'var(--foundry-color-action-primary-active)',
    disabled: 'var(--foundry-color-action-primary-disabled)',
  },
  'background-secondary': {
    _: 'var(--foundry-color-surface-subtle)',
    hover: 'var(--foundry-color-surface)',
    active: 'var(--foundry-color-surface-subtle)',
  },
  'background-danger': {
    _: 'var(--foundry-color-action-danger)',
    hover: 'var(--foundry-color-action-danger-hover)',
    active: 'var(--foundry-color-action-danger-hover)',
  },
  foreground: {
    _: 'var(--foundry-color-text-inverse)',
    secondary: 'var(--foundry-color-text-body)',
  },
  'padding-block': {
    _: 'var(--foundry-space-inset-sm)',
  },
  'padding-inline': {
    _: 'var(--foundry-space-inset-md)',
  },
  radius: {
    _: 'var(--foundry-radius-md)',
  },
  'focus-outline': {
    _: 'var(--foundry-color-action-primary)',
  },
} as const;
