import type { Tier, TokenCategory, TokenEntry } from './types.ts';
import { componentTokenName, tokenName } from './types.ts';

export interface TokenTree {
  [key: string]: string | TokenTree;
}

export function flatten(
  tier: Tier,
  category: TokenCategory,
  tree: TokenTree,
  path: readonly string[] = [],
): TokenEntry[] {
  const out: TokenEntry[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const nextPath = key === '_' ? path : [...path, key];
    if (typeof value === 'string') {
      out.push({
        name: tokenName(category, nextPath),
        value,
        tier,
        category,
        path: [...nextPath],
      });
    } else {
      out.push(...flatten(tier, category, value, nextPath));
    }
  }
  return out;
}

export function flattenComponent(
  component: string,
  tree: TokenTree,
  path: readonly string[] = [],
): TokenEntry[] {
  const out: TokenEntry[] = [];
  for (const [key, value] of Object.entries(tree)) {
    const nextPath = key === '_' ? path : [...path, key];
    if (typeof value === 'string') {
      out.push({
        name: componentTokenName(component, nextPath),
        value,
        tier: 'component',
        category: component,
        path: [...nextPath],
      });
    } else {
      out.push(...flattenComponent(component, value, nextPath));
    }
  }
  return out;
}
