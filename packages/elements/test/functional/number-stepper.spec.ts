import { expect } from '@open-wc/testing';
import { FoundryNumberStepper } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryNumberStepper.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerInput(host: HTMLElement): HTMLInputElement {
  const inp = host.shadowRoot?.querySelector('input[part="input"]');
  if (!(inp instanceof HTMLInputElement)) throw new Error('inner input missing');
  return inp;
}

describe('<foundry-number-stepper> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with label + helper in a valid state', async () => {
    const el = mount<FoundryNumberStepper>(`
      <foundry-number-stepper name="qty" min="0" max="100" value="1">
        <span slot="label">Quantity</span>
        <span slot="helper">Between 0 and 100.</span>
      </foundry-number-stepper>
    `);
    await raf();
    await expectA11y(el);
  });

  it('passes axe with invalid + error message wired via aria-errormessage', async () => {
    const el = mount<FoundryNumberStepper>(`
      <foundry-number-stepper name="qty" min="0" max="10" value="100">
        <span slot="label">Quantity</span>
        <span slot="error">Out of range.</span>
      </foundry-number-stepper>
    `);
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(true);
    expect(innerInput(el).getAttribute('aria-errormessage')).to.equal('err');
    await expectA11y(el);
  });

  it('Tab focus reaches the inner input; ArrowUp increments via keyboard', async () => {
    const el = mount<FoundryNumberStepper>(`
      <foundry-number-stepper name="qty" value="5" min="0" max="10">
        <span slot="label">Quantity</span>
      </foundry-number-stepper>
    `);
    await raf();
    const inp = innerInput(el);
    inp.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('INPUT');
    inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await raf();
    expect(el.getAttribute('value')).to.equal('6');
  });

  it('form submission round-trips the current value under the name key', async () => {
    const form = document.createElement('form');
    form.innerHTML = `
      <foundry-number-stepper name="qty" min="0" max="100" value="7"></foundry-number-stepper>
    `;
    document.body.appendChild(form);
    await raf();
    expect(new FormData(form).get('qty')).to.equal('7');
    form.remove();
  });
});
