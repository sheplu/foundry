import { afterEach, describe, expect, it } from 'vitest';
import { deriveInitials, FoundryAvatar } from './avatar.ts';

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-avatar-test-${++counter}`;
  class Sub extends FoundryAvatar {}
  customElements.define(tag, Sub);
  return { tag };
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function getImg(el: HTMLElement): HTMLImageElement {
  const img = el.shadowRoot?.querySelector('img');
  if (!(img instanceof HTMLImageElement)) throw new Error('inner img missing');
  return img;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('deriveInitials helper', () => {
  it('empty string returns empty', () => {
    expect(deriveInitials('')).toBe('');
  });

  it('single word returns its first letter', () => {
    expect(deriveInitials('Ada')).toBe('A');
  });

  it('multi-word returns first + last initials', () => {
    expect(deriveInitials('Ada Lovelace')).toBe('AL');
  });

  it('three-plus words ignores middle names', () => {
    expect(deriveInitials('Mary Ada Lovelace')).toBe('ML');
  });

  it('uppercases the result', () => {
    expect(deriveInitials('grace hopper')).toBe('GH');
  });

  it('collapses runs of whitespace', () => {
    expect(deriveInitials('   ada    lovelace  ')).toBe('AL');
  });
});

describe('FoundryAvatar.define', () => {
  it('registers the given tag', () => {
    const tag = `foundry-avatar-define-${++counter}`;
    FoundryAvatar.define(tag);
    expect(customElements.get(tag)).toBe(FoundryAvatar);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-avatar-noop-${++counter}`;
    class Existing extends FoundryAvatar {}
    customElements.define(tag, Existing);

    expect(() => FoundryAvatar.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryAvatar defaults', () => {
  it('defaults size to "md" and shape to "circle"', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar;
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('md');
    expect(el.getAttribute('shape')).toBe('circle');
  });

  it('respects a pre-set size and shape', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('size', 'lg');
    el.setAttribute('shape', 'square');
    document.body.appendChild(el);
    expect(el.getAttribute('size')).toBe('lg');
    expect(el.getAttribute('shape')).toBe('square');
  });
});

describe('FoundryAvatar initials', () => {
  it('renders initials derived from name when no slot content', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('name', 'Ada Lovelace');
    document.body.appendChild(el);
    await raf();

    const initials = el.shadowRoot?.querySelector('[part="initials"]') as HTMLElement;
    expect(initials.textContent?.trim()).toBe('AL');
  });

  it('re-derives initials when name changes', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar & { name: string };
    el.setAttribute('name', 'Ada Lovelace');
    document.body.appendChild(el);
    await raf();

    el.name = 'Grace Hopper';
    await raf();
    const initials = el.shadowRoot?.querySelector('[part="initials"]') as HTMLElement;
    expect(initials.textContent?.trim()).toBe('GH');
  });

  it('respects explicit slotted initials over the derived name', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('name', 'Ada Lovelace');
    el.textContent = '愛';
    document.body.appendChild(el);
    await raf();

    // Slot has assigned content; no derive should happen.
    const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
    const assigned = slot.assignedNodes({ flatten: true });
    expect((assigned[0]?.textContent ?? '').trim()).toBe('愛');
  });
});

describe('FoundryAvatar image loading', () => {
  it('sets has-image=false when src is empty', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('has-image')).toBe(false);
  });

  it('forwards src onto the inner <img>', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('src', 'https://example.com/ada.jpg');
    document.body.appendChild(el);
    expect(getImg(el).getAttribute('src')).toBe('https://example.com/ada.jpg');
  });

  it('sets has-image=true when the inner img fires load', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('src', 'https://example.com/ok.jpg');
    document.body.appendChild(el);

    // Manually fire load — jsdom doesn't actually fetch.
    getImg(el).onload?.(new Event('load'));
    expect(el.hasAttribute('has-image')).toBe(true);
  });

  it('keeps has-image=false when the inner img fires error', async () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('src', 'https://example.com/bad.jpg');
    document.body.appendChild(el);

    getImg(el).onload?.(new Event('load'));
    expect(el.hasAttribute('has-image')).toBe(true);

    // Now simulate src change → error.
    el.setAttribute('src', 'https://example.com/also-bad.jpg');
    getImg(el).onerror?.(new Event('error'));
    expect(el.hasAttribute('has-image')).toBe(false);
  });

  it('clears the inner src when src is removed', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar & { src: string };
    el.setAttribute('src', 'https://example.com/ada.jpg');
    document.body.appendChild(el);
    expect(getImg(el).getAttribute('src')).toBe('https://example.com/ada.jpg');

    el.src = '';
    expect(getImg(el).hasAttribute('src')).toBe(false);
    expect(el.hasAttribute('has-image')).toBe(false);
  });
});

describe('FoundryAvatar accessible name', () => {
  it('uses name as aria-label when no explicit label is set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('name', 'Ada Lovelace');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Ada Lovelace');
    expect(el.getAttribute('role')).toBe('img');
  });

  it('explicit label overrides name for aria-label', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('name', 'Ada Lovelace');
    el.setAttribute('label', 'Profile photo of Ada');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Profile photo of Ada');
  });

  it('marks the avatar decorative when neither name nor label is set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('updates aria-label when name changes', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar & { name: string };
    el.setAttribute('name', 'Ada');
    document.body.appendChild(el);
    expect(el.getAttribute('aria-label')).toBe('Ada');

    el.name = 'Grace';
    expect(el.getAttribute('aria-label')).toBe('Grace');
  });

  it('removes role/aria-label when name and label are cleared', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar & { name: string; label: string };
    el.setAttribute('name', 'Ada');
    document.body.appendChild(el);
    expect(el.getAttribute('role')).toBe('img');

    el.name = '';
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('FoundryAvatar status', () => {
  it('reflects status as a host attribute', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar & { status: string };
    el.setAttribute('status', 'online');
    document.body.appendChild(el);
    expect(el.getAttribute('status')).toBe('online');
    const dot = el.shadowRoot?.querySelector('[part="status"]');
    expect(dot).toBeTruthy();
  });

  it('reflects size changes via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar & { size: string };
    document.body.appendChild(el);

    el.size = 'lg';
    expect(el.getAttribute('size')).toBe('lg');
  });

  it('reflects shape changes via property', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag) as FoundryAvatar & { shape: string };
    document.body.appendChild(el);

    el.shape = 'square';
    expect(el.getAttribute('shape')).toBe('square');
  });
});

describe('FoundryAvatar propertyChanged filter', () => {
  it('ignores property names outside the known set', () => {
    const { tag } = uniqueSubclass();
    const el = document.createElement(tag);
    el.setAttribute('name', 'Ada');
    document.body.appendChild(el);
    const before = el.getAttribute('aria-label');

    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);

    expect(el.getAttribute('aria-label')).toBe(before);
  });
});
