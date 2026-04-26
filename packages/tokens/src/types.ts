export type Tier = 'primitive' | 'semantic';
export type TokenCategory = 'color' | 'space' | 'radius';

export interface TokenEntry {
  name: string;
  value: string;
  tier: Tier;
  category: TokenCategory;
  path: string[];
}

export function tokenName(category: TokenCategory, path: readonly string[]): string {
  return ['--foundry', category, ...path].join('-');
}
