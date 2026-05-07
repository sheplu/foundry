import { expect } from '@open-wc/testing';
import { FoundryButton, FoundryButtonGroup } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryButton.define();
FoundryButtonGroup.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function buttons(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>('foundry-button'));
}

function byValue(host: HTMLElement, v: string): HTMLElement {
  const b = host.querySelector<HTMLElement>(`foundry-button[value="${v}"]`);
  if (!b) throw new Error(`no foundry-button with value=${v}`);
  return b;
}

describe('<foundry-button-group> functional', () => {
  afterEach(() => cleanup());

  it('passes axe in presentation mode', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group label="Actions">
        <foundry-button value="save">Save</foundry-button>
        <foundry-button value="publish">Publish</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe in single-select mode', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group mode="single" value="grid" label="View mode">
        <foundry-button value="list">List</foundry-button>
        <foundry-button value="grid">Grid</foundry-button>
        <foundry-button value="kanban">Kanban</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe in multi-select mode', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group mode="multiple" value="bold,italic" label="Text format">
        <foundry-button value="bold">Bold</foundry-button>
        <foundry-button value="italic">Italic</foundry-button>
        <foundry-button value="underline">Underline</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    await expectA11y(el);
  });

  it('clicking a child in single mode fires change with detail.value as string', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group mode="single" value="a">
        <foundry-button value="a">A</foundry-button>
        <foundry-button value="b">B</foundry-button>
        <foundry-button value="c">C</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    let detail: { value: string } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string }>).detail;
    });
    byValue(el, 'b').click();
    expect(detail?.value).to.equal('b');
  });

  it('clicking a child in multiple mode fires change with detail.value as array', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group mode="multiple">
        <foundry-button value="a">A</foundry-button>
        <foundry-button value="b">B</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    let detail: { value: string[] } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ value: string[] }>).detail;
    });
    byValue(el, 'a').click();
    expect(detail?.value).to.deep.equal(['a']);
    byValue(el, 'b').click();
    expect(detail?.value).to.deep.equal(['a', 'b']);
  });

  it('current pressed child carries aria-pressed="true" (single mode)', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group mode="single" value="grid">
        <foundry-button value="list">List</foundry-button>
        <foundry-button value="grid">Grid</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    expect(byValue(el, 'grid').getAttribute('pressed')).to.equal('true');
    expect(byValue(el, 'list').getAttribute('pressed')).to.equal('false');
  });

  it('ArrowRight moves focus to the next enabled child', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group mode="single">
        <foundry-button value="a">A</foundry-button>
        <foundry-button value="b">B</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    const bs = buttons(el);
    bs[0]?.focus();
    bs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(document.activeElement).to.equal(bs[1]);
  });

  it('host aria-label reflects the label attr', async () => {
    const el = mount<FoundryButtonGroup>(`
      <foundry-button-group label="Layout mode">
        <foundry-button value="a">A</foundry-button>
      </foundry-button-group>
    `);
    await raf();
    expect(el.getAttribute('aria-label')).to.equal('Layout mode');
  });
});
