import * as primitiveColor from './primitive/color.ts';
import { space as primitiveSpace } from './primitive/space.ts';
import { radius as primitiveRadius } from './primitive/radius.ts';
import * as semanticColor from './semantic/color.ts';
import * as semanticSpace from './semantic/space.ts';
import { radius as semanticRadius } from './semantic/radius.ts';
import { foundryButton } from './component/foundry-button.ts';
import { foundryIcon } from './component/foundry-icon.ts';
import { foundryIconButton } from './component/foundry-icon-button.ts';
import { flatten, flattenComponent, type TokenTree } from './flatten.ts';
import type { TokenEntry } from './types.ts';

export const primitives: TokenEntry[] = [
  ...flatten('primitive', 'color', primitiveColor as unknown as TokenTree),
  ...flatten('primitive', 'space', primitiveSpace as unknown as TokenTree),
  ...flatten('primitive', 'radius', primitiveRadius as unknown as TokenTree),
];

export const semantics: TokenEntry[] = [
  ...flatten('semantic', 'color', semanticColor as unknown as TokenTree),
  ...flatten('semantic', 'space', semanticSpace as unknown as TokenTree),
  ...flatten('semantic', 'radius', semanticRadius as unknown as TokenTree),
];

export const components: TokenEntry[] = [
  ...flattenComponent('foundry-button', foundryButton as unknown as TokenTree),
  ...flattenComponent('foundry-icon', foundryIcon as unknown as TokenTree),
  ...flattenComponent('foundry-icon-button', foundryIconButton as unknown as TokenTree),
];

export const allTokens: TokenEntry[] = [...primitives, ...semantics, ...components];
