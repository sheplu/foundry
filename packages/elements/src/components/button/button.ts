import { FoundryElement } from '../../core/foundry-element.ts';
import { createStylesheet } from '../../core/stylesheet.ts';
import { createTemplate } from '../../core/template.ts';
import templateHtml from './button.template.html?raw';
import styleCss from './button.css?inline';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonType = 'button' | 'submit' | 'reset';

export class FoundryButton extends FoundryElement {
  static override properties = {
    variant: { type: String, reflect: true, default: 'primary' satisfies ButtonVariant },
    disabled: { type: Boolean, reflect: true, default: false },
    type: { type: String, reflect: true, default: 'button' satisfies ButtonType },
  };

  static override template = createTemplate(templateHtml);
  static override styles = createStylesheet(styleCss);
  static override delegatesFocus = true;

  static define(tag = 'foundry-button'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryButton);
    }
  }

  override connected(): void {
    this.#syncInner();
  }

  override propertyChanged(name: string): void {
    if (name === 'disabled' || name === 'type') {
      this.#syncInner();
    }
  }

  #syncInner(): void {
    const inner = this.refs['inner'] as HTMLButtonElement;
    inner.disabled = Boolean(this._getProperty('disabled'));
    inner.type = this._getProperty('type') as ButtonType;
  }
}
