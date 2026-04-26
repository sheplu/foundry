export const foundryIconButton = {
  background: {
    _: 'transparent',
    hover: 'var(--foundry-color-surface-subtle)',
    active: 'var(--foundry-color-border)',
    disabled: 'var(--foundry-color-action-primary-disabled)',
  },
  'background-primary': {
    _: 'var(--foundry-color-action-primary)',
    hover: 'var(--foundry-color-action-primary-hover)',
    active: 'var(--foundry-color-action-primary-active)',
  },
  'background-danger': {
    _: 'var(--foundry-color-action-danger)',
    hover: 'var(--foundry-color-action-danger-hover)',
    active: 'var(--foundry-color-action-danger-hover)',
  },
  foreground: {
    _: 'var(--foundry-color-text-body)',
    primary: 'var(--foundry-color-text-inverse)',
    danger: 'var(--foundry-color-text-inverse)',
    disabled: 'var(--foundry-color-text-muted)',
  },
  padding: {
    _: 'var(--foundry-space-inset-sm)',
  },
  radius: {
    _: 'var(--foundry-radius-md)',
  },
  'focus-outline': {
    _: 'var(--foundry-color-action-primary)',
  },
  'icon-size': {
    _: '1.25rem',
  },
} as const;
