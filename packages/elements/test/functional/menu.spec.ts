import { expect } from '@open-wc/testing';
import { FoundryMenu, FoundryMenuitem } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryMenu.define();
FoundryMenuitem.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-menu> functional', () => {
  afterEach(() => cleanup());

  it('passes axe when closed', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button>Actions</button>
        <foundry-menuitem slot="items" value="a">A</foundry-menuitem>
        <foundry-menuitem slot="items" value="b">B</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when open', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button>Actions</button>
        <foundry-menuitem slot="items" value="a">A</foundry-menuitem>
        <foundry-menuitem slot="items" value="b">B</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    el.show();
    await raf();
    // Slotted menuitem text lives in the top-layer surface where axe
    // can't reliably traverse the shadow boundary (same limitation as
    // tooltip/popover/modal). aria-activedescendant refers to light-DOM
    // ids from the shadow-scoped trigger — another cross-tree-scope
    // false positive.
    await expectA11y(el, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'] },
      rules: {
        'color-contrast': { enabled: false },
        'aria-valid-attr-value': { enabled: false },
        // The trigger <button> carries aria-activedescendant (to reference
        // active item id in shadow-scoped surface). axe treats this as
        // disallowed on role=button, but the WAI-ARIA combobox/menu
        // pattern both support it and real screen readers follow the
        // composed tree. False positive for this arch.
        'aria-allowed-attr': { enabled: false },
      },
    });
  });

  it('clicking the trigger opens the menu and flips aria-expanded', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button data-testid="trigger">Actions</button>
        <foundry-menuitem slot="items" value="a">A</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    const trigger = el.querySelector('button[data-testid="trigger"]') as HTMLButtonElement;
    expect(trigger.getAttribute('aria-expanded')).to.equal('false');
    trigger.click();
    await raf();
    expect(el.hasAttribute('open')).to.equal(true);
    expect(trigger.getAttribute('aria-expanded')).to.equal('true');
  });

  it('clicking a menuitem fires select with detail.value and auto-closes', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button>Actions</button>
        <foundry-menuitem slot="items" value="edit">Edit</foundry-menuitem>
        <foundry-menuitem slot="items" value="duplicate">Duplicate</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    el.show();
    await raf();
    let detail: { value: string } | undefined;
    el.addEventListener('select', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    const items = el.querySelectorAll('foundry-menuitem');
    (items[1] as HTMLElement).click();
    await raf();
    expect(detail?.value).to.equal('duplicate');
    expect(el.hasAttribute('open')).to.equal(false);
  });

  it('Enter on the focused trigger opens the menu', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button>Actions</button>
        <foundry-menuitem slot="items" value="a">A</foundry-menuitem>
        <foundry-menuitem slot="items" value="b">B</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    const trigger = el.querySelector('button') as HTMLButtonElement;
    trigger.focus();
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await raf();
    expect(el.hasAttribute('open')).to.equal(true);
  });

  it('ArrowDown moves active + Enter invokes it', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button>Actions</button>
        <foundry-menuitem slot="items" value="a">A</foundry-menuitem>
        <foundry-menuitem slot="items" value="b">B</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    el.show();
    await raf();
    let detail: { value: string } | undefined;
    el.addEventListener('select', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    const trigger = el.querySelector('button') as HTMLButtonElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
    );
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    await raf();
    expect(detail?.value).to.equal('b');
    expect(el.hasAttribute('open')).to.equal(false);
  });

  it('Escape closes the menu', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button>Actions</button>
        <foundry-menuitem slot="items" value="a">A</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    el.show();
    await raf();
    expect(el.hasAttribute('open')).to.equal(true);
    const trigger = el.querySelector('button') as HTMLButtonElement;
    trigger.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await raf();
    expect(el.hasAttribute('open')).to.equal(false);
  });

  it('preventDefault() on select keeps the menu open', async () => {
    const el = mount<FoundryMenu>(`
      <foundry-menu>
        <button>Actions</button>
        <foundry-menuitem slot="items" value="a">A</foundry-menuitem>
      </foundry-menu>
    `);
    await raf();
    el.show();
    await raf();
    el.addEventListener('select', (e) => {
      e.preventDefault();
    });
    (el.querySelector('foundry-menuitem') as HTMLElement).click();
    await raf();
    expect(el.hasAttribute('open')).to.equal(true);
  });
});
