export type Tier = 'primitive' | 'semantic' | 'component';
export type TokenCategory = 'color' | 'space' | 'radius';

/**
 * `category` is:
 * - one of `TokenCategory` for primitive/semantic tiers (the value's semantic axis),
 * - the component tag name (e.g. `'foundry-button'`) for the component tier.
 * Keeping it as a single string field lets `tokens.json` stay flat and tools
 * consuming it don't need to branch on tier to find provenance.
 */
export interface TokenEntry {
  name: string;
  value: string;
  tier: Tier;
  category: string;
  path: string[];
}

export function tokenName(category: TokenCategory, path: readonly string[]): string {
  return ['--foundry', category, ...path].join('-');
}

export function componentTokenName(component: string, path: readonly string[]): string {
  // Strip a `foundry-` prefix so it's not doubled in the resulting CSS variable name.
  const stem = component.startsWith('foundry-') ? component.slice('foundry-'.length) : component;
  return ['--foundry', stem, ...path].join('-');
}
