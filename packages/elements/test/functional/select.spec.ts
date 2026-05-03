import { expect } from '@open-wc/testing';
import { FoundrySelect, FoundryOption } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundrySelect.define();
FoundryOption.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerControl(host: HTMLElement): HTMLButtonElement {
  const btn = host.shadowRoot?.querySelector('button[part="control"]');
  if (!(btn instanceof HTMLButtonElement)) throw new Error('inner control missing');
  return btn;
}

describe('<foundry-select> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a placeholder (no selection)', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select name="tz" placeholder="Pick timezone">
        <span slot="label">Timezone</span>
        <foundry-option value="utc">UTC</foundry-option>
        <foundry-option value="est">EST</foundry-option>
      </foundry-select>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with a preselected value', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select name="tz" value="utc">
        <span slot="label">Timezone</span>
        <foundry-option value="utc">UTC</foundry-option>
        <foundry-option value="est">EST</foundry-option>
      </foundry-select>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when required + empty (invalid state)', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select name="tz" placeholder="Pick" required>
        <span slot="label">Timezone</span>
        <span slot="error">Required</span>
        <foundry-option value="utc">UTC</foundry-option>
      </foundry-select>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe when disabled', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select name="tz" disabled>
        <span slot="label">Timezone</span>
        <foundry-option value="utc">UTC</foundry-option>
      </foundry-select>
    `);
    await raf();
    await expectA11y(el);
  });

  it('trigger exposes aria-haspopup="listbox"', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select><foundry-option value="a">A</foundry-option></foundry-select>
    `);
    await raf();
    expect(innerControl(el).getAttribute('aria-haspopup')).to.equal('listbox');
  });

  it('listbox has role="listbox" and popover="manual"', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select><foundry-option value="a">A</foundry-option></foundry-select>
    `);
    await raf();
    const listbox = el.shadowRoot?.querySelector('[part="listbox"]');
    expect(listbox?.getAttribute('role')).to.equal('listbox');
    expect(listbox?.getAttribute('popover')).to.equal('manual');
  });

  it('trigger aria-expanded stays "false" in Phase 1', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select><foundry-option value="a">A</foundry-option></foundry-select>
    `);
    await raf();
    const btn = innerControl(el);
    expect(btn.getAttribute('aria-expanded')).to.equal('false');
    btn.click();
    await raf();
    // Phase 1 has no click handler — aria-expanded must remain false.
    expect(btn.getAttribute('aria-expanded')).to.equal('false');
  });

  it('setting value updates the trigger label', async () => {
    const el = mount<FoundrySelect & { value: string }>(`
      <foundry-select>
        <foundry-option value="utc">UTC</foundry-option>
        <foundry-option value="est">Eastern (EST)</foundry-option>
      </foundry-select>
    `);
    await raf();
    el.value = 'est';
    await raf();
    const valueText = el.shadowRoot?.querySelector('[part="value"]')?.textContent ?? '';
    expect(valueText).to.equal('Eastern (EST)');
    expect(el.hasAttribute('has-value')).to.equal(true);
  });

  it('required + empty reports invalid + aria-invalid on control', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select name="tz" placeholder="Pick" required>
        <foundry-option value="utc">UTC</foundry-option>
      </foundry-select>
    `);
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(true);
    expect(innerControl(el).getAttribute('aria-invalid')).to.equal('true');
  });

  it('selected value surfaces in FormData under the name key', async () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-select name="timezone">
        <foundry-option value="utc">UTC</foundry-option>
        <foundry-option value="est">EST</foundry-option>
      </foundry-select>
    `;
    document.body.appendChild(form);
    await raf();

    const sel = form.querySelector('foundry-select') as FoundrySelect & { value: string };
    sel.value = 'utc';
    await raf();
    expect(new FormData(form).get('timezone')).to.equal('utc');

    form.remove();
  });

  it('empty select is omitted from FormData (setFormValue(null))', async () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-select name="timezone" placeholder="Pick">
        <foundry-option value="utc">UTC</foundry-option>
      </foundry-select>
    `;
    document.body.appendChild(form);
    await raf();
    expect(new FormData(form).get('timezone')).to.equal(null);
    form.remove();
  });

  it('formResetCallback restores the initial value attribute', async () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-select name="timezone" value="utc">
        <foundry-option value="utc">UTC</foundry-option>
        <foundry-option value="est">EST</foundry-option>
      </foundry-select>
    `;
    document.body.appendChild(form);
    await raf();

    const sel = form.querySelector('foundry-select') as FoundrySelect & { value: string };
    sel.value = 'est';
    await raf();
    expect(new FormData(form).get('timezone')).to.equal('est');

    form.reset();
    await raf();
    expect(new FormData(form).get('timezone')).to.equal('utc');

    form.remove();
  });

  it('focusing the host delegates to the inner control', async () => {
    const el = mount<FoundrySelect>(`
      <foundry-select><foundry-option value="a">A</foundry-option></foundry-select>
    `);
    await raf();
    el.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('BUTTON');
  });
});
