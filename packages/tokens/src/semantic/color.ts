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
