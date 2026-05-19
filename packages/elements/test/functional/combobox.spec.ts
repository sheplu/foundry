import { expect } from '@open-wc/testing';
import { FoundryCombobox, FoundryOption } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryCombobox.define();
FoundryOption.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerInput(host: HTMLElement): HTMLInputElement {
  const inp = host.shadowRoot?.querySelector('input[part="input"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner input missing');
  return inp;
}

describe('<foundry-combobox> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with label + helper + options', async () => {
    const el = mount<FoundryCombobox>(`
      <foundry-combobox name="city" placeholder="Type a city">
        <span slot="label">City</span>
        <span slot="helper">Suggestions; you can also type your own.</span>
        <foundry-option value="paris">Paris</foundry-option>
        <foundry-option value="london">London</foundry-option>
        <foundry-option value="tokyo">Tokyo</foundry-option>
      </foundry-combobox>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when invalid + error', async () => {
    const el = mount<FoundryCombobox>(`
      <foundry-combobox name="city" placeholder="Type" required>
        <span slot="label">City</span>
        <span slot="error">Please pick a city.</span>
        <foundry-option value="paris">Paris</foundry-option>
      </foundry-combobox>
    `);
    await raf();
    await expectA11y(el);
  });

  it('Tab focus reaches the inner input; ArrowDown opens the listbox', async () => {
    const el = mount<FoundryCombobox>(`
      <foundry-combobox>
        <span slot="label">City</span>
        <foundry-option value="paris">Paris</foundry-option>
        <foundry-option value="london">London</foundry-option>
      </foundry-combobox>
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

  it('typed free-text surfaces in FormData under the name key (mid-type submission)', async () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-combobox name="city">
        <foundry-option value="paris">Paris</foundry-option>
      </foundry-combobox>
    `;
    document.body.appendChild(form);
    await raf();

    const cb = form.querySelector('foundry-combobox') as FoundryCombobox;
    const inp = innerInput(cb);
    inp.value = 'custom city';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    await raf();
    expect(new FormData(form).get('city')).to.equal('custom city');

    form.remove();
  });
});
