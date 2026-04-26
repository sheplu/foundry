/**
 * Primitive font size scale. Numeric steps per AGENTS.md §6.3.
 * 100 = 0.75rem (12px) caption floor; 700 = 2.25rem (36px) display ceiling.
 * rem-based so consumers inherit user zoom + root font-size.
 */
export const fontSize = {
  100: '0.75rem',
  200: '0.875rem',
  300: '1rem',
  400: '1.125rem',
  500: '1.25rem',
  600: '1.5rem',
  700: '2.25rem',
} as const;
