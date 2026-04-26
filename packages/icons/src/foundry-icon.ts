import { FoundryElement, createStylesheet, createTemplate } from '@foundry/elements';
import templateHtml from './foundry-icon.template.html?raw';
import styleCss from './foundry-icon.css?inline';
import type { IconSvg } from './icons.ts';

const template = createTemplate(templateHtml);
const styles = createStylesheet(styleCss);

/**
 * Renders a registered SVG icon from `@foundry/icons`. Icons are registered
 * once at application startup via `FoundryIcon.register(...)`, then referenced
 * by `name`. Sizes from `--foundry-icon-size` (defaults `1em`), inherits `color`
 * from the surrounding context.
 *
 * @element foundry-icon
 * @summary Registered SVG icon element.
 *
 * @attr {string} name - Name of a registered icon.
 * @attr {string} label - Accessible label. When set, the icon announces as
 *   `role="img"` with the given label; otherwise the icon is decorative
 *   (`aria-hidden="true"`).
 *
 * @csspart inner - The inner container that receives the rendered SVG.
 *
 * @cssprop [--foundry-icon-size=1em] - Width and height of the icon.
 */
export class FoundryIcon extends FoundryElement {
  static registry = new Map<string, IconSvg>();

  static register(icons: Readonly<Record<string, IconSvg>>): void {
    for (const [name, svg] of Object.entries(icons)) {
      FoundryIcon.registry.set(name, svg);
    }
  }

  static override properties = {
    name: { type: String, reflect: true },
    label: { type: String, reflect: true },
  };

  static override template = template;
  static override styles = styles;

  static define(tag = 'foundry-icon'): void {
    if (!customElements.get(tag)) {
      customElements.define(tag, FoundryIcon);
    }
  }

  override connected(): void {
    this.#render();
  }

  override propertyChanged(name: string): void {
    if (name === 'name' || name === 'label') {
      this.#render();
    }
  }

  #render(): void {
    const inner = this.refs['inner'] as HTMLSpanElement | undefined;
    if (!inner) return;

    const iconName = this.readProperty('name') as string | undefined;
    const svg = iconName ? FoundryIcon.registry.get(iconName) : undefined;

    // Scoped innerHTML on a private shadow-DOM ref. Input is always a
    // source-controlled SVG string from our registry — never user input.
    inner.innerHTML = svg ?? '';

    const label = this.readProperty('label') as string | undefined;
    if (label) {
      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', label);
      this.removeAttribute('aria-hidden');
    } else {
      this.removeAttribute('role');
      this.removeAttribute('aria-label');
      this.setAttribute('aria-hidden', 'true');
    }
  }
}
