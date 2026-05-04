import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryTabs } from './tabs.ts';
import { FoundryTab } from '../tab/tab.ts';
import { FoundryPanel } from '../panel/panel.ts';

beforeAll(() => {
  FoundryTabs.define();
});

let counter = 0;

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

interface TabSpec {
  value?: string;
  label: string;
  disabled?: boolean;
  selected?: boolean;
}

function makeTabs(
  tabs: TabSpec[] = [],
  opts: { orientation?: 'horizontal' | 'vertical'; value?: string } = {},
): FoundryTabs {
  const el = document.createElement('foundry-tabs') as FoundryTabs;
  if (opts.orientation) el.setAttribute('orientation', opts.orientation);
  if (opts.value !== undefined) el.setAttribute('value', opts.value);
  for (const spec of tabs) {
    const tab = document.createElement('foundry-tab');
    tab.setAttribute('slot', 'tab');
    if (spec.value !== undefined) tab.setAttribute('value', spec.value);
    if (spec.disabled) tab.setAttribute('disabled', '');
    if (spec.selected) tab.setAttribute('selected', '');
    tab.textContent = spec.label;
    el.appendChild(tab);
  }
  for (const spec of tabs) {
    const panel = document.createElement('foundry-panel');
    panel.textContent = `${spec.label} content`;
    el.appendChild(panel);
  }
  return el;
}

function keydown(
  target: HTMLElement,
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    composed: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryTabs.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-tabs')).toBe(FoundryTabs);
  });

  it('also defines foundry-tab + foundry-panel as a side-effect', () => {
    FoundryTabs.define();
    expect(customElements.get('foundry-tab')).toBe(FoundryTab);
    expect(customElements.get('foundry-panel')).toBe(FoundryPanel);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-tabs-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryTabs.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryTabs defaults + initial resolution', () => {
  it('reflects orientation=horizontal by default', () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }]);
    document.body.appendChild(el);
    expect(el.getAttribute('orientation')).toBe('horizontal');
    const tablist = el.shadowRoot?.querySelector('[part="tablist"]');
    expect(tablist?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('activates the first enabled tab when no value/selected is set', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[0]?.hasAttribute('selected')).toBe(true);
    expect(el.panels[0]?.hasAttribute('selected')).toBe(true);
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(false);
  });

  it('skips disabled tabs when picking the initial active tab', async () => {
    const el = makeTabs([
      { label: 'A', disabled: true },
      { label: 'B' },
      { label: 'C' },
    ]);
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(true);
  });

  it('uses the value attribute when it matches a tab', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ], { value: 'b' });
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(true);
    expect((el as unknown as { value: string }).value).toBe('b');
  });

  it('uses the selected attribute on a tab when no value is set', async () => {
    const el = makeTabs([
      { label: 'A' },
      { label: 'B', selected: true },
      { label: 'C' },
    ]);
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(true);
    expect((el as unknown as { value: string }).value).toBe('B');
  });
});

describe('FoundryTabs value sync', () => {
  it('writing value switches active tab + panel', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    (el as unknown as { value: string }).value = 'b';
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(true);
    expect(el.panels[1]?.hasAttribute('selected')).toBe(true);
    expect(el.tabs[0]?.hasAttribute('selected')).toBe(false);
    expect(el.panels[0]?.hasAttribute('selected')).toBe(false);
  });

  it('writing a non-matching value falls back to the first enabled tab', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    (el as unknown as { value: string }).value = 'nope';
    // No match → falls back to first enabled. `value` reflects that.
    expect((el as unknown as { value: string }).value).toBe('a');
    expect(el.tabs[0]?.hasAttribute('selected')).toBe(true);
  });

  it('reading value returns the active tab value', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    expect((el as unknown as { value: string }).value).toBe('a');
  });

  it('falls back to textContent when tab has no value attribute', async () => {
    const el = makeTabs([{ label: 'Overview' }, { label: 'Details' }]);
    document.body.appendChild(el);
    await raf();
    expect((el as unknown as { value: string }).value).toBe('Overview');
  });
});

describe('FoundryTabs ARIA + ID wiring', () => {
  it('tablist has role="tablist" and aria-orientation', () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }]);
    document.body.appendChild(el);
    const tablist = el.shadowRoot?.querySelector('[part="tablist"]');
    expect(tablist?.getAttribute('role')).toBe('tablist');
    expect(tablist?.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('tabs get role="tab" + aria-selected from the child class', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[0]?.getAttribute('role')).toBe('tab');
    expect(el.tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(el.tabs[1]?.getAttribute('aria-selected')).toBe('false');
  });

  it('panels get role="tabpanel" from the child class', async () => {
    const el = makeTabs([{ label: 'A' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.panels[0]?.getAttribute('role')).toBe('tabpanel');
  });

  it('tab aria-controls points at the paired panel id', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[0]?.getAttribute('aria-controls')).toBe(el.panels[0]?.id);
    expect(el.tabs[1]?.getAttribute('aria-controls')).toBe(el.panels[1]?.id);
  });

  it('panel aria-labelledby points at the paired tab id', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.panels[0]?.getAttribute('aria-labelledby')).toBe(el.tabs[0]?.id);
    expect(el.panels[1]?.getAttribute('aria-labelledby')).toBe(el.tabs[1]?.id);
  });

  it('auto-generated tab + panel IDs are unique per instance', async () => {
    const a = makeTabs([{ label: 'X' }]);
    const b = makeTabs([{ label: 'Y' }]);
    document.body.append(a, b);
    await raf();
    expect(a.tabs[0]?.id).not.toBe(b.tabs[0]?.id);
    expect(a.panels[0]?.id).not.toBe(b.panels[0]?.id);
  });

  it('preserves consumer-supplied IDs', async () => {
    const el = document.createElement('foundry-tabs') as FoundryTabs;
    el.innerHTML = `
      <foundry-tab slot="tab" id="my-tab">A</foundry-tab>
      <foundry-panel id="my-panel">body</foundry-panel>
    `;
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[0]?.id).toBe('my-tab');
    expect(el.panels[0]?.id).toBe('my-panel');
    expect(el.tabs[0]?.getAttribute('aria-controls')).toBe('my-panel');
    expect(el.panels[0]?.getAttribute('aria-labelledby')).toBe('my-tab');
  });
});

describe('FoundryTabs roving tabindex', () => {
  it('selected tab has tabindex=0; others have tabindex=-1', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
    document.body.appendChild(el);
    await raf();
    expect(el.tabs[0]?.tabIndex).toBe(0);
    expect(el.tabs[1]?.tabIndex).toBe(-1);
    expect(el.tabs[2]?.tabIndex).toBe(-1);
  });

  it('tabindex moves with the newly activated tab', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    (el as unknown as { value: string }).value = 'b';
    expect(el.tabs[0]?.tabIndex).toBe(-1);
    expect(el.tabs[1]?.tabIndex).toBe(0);
  });
});

describe('FoundryTabs keyboard navigation (horizontal)', () => {
  it('ArrowRight moves focus only (manual activation)', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[0]?.focus();

    keydown(el.tabs[0] as HTMLElement, 'ArrowRight');

    // Focus moved to B, but A is still selected (manual activation).
    expect(document.activeElement).toBe(el.tabs[1]);
    expect(el.tabs[0]?.hasAttribute('selected')).toBe(true);
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(false);
  });

  it('ArrowLeft wraps from first to last', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
    document.body.appendChild(el);
    await raf();
    el.tabs[0]?.focus();
    keydown(el.tabs[0] as HTMLElement, 'ArrowLeft');
    expect(document.activeElement).toBe(el.tabs[2]);
  });

  it('ArrowRight wraps from last to first', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }, { label: 'C' }]);
    document.body.appendChild(el);
    await raf();
    el.tabs[2]?.focus();
    keydown(el.tabs[2] as HTMLElement, 'ArrowRight');
    expect(document.activeElement).toBe(el.tabs[0]);
  });

  it('skips disabled tabs during arrow navigation', async () => {
    const el = makeTabs([
      { label: 'A' },
      { label: 'B', disabled: true },
      { label: 'C' },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[0]?.focus();
    keydown(el.tabs[0] as HTMLElement, 'ArrowRight');
    expect(document.activeElement).toBe(el.tabs[2]);
  });

  it('Home jumps to the first enabled tab', async () => {
    const el = makeTabs([
      { label: 'A', disabled: true },
      { label: 'B' },
      { label: 'C' },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[2]?.focus();
    keydown(el.tabs[2] as HTMLElement, 'Home');
    expect(document.activeElement).toBe(el.tabs[1]);
  });

  it('End jumps to the last enabled tab', async () => {
    const el = makeTabs([
      { label: 'A' },
      { label: 'B' },
      { label: 'C', disabled: true },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[0]?.focus();
    keydown(el.tabs[0] as HTMLElement, 'End');
    expect(document.activeElement).toBe(el.tabs[1]);
  });

  it('Enter activates the focused tab', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[1]?.focus();
    keydown(el.tabs[1] as HTMLElement, 'Enter');
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(true);
    expect(el.panels[1]?.hasAttribute('selected')).toBe(true);
  });

  it('Space activates the focused tab', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[1]?.focus();
    keydown(el.tabs[1] as HTMLElement, ' ');
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(true);
  });

  it('Enter on a disabled focused tab does not activate', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ]);
    document.body.appendChild(el);
    await raf();
    // Force focus onto the disabled tab for defensive coverage.
    el.tabs[1]?.focus();
    keydown(el.tabs[1] as HTMLElement, 'Enter');
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(false);
    expect(el.tabs[0]?.hasAttribute('selected')).toBe(true);
  });

  it('ArrowUp / ArrowDown are no-ops in horizontal orientation', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }]);
    document.body.appendChild(el);
    await raf();
    el.tabs[0]?.focus();
    keydown(el.tabs[0] as HTMLElement, 'ArrowDown');
    expect(document.activeElement).toBe(el.tabs[0]);
  });
});

describe('FoundryTabs keyboard navigation (vertical)', () => {
  it('ArrowDown moves focus to the next enabled tab', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }], { orientation: 'vertical' });
    document.body.appendChild(el);
    await raf();
    el.tabs[0]?.focus();
    keydown(el.tabs[0] as HTMLElement, 'ArrowDown');
    expect(document.activeElement).toBe(el.tabs[1]);
  });

  it('ArrowUp moves focus to the previous enabled tab', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }], { orientation: 'vertical' });
    document.body.appendChild(el);
    await raf();
    el.tabs[1]?.focus();
    keydown(el.tabs[1] as HTMLElement, 'ArrowUp');
    expect(document.activeElement).toBe(el.tabs[0]);
  });

  it('ArrowLeft / ArrowRight are no-ops in vertical orientation', async () => {
    const el = makeTabs([{ label: 'A' }, { label: 'B' }], { orientation: 'vertical' });
    document.body.appendChild(el);
    await raf();
    el.tabs[0]?.focus();
    keydown(el.tabs[0] as HTMLElement, 'ArrowRight');
    expect(document.activeElement).toBe(el.tabs[0]);
  });

  it('propertyChanged("orientation") updates aria-orientation', async () => {
    const el = makeTabs([{ label: 'A' }]);
    document.body.appendChild(el);
    (el as unknown as { orientation: 'vertical' }).orientation = 'vertical';
    const tablist = el.shadowRoot?.querySelector('[part="tablist"]');
    expect(tablist?.getAttribute('aria-orientation')).toBe('vertical');
  });
});

describe('FoundryTabs click activation', () => {
  it('clicking a tab activates it + its panel', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(true);
    expect(el.panels[1]?.hasAttribute('selected')).toBe(true);
  });

  it('clicking a disabled tab does not activate', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ]);
    document.body.appendChild(el);
    await raf();
    el.tabs[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(el.tabs[0]?.hasAttribute('selected')).toBe(true);
    expect(el.tabs[1]?.hasAttribute('selected')).toBe(false);
  });

  it('clicking already-active tab focuses it but is otherwise a no-op', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    let changeCount = 0;
    el.addEventListener('change', () => {
      changeCount += 1;
    });
    el.tabs[0]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(changeCount).toBe(0);
    expect(document.activeElement).toBe(el.tabs[0]);
  });
});

describe('FoundryTabs change event', () => {
  it('fires on user-initiated activation with detail.value', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    let detail: { value: string } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    el.tabs[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(detail?.value).toBe('b');
  });

  it('does not fire when value write resolves to the same tab', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(el);
    await raf();
    let count = 0;
    el.addEventListener('change', () => {
      count += 1;
    });
    (el as unknown as { value: string }).value = 'a';
    expect(count).toBe(0);
  });

  it('bubbles + composes across shadow boundaries', async () => {
    const outer = document.createElement('div');
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    outer.appendChild(el);
    document.body.appendChild(outer);
    await raf();
    let received = false;
    outer.addEventListener('change', () => {
      received = true;
    });
    el.tabs[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, composed: true }),
    );
    expect(received).toBe(true);
  });
});

describe('FoundryTabs slotchange re-pairing', () => {
  it('adding a tab + panel at runtime wires new pair IDs', async () => {
    const el = makeTabs([{ value: 'a', label: 'A' }]);
    document.body.appendChild(el);
    await raf();

    const newTab = document.createElement('foundry-tab');
    newTab.setAttribute('slot', 'tab');
    newTab.setAttribute('value', 'b');
    newTab.textContent = 'B';
    const newPanel = document.createElement('foundry-panel');
    newPanel.textContent = 'B body';
    el.append(newTab, newPanel);
    await raf();

    expect(el.tabs.length).toBe(2);
    expect(el.panels.length).toBe(2);
    expect(el.tabs[1]?.getAttribute('aria-controls')).toBe(el.panels[1]?.id);
  });

  it('removing the active tab/panel falls back to first enabled', async () => {
    const el = makeTabs([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ], { value: 'b' });
    document.body.appendChild(el);
    await raf();

    el.tabs[1]?.remove();
    el.panels[1]?.remove();
    await raf();

    expect(el.tabs.length).toBe(1);
    expect(el.tabs[0]?.hasAttribute('selected')).toBe(true);
  });

  it('ignores non-tab / non-panel slotted children', async () => {
    const el = document.createElement('foundry-tabs') as FoundryTabs;
    el.innerHTML = `
      <foundry-tab slot="tab" value="a">A</foundry-tab>
      <span slot="tab">garbage</span>
      <foundry-panel>A body</foundry-panel>
      <div>garbage panel</div>
    `;
    document.body.appendChild(el);
    await raf();
    expect(el.tabs.length).toBe(1);
    expect(el.panels.length).toBe(1);
  });
});

describe('FoundryTabs propertyChanged filter', () => {
  it('ignores unknown property names', async () => {
    const el = makeTabs([{ label: 'A' }]);
    document.body.appendChild(el);
    await raf();
    const before = (el as unknown as { value: string }).value;
    (el as unknown as {
      propertyChanged(name: string, prev: unknown, next: unknown): void;
    }).propertyChanged('unrelated', null, null);
    expect((el as unknown as { value: string }).value).toBe(before);
  });
});
