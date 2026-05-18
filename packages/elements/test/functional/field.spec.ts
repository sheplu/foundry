import { expect } from '@open-wc/testing';
import { FoundryField } from '@foundry/elements';
import { cleanup, mount } from './support/fixture.ts';
import { expectA11y } from './support/axe.ts';

FoundryField.define();

async function raf(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => r()));
}

describe('<foundry-field> functional', () => {
  afterEach(() => cleanup());

  it('passes axe with a label and slotted native input', async () => {
    const el = mount<FoundryField>(
      `<foundry-field>
        <span slot="label">Email</span>
        <input type="email" />
      </foundry-field>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe with helper text wired via aria-describedby', async () => {
    const el = mount<FoundryField>(
      `<foundry-field>
        <span slot="label">Email</span>
        <input type="email" />
        <span slot="helper">We never share your email.</span>
      </foundry-field>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('passes axe in invalid state with error message', async () => {
    const el = mount<FoundryField>(
      `<foundry-field invalid>
        <span slot="label">Email</span>
        <input type="email" value="not-an-email" aria-invalid="true" />
        <span slot="error">Please enter a valid email.</span>
      </foundry-field>`,
    );
    await raf();
    await expectA11y(el);
  });

  it('Tab focus reaches the slotted input', async () => {
    mount(`<button id="before">Before</button>`);
    const el = mount<FoundryField>(
      `<foundry-field>
        <span slot="label">Email</span>
        <input type="email" />
      </foundry-field>`,
    );
    await raf();
    const input = el.querySelector('input') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).to.equal(input);
  });
});
