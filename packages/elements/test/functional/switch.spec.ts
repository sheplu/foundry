import { expect } from '@open-wc/testing';
import { FoundrySwitch } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundrySwitch.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerInput(host: HTMLElement): HTMLInputElement {
  const inp = host.shadowRoot?.querySelector('input[type="checkbox"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner switch input missing');
  return inp;
}

function slottedLabel(host: HTMLElement): HTMLElement {
  const span = host.querySelector('span[slot="label"]');
  if (!(span instanceof HTMLElement)) throw new Error('slotted label missing');
  return span;
}

describe('<foundry-switch> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a label', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch><span slot="label">Enable notifications</span></foundry-switch>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe when checked', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch checked><span slot="label">Notifications on</span></foundry-switch>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for required + invalid state', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch required><span slot="label">Required</span></foundry-switch>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for disabled state', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch disabled><span slot="label">Disabled</span></foundry-switch>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('inner input exposes role="switch" for assistive technology', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch><span slot="label">Toggle</span></foundry-switch>`,
    );
    await raf();
    expect(innerInput(el).getAttribute('role')).to.equal('switch');
  });

  it('clicking the track toggles checked on the host and inner input', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch><span slot="label">Toggle me</span></foundry-switch>`,
    );
    await raf();

    const track = el.shadowRoot?.querySelector('[part="track"]') as HTMLElement;
    track.click();
    await raf();
    expect(el.hasAttribute('checked')).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);

    track.click();
    await raf();
    expect(el.hasAttribute('checked')).to.equal(false);
    expect(innerInput(el).checked).to.equal(false);
  });

  it('clicking the slotted label text toggles the switch (nested-label pattern)', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch><span slot="label">Click my label</span></foundry-switch>`,
    );
    await raf();

    slottedLabel(el).click();
    await raf();
    expect(el.hasAttribute('checked')).to.equal(true);
    expect(innerInput(el).checked).to.equal(true);
  });

  it('reflects invalid when required is unchecked and clears on check', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch required><span slot="label">X</span></foundry-switch>`,
    );
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(true);

    const inp = innerInput(el);
    inp.checked = true;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(false);
  });

  it('checked switch submits name=value; unchecked is omitted from FormData', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-switch name="notifications" value="on">
        <span slot="label">Notifications</span>
      </foundry-switch>
    `;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-switch') as FoundrySwitch;

    expect(new FormData(form).get('notifications')).to.equal(null);

    innerInput(el).checked = true;
    innerInput(el).dispatchEvent(new Event('change', { bubbles: true }));
    await raf();
    expect(new FormData(form).get('notifications')).to.equal('on');

    innerInput(el).checked = false;
    innerInput(el).dispatchEvent(new Event('change', { bubbles: true }));
    await raf();
    expect(new FormData(form).get('notifications')).to.equal(null);

    form.remove();
  });

  it('formResetCallback clears checked on form reset', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-switch name="notif" value="on" checked>
        <span slot="label">X</span>
      </foundry-switch>
    `;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-switch') as FoundrySwitch & { checked: boolean };
    expect(el.checked).to.equal(true);
    expect(new FormData(form).get('notif')).to.equal('on');

    form.reset();
    await raf();
    expect(el.checked).to.equal(false);
    expect(new FormData(form).get('notif')).to.equal(null);

    form.remove();
  });

  it('focusing the host delegates to the inner input', async () => {
    const el = mount<FoundrySwitch>(
      `<foundry-switch><span slot="label">F</span></foundry-switch>`,
    );
    await raf();
    el.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('INPUT');
  });
});
