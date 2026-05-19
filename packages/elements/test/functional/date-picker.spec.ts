import { expect } from '@open-wc/testing';
import { FoundryDatePicker } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryDatePicker.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerInput(host: HTMLElement): HTMLInputElement {
  const inp = host.shadowRoot?.querySelector('input[part="input"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner input missing');
  return inp;
}

describe('<foundry-date-picker> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with label + helper (closed)', async () => {
    const el = mount<FoundryDatePicker>(`
      <foundry-date-picker name="dob">
        <span slot="label">Date of birth</span>
        <span slot="helper">Format: YYYY-MM-DD.</span>
      </foundry-date-picker>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with open popover (dialog + grid)', async () => {
    const el = mount<FoundryDatePicker>(`
      <foundry-date-picker name="dob" value="2026-05-19">
        <span slot="label">Date of birth</span>
      </foundry-date-picker>
    `);
    await raf();
    el.show();
    await raf();
    // color-contrast is disabled because the popover renders in the
    // top layer, where axe can't reliably resolve the cascading custom
    // properties from the page-level theme stylesheet.
    await expectA11y(el, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22a', 'wcag22aa'] },
      rules: {
        'color-contrast': { enabled: false },
      },
    });
  });

  it('Tab focus reaches the inner input; ArrowDown opens the popover', async () => {
    const el = mount<FoundryDatePicker>(`
      <foundry-date-picker name="dob">
        <span slot="label">Date of birth</span>
      </foundry-date-picker>
    `);
    await raf();
    const inp = innerInput(el);
    inp.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('INPUT');
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await raf();
    expect(el.hasAttribute('open')).to.equal(true);
    expect(inp.getAttribute('aria-expanded')).to.equal('true');
  });

  it('typing a valid in-range ISO commits to FormData under the name key', async () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-date-picker name="dob" min="1900-01-01" max="2030-12-31"></foundry-date-picker>
    `;
    document.body.appendChild(form);
    await raf();

    const dp = form.querySelector('foundry-date-picker') as FoundryDatePicker;
    const inp = innerInput(dp);
    inp.value = '2026-05-19';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await raf();
    expect(new FormData(form).get('dob')).to.equal('2026-05-19');

    form.remove();
  });
});
