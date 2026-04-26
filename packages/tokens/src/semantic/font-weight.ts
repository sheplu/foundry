/**
 * Semantic font weights. Intent: `body` is the default text weight; `heading`
 * is slightly bolder for display surfaces; `emphasis` is the bold accent used
 * inline (`<strong>`-style).
 */
export const body = {
  _: 'var(--foundry-font-weight-400)',
} as const;

export const heading = {
  _: 'var(--foundry-font-weight-500)',
} as const;

export const emphasis = {
  _: 'var(--foundry-font-weight-700)',
} as const;
