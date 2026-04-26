/**
 * Semantic font sizes. Intent over measurement: consumers pick `body` or
 * `heading-lg`, not `300` / `600`. Values reference primitive font-size steps.
 */
export const body = {
  _: 'var(--foundry-font-size-300)',
  sm: 'var(--foundry-font-size-200)',
} as const;

export const heading = {
  sm: 'var(--foundry-font-size-400)',
  md: 'var(--foundry-font-size-500)',
  lg: 'var(--foundry-font-size-600)',
  xl: 'var(--foundry-font-size-700)',
} as const;

export const caption = {
  _: 'var(--foundry-font-size-100)',
} as const;
