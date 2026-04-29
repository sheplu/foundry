import { expect } from '@open-wc/testing';
import { FoundryTextField } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryTextField.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerInput(host: HTMLElement): HTMLInputElement {
  const inp = host.shadowRoot?.querySelector('input');
  if (!inp) throw new Error('inner input missing');
  return inp;
}

describe('<foundry-text-field> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a label, no hint, no error', async () => {
    const el = mount<FoundryTextField>(
      `<foundry-text-field><span slot="label">Email</span></foundry-text-field>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe with a label and hint', async () => {
    const el = mount<FoundryTextField>(
      `<foundry-text-field>
        <span slot="label">Email</span>
        <span slot="hint">We never share it.</span>
      </foundry-text-field>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for a required + invalid state with error message', async () => {
    const el = mount<FoundryTextField>(
      `<foundry-text-field required>
        <span slot="label">Email</span>
        <span slot="error">This field is required.</span>
      </foundry-text-field>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for disabled state', async () => {
    const el = mount<FoundryTextField>(
      `<foundry-text-field disabled>
        <span slot="label">Can't touch this</span>
      </foundry-text-field>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('reflects invalid when required is empty and clears on valid input', async () => {
    const el = mount<FoundryTextField>(
      `<foundry-text-field required><span slot="label">X</span></foundry-text-field>`,
    );
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(true);

    const inp = innerInput(el);
    inp.value = 'filled';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.hasAttribute('invalid')).to.equal(false);
  });

  it('reflects invalid when a pattern constraint fails (real browser)', async () => {
    const el = mount<FoundryTextField>(
      `<foundry-text-field pattern="[0-9]+"><span slot="label">X</span></foundry-text-field>`,
    );
    await raf();
    const inp = innerInput(el);
    inp.value = 'abc';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.hasAttribute('invalid')).to.equal(true);
    expect(el.validity?.patternMismatch).to.equal(true);

    inp.value = '123';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.hasAttribute('invalid')).to.equal(false);
  });

  it('participates in form submission via ElementInternals.setFormValue', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.setAttribute('data-testid', 'tf-form');
    form.innerHTML = `<foundry-text-field name="email"><span slot="label">E</span></foundry-text-field>`;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-text-field') as FoundryTextField;
    const inp = innerInput(el);
    inp.focus();
    inp.value = 'ada@example.com';
    inp.dispatchEvent(new Event('input', { bubbles: true }));

    const data = new FormData(form);
    expect(data.get('email')).to.equal('ada@example.com');
    expect(el.form).to.equal(form);

    form.remove();
  });

  it('formResetCallback clears the value on form reset', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.innerHTML = `<foundry-text-field name="x"><span slot="label">X</span></foundry-text-field>`;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-text-field') as FoundryTextField & { value: string };
    const inp = innerInput(el);
    inp.focus();
    inp.value = 'seeded';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    expect(new FormData(form).get('x')).to.equal('seeded');

    form.reset();
    await raf();
    expect(el.value).to.equal('');
    expect(new FormData(form).get('x')).to.equal('');

    form.remove();
  });

  it('focusing the host delegates to the inner input', async () => {
    const el = mount<FoundryTextField>(
      `<foundry-text-field><span slot="label">F</span></foundry-text-field>`,
    );
    await raf();
    el.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('INPUT');
  });
});
