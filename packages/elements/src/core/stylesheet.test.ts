import { describe, expect, it } from 'vitest';
import { createStylesheet } from './stylesheet.ts';

describe('createStylesheet', () => {
  it('returns a CSSStyleSheet instance', () => {
    const sheet = createStylesheet(':host { color: red; }');
    expect(sheet).toBeInstanceOf(CSSStyleSheet);
  });

  it('populates the sheet with the provided rules', () => {
    const sheet = createStylesheet(':host { color: red; } button { padding: 4px; }');
    expect(sheet.cssRules).toHaveLength(2);
  });

  it('produces an empty sheet when given an empty string', () => {
    const sheet = createStylesheet('');
    expect(sheet.cssRules).toHaveLength(0);
  });

  it('returns independent instances on each call', () => {
    const a = createStylesheet(':host { color: red; }');
    const b = createStylesheet(':host { color: blue; }');
    expect(a).not.toBe(b);
  });
});
