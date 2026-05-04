import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { FoundryMenu } from './menu.ts';
import { FoundryMenuitem } from '../menuitem/menuitem.ts';

// jsdom doesn't implement the Popover API. Shim showPopover/hidePopover
// so the controller's state flips and toggle listeners fire.
function installPopoverShim(): () => void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  const originalShow = proto.showPopover;
  const originalHide = proto.hidePopover;
  proto.showPopover = function (this: HTMLElement): void {
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', { value: 'open' });
    this.dispatchEvent(event);
  };
  proto.hidePopover = function (this: HTMLElement): void {
    const event = new Event('toggle');
    Object.defineProperty(event, 'newState', { value: 'closed' });
    this.dispatchEvent(event);
  };
  return (): void => {
    if (originalShow === undefined) delete proto.showPopover;
    else proto.showPopover = originalShow;
    if (originalHide === undefined) delete proto.hidePopover;
    else proto.hidePopover = originalHide;
  };
}

let shimTeardown: () => void;
beforeAll(() => {
  FoundryMenu.define();
  shimTeardown = installPopoverShim();
});
afterAll(() => {
  shimTeardown();
});

let counter = 0;

interface ItemSpec {
  value?: string;
  label: string;
  disabled?: boolean;
}

function makeMenu(items: ItemSpec[] = []): {
  menu: FoundryMenu;
  trigger: HTMLButtonElement;
} {
  const menu = document.createElement('foundry-menu') as FoundryMenu;
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.textContent = 'Actions';
  menu.appendChild(trigger);
  for (const spec of items) {
    const item = document.createElement('foundry-menuitem');
    item.setAttribute('slot', 'items');
    if (spec.value !== undefined) item.setAttribute('value', spec.value);
    if (spec.disabled) item.setAttribute('disabled', '');
    item.textContent = spec.label;
    menu.appendChild(item);
  }
  return { menu, trigger };
}

function keydown(target: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

function click(target: HTMLElement): MouseEvent {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, composed: true });
  target.dispatchEvent(event);
  return event;
}

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryMenu.define', () => {
  it('registers the canonical tag', () => {
    expect(customElements.get('foundry-menu')).toBe(FoundryMenu);
  });

  it('defines foundry-menuitem as a side-effect', () => {
    FoundryMenu.define();
    expect(customElements.get('foundry-menuitem')).toBe(FoundryMenuitem);
  });

  it('does not re-register an existing tag', () => {
    const tag = `foundry-menu-noop-${++counter}`;
    class Existing extends HTMLElement {}
    customElements.define(tag, Existing);
    expect(() => FoundryMenu.define(tag)).not.toThrow();
    expect(customElements.get(tag)).toBe(Existing);
  });
});

describe('FoundryMenu defaults', () => {
  it('defaults open=false, placement=bottom', () => {
    const { menu } = makeMenu();
    document.body.appendChild(menu);
    expect(menu.hasAttribute('open')).toBe(false);
    expect(menu.getAttribute('placement')).toBe('bottom');
  });

  it('surface has role="menu" and popover="auto"', () => {
    const { menu } = makeMenu();
    document.body.appendChild(menu);
    const surface = menu.shadowRoot?.querySelector('[part="surface"]');
    expect(surface?.getAttribute('role')).toBe('menu');
    expect(surface?.getAttribute('popover')).toBe('auto');
  });
});

describe('FoundryMenu trigger wiring', () => {
  it('wires aria-haspopup, aria-controls, aria-expanded on the slotted trigger', async () => {
    const { menu, trigger } = makeMenu();
    document.body.appendChild(menu);
    await raf();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    const surface = menu.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    expect(trigger.getAttribute('aria-controls')).toBe(surface.id);
  });

  it('re-wires trigger when slotted element changes', async () => {
    const { menu, trigger } = makeMenu();
    document.body.appendChild(menu);
    await raf();
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');

    trigger.remove();
    const nextTrigger = document.createElement('button');
    nextTrigger.textContent = 'New';
    menu.insertBefore(nextTrigger, menu.firstChild);
    await raf();
    expect(nextTrigger.getAttribute('aria-haspopup')).toBe('menu');
    // Old trigger had its wiring removed.
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
  });

  it('cleans up trigger attributes on disconnect', async () => {
    const { menu, trigger } = makeMenu();
    document.body.appendChild(menu);
    await raf();
    expect(trigger.hasAttribute('aria-haspopup')).toBe(true);
    menu.remove();
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
    expect(trigger.hasAttribute('aria-expanded')).toBe(false);
  });
});

describe('FoundryMenu show / hide / toggle', () => {
  it('show() opens the surface + updates aria-expanded', async () => {
    const { menu, trigger } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    expect(menu.hasAttribute('open')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('show() seeds active on first enabled item', async () => {
    const { menu } = makeMenu([
      { value: 'a', label: 'A', disabled: true },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    expect(menu.items[1]?.hasAttribute('active')).toBe(true);
  });

  it('hide() closes + clears active + removes aria-activedescendant', async () => {
    const { menu, trigger } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(true);
    menu.hide();
    expect(menu.hasAttribute('open')).toBe(false);
    expect(menu.items[0]?.hasAttribute('active')).toBe(false);
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('toggle() flips open/closed', async () => {
    const { menu } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.toggle();
    expect(menu.hasAttribute('open')).toBe(true);
    menu.toggle();
    expect(menu.hasAttribute('open')).toBe(false);
  });

  it('show / hide are idempotent', async () => {
    const { menu } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    menu.show();
    expect(menu.hasAttribute('open')).toBe(true);
    menu.hide();
    menu.hide();
    expect(menu.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryMenu aria-activedescendant tracking', () => {
  it('points at the active item id while open', async () => {
    const { menu, trigger } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    expect(trigger.getAttribute('aria-activedescendant')).toBe(menu.items[0]?.id);
  });

  it('assigns stable per-instance ids to items', async () => {
    const { menu: a } = makeMenu([{ value: 'x', label: 'X' }]);
    const { menu: b } = makeMenu([{ value: 'y', label: 'Y' }]);
    document.body.append(a, b);
    await raf();
    expect(a.items[0]?.id).toMatch(/^foundry-menu-\d+-item-0$/);
    expect(b.items[0]?.id).toMatch(/^foundry-menu-\d+-item-0$/);
    expect(a.items[0]?.id).not.toBe(b.items[0]?.id);
  });

  it('preserves consumer-supplied item ids', async () => {
    const menu = document.createElement('foundry-menu') as FoundryMenu;
    menu.innerHTML = `
      <button>Actions</button>
      <foundry-menuitem id="my-item" slot="items">Edit</foundry-menuitem>
    `;
    document.body.appendChild(menu);
    await raf();
    expect(menu.items[0]?.id).toBe('my-item');
  });
});

describe('FoundryMenu keyboard (closed)', () => {
  it.each(['ArrowDown', 'ArrowUp', 'Enter', ' ', 'Home', 'End'])(
    '%s opens the menu',
    async (key) => {
      const { menu, trigger } = makeMenu([
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]);
      document.body.appendChild(menu);
      await raf();
      const event = keydown(trigger, key);
      expect(menu.hasAttribute('open')).toBe(true);
      expect(event.defaultPrevented).toBe(true);
    },
  );

  it('End on closed opens and seeds active on the last enabled item', async () => {
    const { menu, trigger } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C', disabled: true },
    ]);
    document.body.appendChild(menu);
    await raf();
    keydown(trigger, 'End');
    expect(menu.items[1]?.hasAttribute('active')).toBe(true);
  });
});

describe('FoundryMenu keyboard (open)', () => {
  it('ArrowDown cycles active, skipping disabled', async () => {
    const { menu, trigger } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
      { value: 'c', label: 'C' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    keydown(trigger, 'ArrowDown');
    expect(menu.items[2]?.hasAttribute('active')).toBe(true);
  });

  it('ArrowUp wraps from first to last enabled', async () => {
    const { menu, trigger } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    keydown(trigger, 'ArrowUp');
    expect(menu.items[1]?.hasAttribute('active')).toBe(true);
  });

  it('Enter invokes active item + auto-closes', async () => {
    const { menu, trigger } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    let detail: { value: string } | undefined;
    menu.addEventListener('select', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    keydown(trigger, 'ArrowDown');
    keydown(trigger, 'Enter');
    expect(detail?.value).toBe('b');
    expect(menu.hasAttribute('open')).toBe(false);
  });

  it('Space invokes active item', async () => {
    const { menu, trigger } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    let fired = 0;
    menu.addEventListener('select', () => {
      fired += 1;
    });
    keydown(trigger, ' ');
    expect(fired).toBe(1);
  });

  it('Escape closes the menu', async () => {
    const { menu, trigger } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    keydown(trigger, 'Escape');
    expect(menu.hasAttribute('open')).toBe(false);
  });

  it('Home/End jump to first/last enabled', async () => {
    const { menu, trigger } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    keydown(trigger, 'End');
    expect(menu.items[2]?.hasAttribute('active')).toBe(true);
    keydown(trigger, 'Home');
    expect(menu.items[0]?.hasAttribute('active')).toBe(true);
  });

  it('Enter on a disabled active item does not invoke', async () => {
    const { menu, trigger } = makeMenu([
      { value: 'a', label: 'A', disabled: true },
    ]);
    document.body.appendChild(menu);
    await raf();
    // Disabled item is the only one — force it active for defensive coverage.
    (menu.items[0] as unknown as { active: boolean }).active = true;
    menu.show();
    let fired = 0;
    menu.addEventListener('select', () => {
      fired += 1;
    });
    keydown(trigger, 'Enter');
    expect(fired).toBe(0);
  });
});

describe('FoundryMenu click invocation', () => {
  it('clicking a menuitem fires select + auto-closes', async () => {
    const { menu } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    let detail: { value: string } | undefined;
    menu.addEventListener('select', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    click(menu.items[1] as HTMLElement);
    expect(detail?.value).toBe('b');
    expect(menu.hasAttribute('open')).toBe(false);
  });

  it('clicking a disabled menuitem is a no-op', async () => {
    const { menu } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    let fired = 0;
    menu.addEventListener('select', () => {
      fired += 1;
    });
    click(menu.items[1] as HTMLElement);
    expect(fired).toBe(0);
    expect(menu.hasAttribute('open')).toBe(true);
  });

  it('click on surface background (not an item) is ignored', async () => {
    const { menu } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    const surface = menu.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    let fired = 0;
    menu.addEventListener('select', () => {
      fired += 1;
    });
    click(surface);
    expect(fired).toBe(0);
  });

  it('pointermove over an enabled item sets it active', async () => {
    const { menu } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    menu.items[1]?.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, composed: true }),
    );
    expect(menu.items[1]?.hasAttribute('active')).toBe(true);
  });

  it('pointermove over a disabled item leaves active unchanged', async () => {
    const { menu } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    menu.items[1]?.dispatchEvent(
      new PointerEvent('pointermove', { bubbles: true, composed: true }),
    );
    expect(menu.items[0]?.hasAttribute('active')).toBe(true);
    expect(menu.items[1]?.hasAttribute('active')).toBe(false);
  });
});

describe('FoundryMenu auto-close veto', () => {
  it('preventDefault() on select suppresses auto-close', async () => {
    const { menu } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    menu.addEventListener('select', (e) => {
      e.preventDefault();
    });
    click(menu.items[0] as HTMLElement);
    expect(menu.hasAttribute('open')).toBe(true);
  });

  it('normal listener (no preventDefault) triggers the auto-close', async () => {
    const { menu } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    menu.addEventListener('select', () => undefined);
    click(menu.items[0] as HTMLElement);
    expect(menu.hasAttribute('open')).toBe(false);
  });
});

describe('FoundryMenu trigger click (light-dismiss guard)', () => {
  it('pointerdown + click while open does not re-open', async () => {
    const { menu, trigger } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();

    // Simulate the browser's light-dismiss behavior: pointerdown captures
    // the open state, then the surface's toggle event fires closed, then
    // the click handler runs. Without the guard, click would re-open.
    trigger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    const surface = menu.shadowRoot?.querySelector('[part="surface"]') as HTMLElement;
    const toggle = new Event('toggle');
    Object.defineProperty(toggle, 'newState', { value: 'closed' });
    surface.dispatchEvent(toggle);
    click(trigger);
    expect(menu.hasAttribute('open')).toBe(false);
  });

  it('synthesised click after Enter keydown does not re-open', async () => {
    const { menu, trigger } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    keydown(trigger, 'Enter');
    // The browser would fire a click after Enter on a focused <button>.
    click(trigger);
    expect(menu.hasAttribute('open')).toBe(true);
  });
});

describe('FoundryMenu slotchange re-pair', () => {
  it('adding a menuitem at runtime is discovered', async () => {
    const { menu } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    expect(menu.items.length).toBe(1);
    const extra = document.createElement('foundry-menuitem');
    extra.setAttribute('slot', 'items');
    extra.setAttribute('value', 'b');
    extra.textContent = 'B';
    menu.appendChild(extra);
    await raf();
    expect(menu.items.length).toBe(2);
  });

  it('removing the active item clears active', async () => {
    const { menu } = makeMenu([
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    keydown(menu.querySelector('button') as HTMLButtonElement, 'ArrowDown');
    expect(menu.items[1]?.hasAttribute('active')).toBe(true);
    menu.items[1]?.remove();
    await raf();
    expect(menu.items.length).toBe(1);
    expect(menu.items[0]?.hasAttribute('active')).toBe(true);
  });

  it('ignores non-menuitem children', async () => {
    const menu = document.createElement('foundry-menu') as FoundryMenu;
    const trigger = document.createElement('button');
    trigger.textContent = 'Actions';
    menu.appendChild(trigger);
    const stray = document.createElement('span');
    stray.setAttribute('slot', 'items');
    stray.textContent = 'garbage';
    menu.appendChild(stray);
    const item = document.createElement('foundry-menuitem');
    item.setAttribute('slot', 'items');
    item.textContent = 'Real item';
    menu.appendChild(item);
    document.body.appendChild(menu);
    await raf();
    expect(menu.items.length).toBe(1);
  });
});

describe('FoundryMenu placement', () => {
  it('reflects the placement attribute', async () => {
    const { menu } = makeMenu();
    menu.setAttribute('placement', 'top');
    document.body.appendChild(menu);
    await raf();
    expect(menu.getAttribute('placement')).toBe('top');
  });

  it('propertyChanged for placement does not throw when open', async () => {
    const { menu } = makeMenu([{ value: 'a', label: 'A' }]);
    document.body.appendChild(menu);
    await raf();
    menu.show();
    expect(() => {
      (menu as unknown as { placement: string }).placement = 'top';
    }).not.toThrow();
  });
});

describe('FoundryMenu propertyChanged filter', () => {
  it('ignores unknown property names', async () => {
    const { menu } = makeMenu();
    document.body.appendChild(menu);
    await raf();
    expect(() =>
      (menu as unknown as {
        propertyChanged(name: string, prev: unknown, next: unknown): void;
      }).propertyChanged('unrelated', null, null),
    ).not.toThrow();
  });
});
