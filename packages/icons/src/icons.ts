import checkSvg from './svg/check.svg?raw';
import chevronDownSvg from './svg/chevron-down.svg?raw';
import closeSvg from './svg/close.svg?raw';

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
export const close = loadIcon(closeSvg);

export type IconName = 'check' | 'chevron-down' | 'close';
