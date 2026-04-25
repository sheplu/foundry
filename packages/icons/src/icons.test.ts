import { describe, expect, it } from 'vitest';
import { loadIcon, type IconSvg } from './icons.ts';

describe('loadIcon', () => {
  it('accepts a clean inline SVG string', () => {
    expect(() => loadIcon('<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" /></svg>'))
      .not.toThrow();
  });

  it('rejects payloads containing <script> tags', () => {
    expect(() => loadIcon('<svg><script>alert(1)</script></svg>'))
      .toThrow(/<script>/);
    expect(() => loadIcon('<svg><SCRIPT src="x"></SCRIPT></svg>'))
      .toThrow(/<script>/);
  });

  it('rejects event-handler attributes', () => {
    expect(() => loadIcon('<svg onclick="bad()"><path /></svg>'))
      .toThrow(/event-handler/);
    expect(() => loadIcon('<svg onmouseover = "x"><path /></svg>'))
      .toThrow(/event-handler/);
  });

  it('rejects javascript: URIs in href and xlink:href', () => {
    expect(() => loadIcon('<svg><a href="javascript:alert(1)"><path /></a></svg>'))
      .toThrow(/javascript:/);
    expect(() => loadIcon('<svg><use xlink:href="javascript:void(0)" /></svg>'))
      .toThrow(/javascript:/);
  });

  it('brands the return value so the type flows into FoundryIcon.register', () => {
    // This test is compile-time-only — if `loadIcon` did not brand its return,
    // passing a raw string to `register` would be accepted. The presence of
    // the type-level assertion below is what matters.
    const svg = loadIcon('<svg viewBox="0 0 24 24"></svg>');
    const _test: IconSvg = svg;
    expect(svg).toBeTypeOf('string');
    void _test;
  });
});
