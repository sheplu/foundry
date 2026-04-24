export type PropertyTypeConstructor
  = | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ArrayConstructor
    | ObjectConstructor;

export interface PropertyDescriptor<T = unknown> {
  type: PropertyTypeConstructor;
  attribute?: string | boolean;
  reflect?: boolean;
  default?: T;
}

export type PropertyDescriptorMap = Record<string, PropertyDescriptor>;

export function toAttributeName(propertyName: string): string {
  return propertyName.replace(/([A-Z])/g, '-$1').toLowerCase();
}

export function resolveAttributeName(
  propertyName: string,
  descriptor: PropertyDescriptor,
): string | null {
  if (descriptor.attribute === false) return null;
  if (typeof descriptor.attribute === 'string') return descriptor.attribute;
  return toAttributeName(propertyName);
}

export function fromAttribute(
  value: string | null,
  type: PropertyTypeConstructor,
): unknown {
  if (type === Boolean) return value !== null;
  if (value === null) return null;
  if (type === Number) {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  if (type === Array || type === Object) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

export function toAttribute(
  value: unknown,
  type: PropertyTypeConstructor,
): string | null | false {
  if (type === Boolean) return value ? '' : false;
  if (value === null || value === undefined) return null;
  if (type === Array || type === Object) return JSON.stringify(value);
  return String(value);
}
