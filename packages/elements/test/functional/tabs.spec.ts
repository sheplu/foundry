import { expect } from '@open-wc/testing';
import { FoundryTabs } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryTabs.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-tabs> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with horizontal tabs', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs>
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">B</foundry-tab>
        <foundry-panel>Alpha content</foundry-panel>
        <foundry-panel>Beta content</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with vertical orientation', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs orientation="vertical">
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">B</foundry-tab>
        <foundry-panel>A content</foundry-panel>
        <foundry-panel>B content</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with a disabled tab', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs>
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b" disabled>B</foundry-tab>
        <foundry-panel>A content</foundry-panel>
        <foundry-panel>B content</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    await expectA11y(el);
  });

  it('clicking a tab activates it + shows the matching panel', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs>
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">Beta</foundry-tab>
        <foundry-panel>A body</foundry-panel>
        <foundry-panel>B body</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    const tabs = el.querySelectorAll('foundry-tab');
    const panels = el.querySelectorAll('foundry-panel');
    (tabs[1] as HTMLElement).click();
    await raf();
    expect(tabs[1]?.hasAttribute('selected')).to.equal(true);
    expect(panels[1]?.hasAttribute('selected')).to.equal(true);
    expect(tabs[0]?.hasAttribute('selected')).to.equal(false);
    expect(panels[0]?.hasAttribute('selected')).to.equal(false);
  });

  it('Arrow keys move focus only (manual activation)', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs>
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">B</foundry-tab>
        <foundry-tab slot="tab" value="c">C</foundry-tab>
        <foundry-panel>A</foundry-panel>
        <foundry-panel>B</foundry-panel>
        <foundry-panel>C</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    const tabs = el.querySelectorAll('foundry-tab');
    (tabs[0] as HTMLElement).focus();
    (tabs[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
    );
    await raf();
    // Focus moved to B but A is still selected.
    expect(document.activeElement).to.equal(tabs[1]);
    expect(tabs[0]?.hasAttribute('selected')).to.equal(true);
    expect(tabs[1]?.hasAttribute('selected')).to.equal(false);
  });

  it('Enter activates the focused tab', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs>
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">B</foundry-tab>
        <foundry-panel>A</foundry-panel>
        <foundry-panel>B</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    const tabs = el.querySelectorAll('foundry-tab');
    (tabs[1] as HTMLElement).focus();
    (tabs[1] as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }),
    );
    await raf();
    expect(tabs[1]?.hasAttribute('selected')).to.equal(true);
  });

  it('disabled tabs are skipped by arrow navigation', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs>
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b" disabled>B</foundry-tab>
        <foundry-tab slot="tab" value="c">C</foundry-tab>
        <foundry-panel>A</foundry-panel>
        <foundry-panel>B</foundry-panel>
        <foundry-panel>C</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    const tabs = el.querySelectorAll('foundry-tab');
    (tabs[0] as HTMLElement).focus();
    (tabs[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, composed: true }),
    );
    await raf();
    expect(document.activeElement).to.equal(tabs[2]);
  });

  it('vertical orientation uses ArrowUp/Down instead', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs orientation="vertical">
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">B</foundry-tab>
        <foundry-panel>A</foundry-panel>
        <foundry-panel>B</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    const tabs = el.querySelectorAll('foundry-tab');
    (tabs[0] as HTMLElement).focus();
    (tabs[0] as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
    );
    await raf();
    expect(document.activeElement).to.equal(tabs[1]);
  });

  it('tab aria-controls and panel aria-labelledby cross-reference each other', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs>
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">B</foundry-tab>
        <foundry-panel>A</foundry-panel>
        <foundry-panel>B</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    const tabs = el.querySelectorAll('foundry-tab');
    const panels = el.querySelectorAll('foundry-panel');
    expect(tabs[0]?.getAttribute('aria-controls')).to.equal(panels[0]?.id);
    expect(panels[0]?.getAttribute('aria-labelledby')).to.equal(tabs[0]?.id);
  });

  it('roving tabindex: only the selected tab has tabindex=0', async () => {
    const el = mount<FoundryTabs>(`
      <foundry-tabs value="b">
        <foundry-tab slot="tab" value="a">A</foundry-tab>
        <foundry-tab slot="tab" value="b">B</foundry-tab>
        <foundry-tab slot="tab" value="c">C</foundry-tab>
        <foundry-panel>A</foundry-panel>
        <foundry-panel>B</foundry-panel>
        <foundry-panel>C</foundry-panel>
      </foundry-tabs>
    `);
    await raf();
    const tabs = el.querySelectorAll<HTMLElement>('foundry-tab');
    expect(tabs[0]?.tabIndex).to.equal(-1);
    expect(tabs[1]?.tabIndex).to.equal(0);
    expect(tabs[2]?.tabIndex).to.equal(-1);
  });
});
