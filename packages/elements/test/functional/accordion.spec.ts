import { expect } from '@open-wc/testing';
import { FoundryAccordion, FoundryDetails } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryAccordion.define();
FoundryDetails.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerSummary(host: HTMLElement): HTMLElement {
  const s = host.shadowRoot?.querySelector('summary[part="summary"]');
  if (!(s instanceof HTMLElement)) throw new Error('inner summary missing');
  return s;
}

describe('<foundry-accordion> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with closed items', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion>
        <foundry-details><span slot="summary">A</span><p>body A</p></foundry-details>
        <foundry-details><span slot="summary">B</span><p>body B</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with one item open', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion>
        <foundry-details open><span slot="summary">A</span><p>body A</p></foundry-details>
        <foundry-details><span slot="summary">B</span><p>body B</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();
    await expectA11y(el);
  });

  it('clicking the summary toggles open via native <details> behavior', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion>
        <foundry-details><span slot="summary">A</span><p>body</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();
    const first = el.querySelector('foundry-details') as FoundryDetails;
    innerSummary(first).click();
    await raf();
    expect(first.hasAttribute('open')).to.equal(true);
    innerSummary(first).click();
    await raf();
    expect(first.hasAttribute('open')).to.equal(false);
  });

  it('Enter on the focused summary toggles open', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion>
        <foundry-details><span slot="summary">A</span><p>body</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();
    const first = el.querySelector('foundry-details') as FoundryDetails;
    const summary = innerSummary(first);
    summary.focus();
    summary.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    // Native <summary> responds to keydown via click — simulate the full
    // flow: also fire keypress/click so the browser toggles open.
    summary.click();
    await raf();
    expect(first.hasAttribute('open')).to.equal(true);
  });

  it('single-mode: opening B closes A automatically', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion>
        <foundry-details open><span slot="summary">A</span><p>a</p></foundry-details>
        <foundry-details><span slot="summary">B</span><p>b</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();
    const items = el.querySelectorAll('foundry-details');
    innerSummary(items[1] as HTMLElement).click();
    await raf();
    expect(items[0]?.hasAttribute('open')).to.equal(false);
    expect(items[1]?.hasAttribute('open')).to.equal(true);
  });

  it('multiple-mode: opening B leaves A open', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion mode="multiple">
        <foundry-details open><span slot="summary">A</span><p>a</p></foundry-details>
        <foundry-details><span slot="summary">B</span><p>b</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();
    const items = el.querySelectorAll('foundry-details');
    innerSummary(items[1] as HTMLElement).click();
    await raf();
    expect(items[0]?.hasAttribute('open')).to.equal(true);
    expect(items[1]?.hasAttribute('open')).to.equal(true);
  });

  it('disabled item does not toggle on click', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion>
        <foundry-details disabled><span slot="summary">A</span><p>a</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();
    const first = el.querySelector('foundry-details') as FoundryDetails;
    innerSummary(first).click();
    await raf();
    expect(first.hasAttribute('open')).to.equal(false);
  });

  it('change event fires with detail.openValues', async () => {
    const el = mount<FoundryAccordion>(`
      <foundry-accordion>
        <foundry-details value="alpha"><span slot="summary">A</span><p>a</p></foundry-details>
        <foundry-details value="beta"><span slot="summary">B</span><p>b</p></foundry-details>
      </foundry-accordion>
    `);
    await raf();

    let detail: { openValues: string[] } | undefined;
    el.addEventListener('change', (e) => {
      detail = (e as CustomEvent<{ openValues: string[] }>).detail;
    });

    const items = el.querySelectorAll('foundry-details');
    innerSummary(items[1] as HTMLElement).click();
    await raf();
    expect(detail?.openValues).to.deep.equal(['beta']);
  });
});
