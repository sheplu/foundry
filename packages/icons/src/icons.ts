import checkSvg from './svg/check.svg?raw';
import chevronDownSvg from './svg/chevron-down.svg?raw';
import chevronLeftSvg from './svg/chevron-left.svg?raw';
import chevronRightSvg from './svg/chevron-right.svg?raw';
import chevronUpSvg from './svg/chevron-up.svg?raw';
import closeSvg from './svg/close.svg?raw';
import menuSvg from './svg/menu.svg?raw';
import moreHorizontalSvg from './svg/more-horizontal.svg?raw';

declare const iconSvgBrand: unique symbol;

/**
 * Branded SVG string vetted for inline rendering inside `<foundry-icon>`.
 * Only `loadIcon()` can produce values of this type, so `FoundryIcon.register()`
 * refuses raw strings at compile time.
 */
export type IconSvg = string & { readonly [iconSvgBrand]: true };

/**
 * Wraps a raw SVG string as an `IconSvg`. Rejects payloads containing
 * `<script>` tags, `on*=` event-handler attributes, or `javascript:` URIs —
 * the three shapes that would turn inline SVG into an XSS vector.
 *
 * Throws when any disallowed pattern is detected.
 */
export function loadIcon(svg: string): IconSvg {
  if (/<script[\s>/]/i.test(svg)) {
    throw new Error('loadIcon: SVG must not contain <script> tags');
  }
  if (/\son[a-z]+\s*=/i.test(svg)) {
    throw new Error('loadIcon: SVG must not contain event-handler attributes (on*=)');
  }
  if (/\b(href|xlink:href)\s*=\s*["']?\s*javascript:/i.test(svg)) {
    throw new Error('loadIcon: SVG must not contain javascript: URIs');
  }
  return svg as IconSvg;
}

export const check = loadIcon(checkSvg);
export const chevronDown = loadIcon(chevronDownSvg);
export const chevronLeft = loadIcon(chevronLeftSvg);
export const chevronRight = loadIcon(chevronRightSvg);
export const chevronUp = loadIcon(chevronUpSvg);
export const close = loadIcon(closeSvg);
export const menu = loadIcon(menuSvg);
export const moreHorizontal = loadIcon(moreHorizontalSvg);

export type IconName
  = | 'check'
    | 'chevron-down'
    | 'chevron-left'
    | 'chevron-right'
    | 'chevron-up'
    | 'close'
    | 'menu'
    | 'more-horizontal';
