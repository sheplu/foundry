export type Tier = 'primitive' | 'semantic';
export type TokenCategory = 'color' | 'space' | 'radius';

export interface TokenEntry {
  name: string;
  value: string;
  tier: Tier;
  category: TokenCategory;
  path: string[];
}

export function tokenName(_tier: Tier, category: TokenCategory, path: readonly string[]): string {
  return ['--foundry', category, ...path].join('-');
}
