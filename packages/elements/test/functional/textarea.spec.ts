import { expect } from '@open-wc/testing';
import { FoundryTextarea } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryTextarea.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

function innerTextarea(host: HTMLElement): HTMLTextAreaElement {
  const ta = host.shadowRoot?.querySelector('textarea');
  if (!ta) throw new Error('inner textarea missing');
  return ta;
}

describe('<foundry-textarea> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a label, no hint, no error', async () => {
    const el = mount<FoundryTextarea>(
      `<foundry-textarea><span slot="label">Bio</span></foundry-textarea>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe with a label and hint', async () => {
    const el = mount<FoundryTextarea>(
      `<foundry-textarea>
        <span slot="label">Bio</span>
        <span slot="hint">Up to 500 characters.</span>
      </foundry-textarea>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for a required + invalid state with error message', async () => {
    const el = mount<FoundryTextarea>(
      `<foundry-textarea required>
        <span slot="label">Bio</span>
        <span slot="error">This field is required.</span>
      </foundry-textarea>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe for disabled state', async () => {
    const el = mount<FoundryTextarea>(
      `<foundry-textarea disabled>
        <span slot="label">Can't touch this</span>
      </foundry-textarea>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('reflects invalid when required is empty and clears on valid input', async () => {
    const el = mount<FoundryTextarea>(
      `<foundry-textarea required><span slot="label">X</span></foundry-textarea>`,
    );
    await raf();
    expect(el.hasAttribute('invalid')).to.equal(true);

    const ta = innerTextarea(el);
    ta.value = 'filled';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.hasAttribute('invalid')).to.equal(false);
  });

  it('participates in form submission via ElementInternals.setFormValue', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.setAttribute('data-testid', 'ta-form');
    form.innerHTML = `<foundry-textarea name="bio"><span slot="label">B</span></foundry-textarea>`;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-textarea') as FoundryTextarea;
    const ta = innerTextarea(el);
    ta.focus();
    ta.value = 'Multi-line\nbio content.';
    ta.dispatchEvent(new Event('input', { bubbles: true }));

    const data = new FormData(form);
    expect(data.get('bio')).to.equal('Multi-line\nbio content.');
    expect(el.form).to.equal(form);

    form.remove();
  });

  it('formResetCallback clears the value on form reset', async () => {
    const host = document.body;
    const form = document.createElement('form');
    form.innerHTML = `<foundry-textarea name="x"><span slot="label">X</span></foundry-textarea>`;
    host.appendChild(form);
    await raf();

    const el = form.querySelector('foundry-textarea') as FoundryTextarea & { value: string };
    const ta = innerTextarea(el);
    ta.focus();
    ta.value = 'seeded';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    expect(new FormData(form).get('x')).to.equal('seeded');

    form.reset();
    await raf();
    expect(el.value).to.equal('');
    expect(new FormData(form).get('x')).to.equal('');

    form.remove();
  });

  it('focusing the host delegates to the inner textarea', async () => {
    const el = mount<FoundryTextarea>(
      `<foundry-textarea><span slot="label">F</span></foundry-textarea>`,
    );
    await raf();
    el.focus();
    expect(el.shadowRoot?.activeElement?.tagName).to.equal('TEXTAREA');
  });

  it('forwards rows attribute to the inner textarea', async () => {
    const el = mount<FoundryTextarea>(
      `<foundry-textarea rows="7"><span slot="label">Rows</span></foundry-textarea>`,
    );
    await raf();
    expect(innerTextarea(el).rows).to.equal(7);
  });
});
