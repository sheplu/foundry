import { afterEach, describe, expect, it, vi } from 'vitest';
import { FoundryElement } from './foundry-element.ts';
import { createStylesheet } from './stylesheet.ts';
import { createTemplate } from './template.ts';

let counter = 0;

function unique(tag: string): string {
  return `${tag}-${++counter}`;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('FoundryElement mount', () => {
  it('attaches an open shadow root on connect', () => {
    class Plain extends FoundryElement {}
    const tag = unique('fe-plain');
    customElements.define(tag, Plain);

    const el = document.createElement(tag) as Plain;
    document.body.appendChild(el);

    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot?.mode).toBe('open');
  });

  it('does not delegate focus by default', () => {
    class NoDelegate extends FoundryElement {}
    const tag = unique('fe-no-delegate');
    customElements.define(tag, NoDelegate);

    const el = document.createElement(tag) as NoDelegate;
    const spy = vi.spyOn(el, 'attachShadow');
    document.body.appendChild(el);

    expect(spy).toHaveBeenCalledWith({ mode: 'open', delegatesFocus: false });
  });

  it('delegates focus when the subclass opts in via static delegatesFocus', () => {
    class DelegateFocus extends FoundryElement {
      static override delegatesFocus = true;
    }
    const tag = unique('fe-delegate');
    customElements.define(tag, DelegateFocus);

    const el = document.createElement(tag) as DelegateFocus;
    const spy = vi.spyOn(el, 'attachShadow');
    document.body.appendChild(el);

    expect(spy).toHaveBeenCalledWith({ mode: 'open', delegatesFocus: true });
  });

  it('mounts without error when no template or styles are set', () => {
    class Bare extends FoundryElement {}
    const tag = unique('fe-bare');
    customElements.define(tag, Bare);

    const el = document.createElement(tag) as Bare;
    expect(() => document.body.appendChild(el)).not.toThrow();
  });

  it('adopts the static stylesheet when provided', () => {
    class Styled extends FoundryElement {
      static override styles = createStylesheet(':host { color: red; }');
    }
    const tag = unique('fe-styled');
    customElements.define(tag, Styled);

    const el = document.createElement(tag) as Styled;
    document.body.appendChild(el);

    expect(el.shadowRoot?.adoptedStyleSheets.length).toBe(1);
    expect(el.shadowRoot?.adoptedStyleSheets[0]).toBe(Styled.styles);
  });

  it('does not adopt any stylesheet when styles are not set', () => {
    class NoStyles extends FoundryElement {}
    const tag = unique('fe-no-styles');
    customElements.define(tag, NoStyles);

    const el = document.createElement(tag) as NoStyles;
    document.body.appendChild(el);

    expect(el.shadowRoot?.adoptedStyleSheets?.length ?? 0).toBe(0);
  });

  it('clones the template into the shadow root', () => {
    class Templated extends FoundryElement {
      static override template = createTemplate('<button data-ref="btn">Hello</button>');
    }
    const tag = unique('fe-templated');
    customElements.define(tag, Templated);

    const el = document.createElement(tag) as Templated;
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelector('button')?.textContent).toBe('Hello');
  });

  it('populates frozen refs from elements marked data-ref', () => {
    class Refs extends FoundryElement {
      static override template = createTemplate(
        '<span data-ref="label">A</span><span data-ref="value">B</span>',
      );
    }
    const tag = unique('fe-refs');
    customElements.define(tag, Refs);

    const el = document.createElement(tag) as Refs & { refs: Record<string, Element> };
    document.body.appendChild(el);

    expect(el.refs['label']?.textContent).toBe('A');
    expect(el.refs['value']?.textContent).toBe('B');
    expect(Object.isFrozen(el.refs)).toBe(true);
  });

  it('re-connecting is idempotent (template cloned once)', () => {
    class Once extends FoundryElement {
      static override template = createTemplate('<p data-ref="p">hi</p>');
    }
    const tag = unique('fe-once');
    customElements.define(tag, Once);

    const el = document.createElement(tag) as Once;
    document.body.appendChild(el);
    el.remove();
    document.body.appendChild(el);

    expect(el.shadowRoot?.querySelectorAll('p')).toHaveLength(1);
  });
});

describe('FoundryElement lifecycle hooks', () => {
  it('fires connected/disconnected in order', () => {
    const events: string[] = [];
    class Hooked extends FoundryElement {
      override connected() { events.push('c'); }
      override disconnected() { events.push('d'); }
    }
    const tag = unique('fe-hooked');
    customElements.define(tag, Hooked);

    const el = document.createElement(tag) as Hooked;
    document.body.appendChild(el);
    el.remove();
    document.body.appendChild(el);

    expect(events).toEqual(['c', 'd', 'c']);
  });
});

describe('FoundryElement reflection', () => {
  it('reads default values before first set', () => {
    class WithDefault extends FoundryElement {
      static override properties = {
        variant: { type: String, default: 'primary' },
      };
    }
    const tag = unique('fe-default');
    customElements.define(tag, WithDefault);
    const el = document.createElement(tag) as WithDefault & { variant: string };

    expect(el.variant).toBe('primary');
  });

  it('triggers propertyChanged once with prev/next', () => {
    const spy = vi.fn();
    class Reflected extends FoundryElement {
      static override properties = {
        label: { type: String, default: 'a' },
      };

      override propertyChanged(name: string, prev: unknown, next: unknown) {
        spy(name, prev, next);
      }
    }
    const tag = unique('fe-changed');
    customElements.define(tag, Reflected);
    const el = document.createElement(tag) as Reflected & { label: string };
    document.body.appendChild(el);

    el.label = 'b';
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('label', 'a', 'b');
  });

  it('does not fire propertyChanged when the value is unchanged', () => {
    const spy = vi.fn();
    class Same extends FoundryElement {
      static override properties = {
        count: { type: Number, default: 1 },
      };

      override propertyChanged() { spy(); }
    }
    const tag = unique('fe-same');
    customElements.define(tag, Same);
    const el = document.createElement(tag) as Same & { count: number };
    document.body.appendChild(el);

    el.count = 1;
    expect(spy).not.toHaveBeenCalled();
  });

  it('reflects the property to the attribute when reflect: true', () => {
    class Reflect_ extends FoundryElement {
      static override properties = {
        open: { type: Boolean, reflect: true },
        label: { type: String, reflect: true },
      };
    }
    const tag = unique('fe-reflect');
    customElements.define(tag, Reflect_);
    const el = document.createElement(tag) as Reflect_ & { open: boolean; label: string };
    document.body.appendChild(el);

    el.open = true;
    expect(el.hasAttribute('open')).toBe(true);
    el.open = false;
    expect(el.hasAttribute('open')).toBe(false);

    el.label = 'hello';
    expect(el.getAttribute('label')).toBe('hello');
    el.label = null as unknown as string;
    expect(el.hasAttribute('label')).toBe(false);
  });

  it('does not reflect when reflect is not set', () => {
    class NoReflect extends FoundryElement {
      static override properties = {
        label: { type: String },
      };
    }
    const tag = unique('fe-no-reflect');
    customElements.define(tag, NoReflect);
    const el = document.createElement(tag) as NoReflect & { label: string };
    document.body.appendChild(el);

    el.label = 'hello';
    expect(el.hasAttribute('label')).toBe(false);
  });

  it('updates property when attribute changes', () => {
    const spy = vi.fn();
    class AttrDriven extends FoundryElement {
      static override properties = {
        size: { type: Number },
      };

      override propertyChanged(name: string, prev: unknown, next: unknown) {
        spy(name, prev, next);
      }
    }
    const tag = unique('fe-attr');
    customElements.define(tag, AttrDriven);
    const el = document.createElement(tag) as AttrDriven & { size: number };
    document.body.appendChild(el);

    el.setAttribute('size', '5');
    expect(el.size).toBe(5);
    expect(spy).toHaveBeenCalledWith('size', undefined, 5);
  });

  it('maps explicit attribute name', () => {
    class CustomAttr extends FoundryElement {
      static override properties = {
        variant: { type: String, attribute: 'kind', reflect: true },
      };
    }
    const tag = unique('fe-custom-attr');
    customElements.define(tag, CustomAttr);

    expect(CustomAttr.observedAttributes).toContain('kind');
    expect(CustomAttr.observedAttributes).not.toContain('variant');

    const el = document.createElement(tag) as CustomAttr & { variant: string };
    document.body.appendChild(el);

    el.variant = 'alt';
    expect(el.getAttribute('kind')).toBe('alt');
    expect(el.hasAttribute('variant')).toBe(false);
  });

  it('omits attribute when attribute: false', () => {
    class Internal extends FoundryElement {
      static override properties = {
        state: { type: String, attribute: false },
      };
    }
    const tag = unique('fe-internal');
    customElements.define(tag, Internal);

    expect(Internal.observedAttributes).toEqual([]);
  });

  it('does not loop when attribute and property updates chain', () => {
    const spy = vi.fn();
    class Chain extends FoundryElement {
      static override properties = {
        open: { type: Boolean, reflect: true },
      };

      override propertyChanged() { spy(); }
    }
    const tag = unique('fe-chain');
    customElements.define(tag, Chain);
    const el = document.createElement(tag) as Chain & { open: boolean };
    document.body.appendChild(el);

    el.open = true;
    el.open = false;
    el.setAttribute('open', '');

    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('skips work when attributeChangedCallback is called with unchanged value', () => {
    const spy = vi.fn();
    class Noop extends FoundryElement {
      static override properties = {
        label: { type: String },
      };

      override propertyChanged() { spy(); }
    }
    const tag = unique('fe-noop-attr');
    customElements.define(tag, Noop);
    const el = document.createElement(tag) as Noop;
    document.body.appendChild(el);

    el.setAttribute('label', 'same');
    el.setAttribute('label', 'same');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ignores empty data-ref attributes', () => {
    class EmptyRef extends FoundryElement {
      static override template = createTemplate('<span data-ref="">x</span><span data-ref="y">Y</span>');
    }
    const tag = unique('fe-empty-ref');
    customElements.define(tag, EmptyRef);

    const el = document.createElement(tag) as EmptyRef & { refs: Record<string, Element> };
    document.body.appendChild(el);

    expect(Object.keys(el.refs)).toEqual(['y']);
  });

  it('does not reflect when attribute is disabled even if reflect: true', () => {
    class Hidden extends FoundryElement {
      static override properties = {
        state: { type: String, reflect: true, attribute: false },
      };
    }
    const tag = unique('fe-hidden-reflect');
    customElements.define(tag, Hidden);

    const el = document.createElement(tag) as Hidden & { state: string };
    document.body.appendChild(el);

    el.state = 'active';
    expect(el.hasAttributes()).toBe(false);
  });

  it('calls attributeChanged hook', () => {
    const spy = vi.fn();
    class Hook extends FoundryElement {
      static override properties = {
        label: { type: String },
      };

      override attributeChanged(name: string, prev: string | null, next: string | null) {
        spy(name, prev, next);
      }
    }
    const tag = unique('fe-attr-hook');
    customElements.define(tag, Hook);
    const el = document.createElement(tag) as Hook;
    document.body.appendChild(el);

    el.setAttribute('label', 'x');
    expect(spy).toHaveBeenCalledWith('label', null, 'x');
  });
});
