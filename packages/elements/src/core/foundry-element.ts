import {
  type PropertyDescriptorMap,
  fromAttribute,
  resolveAttributeName,
  toAttribute,
} from './properties.ts';

const REGISTRATION = new WeakSet<typeof FoundryElement>();
const OBSERVED_ATTRIBUTES = new WeakMap<typeof FoundryElement, string[]>();
const ATTRIBUTE_TO_PROPERTY = new WeakMap<typeof FoundryElement, Map<string, string>>();

export abstract class FoundryElement extends HTMLElement {
  static properties: PropertyDescriptorMap = {};
  static styles?: CSSStyleSheet;
  static template?: HTMLTemplateElement;
  static delegatesFocus = false;

  static get observedAttributes(): string[] {
    FoundryElement.#ensureRegistered(this as unknown as typeof FoundryElement);
    return OBSERVED_ATTRIBUTES.get(this as unknown as typeof FoundryElement) ?? [];
  }

  #mounted = false;
  #updating = false;
  #values = new Map<string, unknown>();
  #refs: Record<string, Element> = Object.freeze({});

  protected get refs(): Readonly<Record<string, Element>> {
    return this.#refs;
  }

  constructor() {
    super();
    FoundryElement.#ensureRegistered(this.constructor as typeof FoundryElement);
  }

  connectedCallback(): void {
    if (!this.#mounted) {
      this.#mount();
      this.#mounted = true;
    }
    this.connected();
  }

  disconnectedCallback(): void {
    this.disconnected();
  }

  attributeChangedCallback(name: string, prev: string | null, next: string | null): void {
    if (this.#updating) return;
    if (prev === next) return;

    const ctor = this.constructor as typeof FoundryElement;
    const propertyName = ATTRIBUTE_TO_PROPERTY.get(ctor)?.get(name);
    if (propertyName) {
      const descriptor = ctor.properties[propertyName];
      if (descriptor) {
        const coerced = fromAttribute(next, descriptor.type);
        const previous = this.#values.get(propertyName);
        if (previous !== coerced) {
          this.#updating = true;
          this.#values.set(propertyName, coerced);
          this.#updating = false;
          this.propertyChanged(propertyName, previous, coerced);
        }
      }
    }

    this.attributeChanged(name, prev, next);
  }

  // Author-facing lifecycle hooks — no-op defaults, override in subclass.
  /* eslint-disable @typescript-eslint/no-empty-function */
  protected connected(): void {}
  protected disconnected(): void {}
  protected attributeChanged(_name: string, _prev: string | null, _next: string | null): void {}
  protected propertyChanged(_name: string, _prev: unknown, _next: unknown): void {}
  /* eslint-enable @typescript-eslint/no-empty-function */

  /**
   * Reads a declared property's current value, falling back to its descriptor
   * default when no value has been set yet. Safe to call from any subclass
   * lifecycle hook — including before the shadow root has mounted.
   */
  protected readProperty(name: string): unknown {
    if (this.#values.has(name)) return this.#values.get(name);
    const descriptor = (this.constructor as typeof FoundryElement).properties[name];
    return descriptor?.default;
  }

  #mount(): void {
    const ctor = this.constructor as typeof FoundryElement;
    const root = this.attachShadow({ mode: 'open', delegatesFocus: ctor.delegatesFocus });

    if (ctor.styles) {
      root.adoptedStyleSheets = [ctor.styles];
    }

    if (ctor.template) {
      root.appendChild(ctor.template.content.cloneNode(true));
      const refs: Record<string, Element> = {};
      for (const el of root.querySelectorAll<HTMLElement>('[data-ref]')) {
        const key = el.dataset['ref'];
        if (key) refs[key] = el;
      }
      this.#refs = Object.freeze(refs);
    }
  }

  #writeProperty(name: string, value: unknown): void {
    const ctor = this.constructor as typeof FoundryElement;
    const descriptor = ctor.properties[name];
    if (!descriptor) return;

    const previous = this.readProperty(name);
    const valueChanged = previous !== value;
    if (valueChanged) {
      this.#values.set(name, value);
    }

    if (descriptor.reflect && !this.#updating) {
      const attributeName = resolveAttributeName(name, descriptor);
      if (attributeName) {
        const attrValue = toAttribute(value, descriptor.type);
        const currentAttr = this.getAttribute(attributeName);
        const targetAttr = attrValue === false || attrValue === null ? null : attrValue;
        if (currentAttr !== targetAttr) {
          this.#updating = true;
          if (targetAttr === null) {
            this.removeAttribute(attributeName);
          } else {
            this.setAttribute(attributeName, targetAttr);
          }
          this.#updating = false;
        }
      }
    }

    if (valueChanged) {
      this.propertyChanged(name, previous, value);
    }
  }

  static #ensureRegistered(ctor: typeof FoundryElement): void {
    if (REGISTRATION.has(ctor)) return;
    REGISTRATION.add(ctor);

    const observed: string[] = [];
    const attributeMap = new Map<string, string>();

    for (const [name, descriptor] of Object.entries(ctor.properties)) {
      Object.defineProperty(ctor.prototype, name, {
        get(this: FoundryElement) {
          return this.readProperty(name);
        },
        set(this: FoundryElement, value: unknown) {
          this.#writeProperty(name, value);
        },
        configurable: true,
        enumerable: true,
      });

      const attributeName = resolveAttributeName(name, descriptor);
      if (attributeName !== null) {
        observed.push(attributeName);
        attributeMap.set(attributeName, name);
      }
    }

    OBSERVED_ATTRIBUTES.set(ctor, observed);
    ATTRIBUTE_TO_PROPERTY.set(ctor, attributeMap);
  }
}
