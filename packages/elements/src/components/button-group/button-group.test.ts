import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryButtonGroup } from './button-group.ts';

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

beforeAll(() => {
  FoundryButtonGroup.define();
});

let counter = 0;

function uniqueSubclass(): { tag: string } {
  const tag = `foundry-button-group-test-${++counter}`;
  class Sub extends FoundryButtonGroup {}
  customElements.define(tag, Sub);
  return { tag };
}

async function makeGroup(opts: {
  mode?: 'single' | 'multiple';
  value?: string;
  orientation?: 'horizontal' | 'vertical';
  disabled?: boolean;
  children?: { value: string; disabled?: boolean; label?: string }[];
} = {}): Promise<FoundryButtonGroup> {
  const { tag } = uniqueSubclass();
  const el = document.createElement(tag) as FoundryButtonGroup;
  if (opts.mode) el.setAttribute('mode', opts.mode);
  if (opts.value !== undefined) el.setAttribute('value', opts.value);
  if (opts.orientation) el.setAttribute('orientation', opts.orientation);
  if (opts.disabled) el.setAttribute('disabled', '');
  const kids = opts.children ?? [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ];
  for (const k of kids) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('value', k.value);
    btn.textContent = k.label ?? k.value;
    if (k.disabled) btn.setAttribute('disabled', '');
    el.appendChild(btn);
  }
  document.body.appendChild(el);
  await raf();
  return el;
}

function buttons(el: FoundryButtonGroup): HTMLButtonElement[] {
  return Array.from(el.querySelectorAll('button'));
}

function byValue(el: FoundryButtonGroup, v: string): HTMLButtonElement {
  const b = el.querySelector<HTMLButtonElement>(`button[value="${v}"]`);
  if (!b) throw new Error(`no button with value=${v}`);
  return b;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryButtonGroup.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-button-group')).toBe(FoundryButtonGroup);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-button-group-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryButtonGroup.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryButtonGroup defaults', () => {
  it('defaults orientation=horizontal, disabled=false, label="Button group"', async () => {
    const el = await makeGroup();
    expect(el.getAttribute('orientation')).toBe('horizontal');
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.getAttribute('aria-label')).toBe('Button group');
  });

  it('has no mode by default', async () => {
    const el = await makeGroup();
    expect(el.hasAttribute('mode')).toBe(false);
  });
});

describe('FoundryButtonGroup role mapping', () => {
  it('presentation mode → role="group", no aria-multiselectable', async () => {
    const el = await makeGroup();
    expect(el.getAttribute('role')).toBe('group');
    expect(el.hasAttribute('aria-multiselectable')).toBe(false);
  });

  it('mode="single" → role="radiogroup"', async () => {
    const el = await makeGroup({ mode: 'single' });
    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.hasAttribute('aria-multiselectable')).toBe(false);
  });

  it('mode="multiple" → role="group" (aria-pressed on children conveys selection)', async () => {
    const el = await makeGroup({ mode: 'multiple' });
    expect(el.getAttribute('role')).toBe('group');
    expect(el.hasAttribute('aria-multiselectable')).toBe(false);
  });

  it('role updates when mode changes dynamically', async () => {
    const el = await makeGroup();
    expect(el.getAttribute('role')).toBe('group');
    (el as unknown as { mode: string }).mode = 'single';
    expect(el.getAttribute('role')).toBe('radiogroup');
  });

  it('aria-orientation reflects the orientation attr in single mode', async () => {
    const el = await makeGroup({ mode: 'single', orientation: 'vertical' });
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('aria-orientation is not set in presentation / multiple mode (role=group)', async () => {
    const pres = await makeGroup({ orientation: 'vertical' });
    expect(pres.hasAttribute('aria-orientation')).toBe(false);
    const multi = await makeGroup({ mode: 'multiple', orientation: 'vertical' });
    expect(multi.hasAttribute('aria-orientation')).toBe(false);
  });
});

describe('FoundryButtonGroup — presentation mode', () => {
  it('does not set aria-pressed on children when mode is unset', async () => {
    const el = await makeGroup();
    for (const b of buttons(el)) {
      expect(b.hasAttribute('pressed')).toBe(false);
    }
  });

  it('click does not fire change when mode is unset', async () => {
    const el = await makeGroup();
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    byValue(el, 'a').click();
    expect(fired).toBe(0);
  });
});

describe('FoundryButtonGroup — single-select', () => {
  it('initial value="grid" projects aria-pressed="true" onto the matching child', async () => {
    const el = await makeGroup({
      mode: 'single',
      value: 'grid',
      children: [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid' },
        { value: 'kanban', label: 'Kanban' },
      ],
    });
    expect(byValue(el, 'list').getAttribute('pressed')).toBe('false');
    expect(byValue(el, 'grid').getAttribute('pressed')).toBe('true');
    expect(byValue(el, 'kanban').getAttribute('pressed')).toBe('false');
  });

  it('clicking a different child swaps pressed + fires change', async () => {
    const el = await makeGroup({ mode: 'single', value: 'a' });
    let detail: { value: string } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    byValue(el, 'b').click();
    expect(detail?.value).toBe('b');
    expect(byValue(el, 'a').getAttribute('pressed')).toBe('false');
    expect(byValue(el, 'b').getAttribute('pressed')).toBe('true');
    expect(el.getAttribute('value')).toBe('b');
  });

  it('clicking the currently-pressed child is a no-op (no change event)', async () => {
    const el = await makeGroup({ mode: 'single', value: 'a' });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    byValue(el, 'a').click();
    expect(fired).toBe(0);
    expect(el.getAttribute('value')).toBe('a');
  });

  it('clicking a button without a value is ignored', async () => {
    const el = await makeGroup({ mode: 'single' });
    const orphan = document.createElement('button');
    orphan.type = 'button';
    orphan.textContent = 'no-value';
    el.appendChild(orphan);
    await raf();
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    orphan.click();
    expect(fired).toBe(0);
  });

  it('clicking a disabled child does not fire change', async () => {
    const el = await makeGroup({
      mode: 'single',
      children: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ],
    });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    byValue(el, 'b').click();
    expect(fired).toBe(0);
  });
});

describe('FoundryButtonGroup — multi-select', () => {
  it('initial comma-separated value projects pressed onto matching children', async () => {
    const el = await makeGroup({ mode: 'multiple', value: 'a,c' });
    expect(byValue(el, 'a').getAttribute('pressed')).toBe('true');
    expect(byValue(el, 'b').getAttribute('pressed')).toBe('false');
    expect(byValue(el, 'c').getAttribute('pressed')).toBe('true');
  });

  it('clicking a child toggles it in and out of the selection', async () => {
    const el = await makeGroup({ mode: 'multiple' });
    const received: string[][] = [];
    el.addEventListener('change', (e) => {
      received.push((e as CustomEvent<{ value: string[] }>).detail.value);
    });
    byValue(el, 'a').click();
    expect(received[received.length - 1]).toEqual(['a']);
    byValue(el, 'c').click();
    expect(received[received.length - 1]).toEqual(['a', 'c']);
    byValue(el, 'a').click();
    expect(received[received.length - 1]).toEqual(['c']);
    expect(el.getAttribute('value')).toBe('c');
  });

  it('clearing all selections leaves value empty + detail.value is an empty array', async () => {
    const el = await makeGroup({ mode: 'multiple', value: 'a' });
    let detail: { value: string[] } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string[] }>).detail;
    });
    byValue(el, 'a').click();
    expect(detail?.value).toEqual([]);
    expect(el.getAttribute('value')).toBe('');
  });
});

describe('FoundryButtonGroup — value clamping', () => {
  it('drops initial values that do not match any child', async () => {
    const el = await makeGroup({ mode: 'single', value: 'ghost' });
    expect(el.getAttribute('value')).toBe('');
    for (const b of buttons(el)) {
      expect(b.getAttribute('pressed')).toBe('false');
    }
  });
});

describe('FoundryButtonGroup — keyboard', () => {
  it('ArrowRight moves focus to the next enabled child', async () => {
    const el = await makeGroup({ mode: 'single' });
    const bs = buttons(el);
    bs[0]?.focus();
    bs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(bs[1]);
  });

  it('ArrowLeft from the first button wraps to the last', async () => {
    const el = await makeGroup({ mode: 'single' });
    const bs = buttons(el);
    bs[0]?.focus();
    bs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(bs[bs.length - 1]);
  });

  it('ArrowDown moves focus when orientation="vertical"', async () => {
    const el = await makeGroup({ mode: 'single', orientation: 'vertical' });
    const bs = buttons(el);
    bs[0]?.focus();
    bs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(bs[1]);
  });

  it('Home jumps to the first enabled child', async () => {
    const el = await makeGroup({ mode: 'single' });
    const bs = buttons(el);
    bs[2]?.focus();
    bs[2]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Home', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(bs[0]);
  });

  it('End jumps to the last enabled child', async () => {
    const el = await makeGroup({ mode: 'single' });
    const bs = buttons(el);
    bs[0]?.focus();
    bs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(bs[bs.length - 1]);
  });

  it('non-arrow keys are no-ops', async () => {
    const el = await makeGroup({ mode: 'single' });
    const bs = buttons(el);
    bs[0]?.focus();
    bs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).toBe(bs[0]);
  });

  it('keydown from a non-child target is ignored', async () => {
    const el = await makeGroup({ mode: 'single' });
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    expect(() => el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    )).not.toThrow();
  });
});

describe('FoundryButtonGroup — slot change', () => {
  it('removing the currently pressed child clears the selection', async () => {
    const el = await makeGroup({ mode: 'single', value: 'a' });
    byValue(el, 'a').remove();
    await raf();
    expect(el.getAttribute('value')).toBe('');
  });

  it('adding a child after mount leaves it unpressed when value was already clamped', async () => {
    const el = await makeGroup({ mode: 'multiple', value: 'a,d' });
    expect(el.getAttribute('value')).toBe('a');
    const extra = document.createElement('button');
    extra.type = 'button';
    extra.setAttribute('value', 'd');
    extra.textContent = 'D';
    el.appendChild(extra);
    await raf();
    expect(byValue(el, 'd').getAttribute('pressed')).toBe('false');
  });
});

describe('FoundryButtonGroup — host disabled', () => {
  it('clicking a child fires no change event when host is disabled', async () => {
    const el = await makeGroup({ mode: 'single', disabled: true });
    let fired = 0;
    el.addEventListener('change', () => {
      fired += 1;
    });
    byValue(el, 'a').click();
    expect(fired).toBe(0);
  });
});

describe('FoundryButtonGroup — propertyChanged filter', () => {
  it('ignores unknown property names', async () => {
    const el = await makeGroup();
    expect(() =>
      (el as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});

describe('FoundryButtonGroup — re-rendering on attribute changes', () => {
  it('switching mode re-projects aria-pressed', async () => {
    const el = await makeGroup({ value: 'a' });
    expect(byValue(el, 'a').hasAttribute('pressed')).toBe(false);
    (el as unknown as { mode: string }).mode = 'single';
    expect(byValue(el, 'a').getAttribute('pressed')).toBe('true');
    el.removeAttribute('mode');
    expect(byValue(el, 'a').hasAttribute('pressed')).toBe(false);
  });

  it('changing value via property updates pressed state', async () => {
    const el = await makeGroup({ mode: 'single', value: 'a' });
    expect(byValue(el, 'a').getAttribute('pressed')).toBe('true');
    (el as unknown as { value: string }).value = 'b';
    expect(byValue(el, 'a').getAttribute('pressed')).toBe('false');
    expect(byValue(el, 'b').getAttribute('pressed')).toBe('true');
  });

  it('changing label updates aria-label', async () => {
    const el = await makeGroup();
    el.setAttribute('label', 'View mode');
    expect(el.getAttribute('aria-label')).toBe('View mode');
  });

  it('empty label falls back to default', async () => {
    const el = await makeGroup();
    (el as unknown as { label: string }).label = '';
    expect(el.getAttribute('aria-label')).toBe('Button group');
  });
});
