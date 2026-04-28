export const darkColor: Readonly<Record<string, string>> = {
  '--foundry-color-surface': 'var(--foundry-color-gray-900)',
  '--foundry-color-surface-subtle': 'var(--foundry-color-gray-800)',
  '--foundry-color-surface-inverse': 'var(--foundry-color-gray-50)',
  '--foundry-color-text-body': 'var(--foundry-color-gray-50)',
  '--foundry-color-text-muted': 'var(--foundry-color-gray-400)',
  '--foundry-color-text-inverse': 'var(--foundry-color-gray-900)',
  '--foundry-color-border': 'var(--foundry-color-gray-700)',
  '--foundry-color-border-strong': 'var(--foundry-color-gray-500)',
  '--foundry-color-action-primary': 'var(--foundry-color-blue-400)',
  '--foundry-color-action-primary-hover': 'var(--foundry-color-blue-300)',
  '--foundry-color-action-primary-active': 'var(--foundry-color-blue-200)',
  '--foundry-color-action-primary-disabled': 'var(--foundry-color-gray-700)',
  '--foundry-color-action-danger': 'var(--foundry-color-red-400)',
  '--foundry-color-action-danger-hover': 'var(--foundry-color-red-300)',
  // Intent pills on dark surfaces: keep the soft-pill look but invert the rung
  // pairing so the pill stays visible and text stays legible on a darker
  // background. Pill background = 800 rung; foreground = 100 rung.
  '--foundry-color-intent-neutral-background': 'var(--foundry-color-gray-700)',
  '--foundry-color-intent-neutral-foreground': 'var(--foundry-color-gray-100)',
  '--foundry-color-intent-info-background': 'var(--foundry-color-blue-800)',
  '--foundry-color-intent-info-foreground': 'var(--foundry-color-blue-100)',
  '--foundry-color-intent-success-background': 'var(--foundry-color-green-800)',
  '--foundry-color-intent-success-foreground': 'var(--foundry-color-green-100)',
  '--foundry-color-intent-warning-background': 'var(--foundry-color-yellow-800)',
  '--foundry-color-intent-warning-foreground': 'var(--foundry-color-yellow-100)',
  '--foundry-color-intent-danger-background': 'var(--foundry-color-red-800)',
  '--foundry-color-intent-danger-foreground': 'var(--foundry-color-red-100)',
};
