import { expect } from '@open-wc/testing';
import { FoundryCheckbox } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryCheckbox.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerInput(host: HTMLElement): HTMLInputElement {
  const inp = host.shadowRoot?.querySelector('input[type="checkbox"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner checkbox missing');
  return inp;
}

function slottedLabel(host: HTMLElement): HTMLElement {
  const span = host.querySelector('span[slot="label"]');
  if (!(span instanceof HTMLElement)) throw new Error('slotted label missing');
  return span;
}

describe('<foundry-checkbox> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a label', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox><span slot="label">Subscribe</span></foundry-checkbox>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe when checked', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox checked><span slot="label">Subscribed</span></foundry-checkbox>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for required + invalid state', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox required><span slot="label">Required</span></foundry-checkbox>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for disabled state', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox disabled><span slot="label">Disabled</span></foundry-checkbox>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('clicking the visual box toggles checked on the host and inner input', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox><span slot="label">Toggle me</span></foundry-checkbox>`,
    );
    await raf();

    const box = el.shadowRoot?.querySelector('[part="box"]') as HTMLElement;
    box.click();
    await raf();
    expect(el.hasAttribute('checked')).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);

    box.click();
    await raf();
    expect(el.hasAttribute('checked')).to.equal(false);
    expect(innerInput(el).checked).to.equal(false);
  });

  it('clicking the slotted label text toggles the checkbox (nested-label pattern)', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox><span slot="label">Click my label</span></foundry-checkbox>`,
    );
    await raf();

    slottedLabel(el).click();
    await raf();
    expect(el.hasAttribute('checked')).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
  });

  it('reflects invalid when required is unchecked and clears on check', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox required><span slot="label">X</span></foundry-checkbox>`,
    );
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(true);

    const inp = innerInput(el);
    inp.checked = true;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(false);
  });

  it('checked checkbox submits name=value; unchecked is omitted from FormData', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-checkbox name="subscribe" value="weekly">
        <span slot="label">Weekly</span>
      </foundry-checkbox>
    `;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-checkbox') as FoundryCheckbox;

    // Unchecked → FormData omits the field entirely.
    expect(new FormData(form).get('subscribe')).to.equal(null);

    // Check → name=value surfaces in FormData.
    innerInput(el).checked = true;
    innerInput(el).dispatchEvent(new Event('change', { bubbles: true }));
    await raf();
    expect(new FormData(form).get('subscribe')).to.equal('weekly');

    // Uncheck again → omitted.
    innerInput(el).checked = false;
    innerInput(el).dispatchEvent(new Event('change', { bubbles: true }));
    await raf();
    expect(new FormData(form).get('subscribe')).to.equal(null);

    form.remove();
  });

  it('formResetCallback clears checked on form reset', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-checkbox name="s" value="on" checked>
        <span slot="label">X</span>
      </foundry-checkbox>
    `;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-checkbox') as FoundryCheckbox & { checked: boolean };
    expect(el.checked).to.equal(true);
    expect(new FormData(form).get('s')).to.equal('on');

    form.reset();
    await raf();
    expect(el.checked).to.equal(false);
    expect(new FormData(form).get('s')).to.equal(null);

    form.remove();
  });

  it('focusing the host delegates to the inner input', async () => {
    const el = mount<FoundryCheckbox>(
      `<foundry-checkbox><span slot="label">F</span></foundry-checkbox>`,
    );
    await raf();
    el.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('INPUT');
  });
});
