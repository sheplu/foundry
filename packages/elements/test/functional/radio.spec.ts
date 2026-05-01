import { expect } from '@open-wc/testing';
import { FoundryRadio } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryRadio.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerInput(host: HTMLElement): HTMLInputElement {
  const inp = host.shadowRoot?.querySelector('input[type="radio"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner radio missing');
  return inp;
}

describe('<foundry-radio> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a label', async () => {
    const el = mount<FoundryRadio>(
      `<foundry-radio name="fn-a"><span slot="label">A</span></foundry-radio>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for a group of three radios', async () => {
    const host = mount<HTMLDivElement>(
      `<div role="radiogroup">
        <foundry-radio name="fn-group" value="a" checked><span slot="label">A</span></foundry-radio>
        <foundry-radio name="fn-group" value="b"><span slot="label">B</span></foundry-radio>
        <foundry-radio name="fn-group" value="c"><span slot="label">C</span></foundry-radio>
      </div>`,
    );
    await raf();
    await expectA11y(host);
  });

  it('passes axe for a required + invalid radio', async () => {
    const el = mount<FoundryRadio>(
      `<foundry-radio name="fn-req" required><span slot="label">R</span></foundry-radio>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for a disabled radio', async () => {
    const el = mount<FoundryRadio>(
      `<foundry-radio name="fn-dis" disabled><span slot="label">D</span></foundry-radio>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('checking one radio unchecks siblings in the same group', async () => {
    const host = mount<HTMLDivElement>(
      `<div>
        <foundry-radio name="fn-excl" value="a" data-testid="r-a"><span slot="label">A</span></foundry-radio>
        <foundry-radio name="fn-excl" value="b" data-testid="r-b"><span slot="label">B</span></foundry-radio>
      </div>`,
    );
    await raf();
    const a = host.querySelector('[data-testid="r-a"]') as FoundryRadio & { checked: boolean };
    const b = host.querySelector('[data-testid="r-b"]') as FoundryRadio & { checked: boolean };

    innerInput(a).click();
    innerInput(b).click();
    expect(a.checked).to.equal(false);
    expect(b.checked).to.equal(true);
  });

  it('clicking the slotted label toggles the radio (nested-label pattern)', async () => {
    const host = mount<HTMLDivElement>(
      `<div>
        <foundry-radio name="fn-label" value="x" data-testid="r-x">
          <span slot="label" data-testid="r-x-label">Click me</span>
        </foundry-radio>
      </div>`,
    );
    await raf();
    const radio = host.querySelector('[data-testid="r-x"]') as FoundryRadio;
    const label = host.querySelector('[data-testid="r-x-label"]') as HTMLSpanElement;

    label.click();
    expect(radio.hasAttribute('checked')).to.equal(true);
  });

  it('ArrowDown moves focus + checks the next radio (real browser keydown)', async () => {
    const host = mount<HTMLDivElement>(
      `<div>
        <foundry-radio name="fn-kbd" value="a" data-testid="ka"><span slot="label">A</span></foundry-radio>
        <foundry-radio name="fn-kbd" value="b" data-testid="kb"><span slot="label">B</span></foundry-radio>
        <foundry-radio name="fn-kbd" value="c" data-testid="kc"><span slot="label">C</span></foundry-radio>
      </div>`,
    );
    await raf();
    const a = host.querySelector('[data-testid="ka"]') as FoundryRadio;
    const b = host.querySelector('[data-testid="kb"]') as FoundryRadio;

    a.focus();
    innerInput(a).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
    );
    await raf();
    expect(b.hasAttribute('checked')).to.equal(true);
    expect(a.hasAttribute('checked')).to.equal(false);
  });

  it('roving tabindex: only the checked radio is in the tab order', async () => {
    const host = mount<HTMLDivElement>(
      `<div>
        <foundry-radio name="fn-rove" value="a" data-testid="ra"><span slot="label">A</span></foundry-radio>
        <foundry-radio name="fn-rove" value="b" checked data-testid="rb"><span slot="label">B</span></foundry-radio>
        <foundry-radio name="fn-rove" value="c" data-testid="rc"><span slot="label">C</span></foundry-radio>
      </div>`,
    );
    await raf();
    const a = host.querySelector('[data-testid="ra"]') as FoundryRadio;
    const b = host.querySelector('[data-testid="rb"]') as FoundryRadio;
    const c = host.querySelector('[data-testid="rc"]') as FoundryRadio;

    expect(innerInput(a).tabIndex).to.equal(-1);
    expect(innerInput(b).tabIndex).to.equal(0);
    expect(innerInput(c).tabIndex).to.equal(-1);
  });

  it('only the checked radio surfaces in FormData; siblings are omitted', async () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-radio name="plan" value="free"><span slot="label">Free</span></foundry-radio>
      <foundry-radio name="plan" value="pro"><span slot="label">Pro</span></foundry-radio>
      <foundry-radio name="plan" value="enterprise"><span slot="label">Enterprise</span></foundry-radio>
    `;
    document.body.appendChild(form);
    await raf();

    const radios = form.querySelectorAll('foundry-radio');
    const pro = radios[1] as FoundryRadio & { checked: boolean };
    pro.checked = true;
    await raf();

    expect(new FormData(form).get('plan')).to.equal('pro');

    form.remove();
  });

  it('formResetCallback clears the checked state', async () => {
    const form = document.createElement('form');
    // NOTE: the radio's `name` must NOT collide with any HTMLFormElement method
    // name — `<form>` exposes named controls as properties, so e.g. name="reset"
    // would shadow `form.reset()`. Using a safe token like `choice`.
    form.innerHTML = `
      <foundry-radio name="choice" value="a" checked><span slot="label">A</span></foundry-radio>
      <foundry-radio name="choice" value="b"><span slot="label">B</span></foundry-radio>
    `;
    document.body.appendChild(form);
    await raf();

    const a = form.querySelector('foundry-radio') as FoundryRadio & { checked: boolean };
    expect(a.checked).to.equal(true);
    expect(new FormData(form).get('choice')).to.equal('a');

    form.reset();
    await raf();
    expect(a.checked).to.equal(false);
    expect(new FormData(form).get('choice')).to.equal(null);

    form.remove();
  });

  it('focusing the host delegates to the inner input', async () => {
    const el = mount<FoundryRadio>(
      `<foundry-radio name="fn-focus"><span slot="label">F</span></foundry-radio>`,
    );
    await raf();
    el.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('INPUT');
  });
});
