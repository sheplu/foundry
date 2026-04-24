import { describe, expect, it } from 'vitest';
import {
  fromAttribute,
  resolveAttributeName,
  toAttribute,
  toAttributeName,
} from './properties';

describe('toAttributeName', () => {
  it('lowercases single-word property names', () => {
    expect(toAttributeName('open')).toBe('open');
  });

  it('kebab-cases camelCase property names', () => {
    expect(toAttributeName('openState')).toBe('open-state');
    expect(toAttributeName('ariaLabelledBy')).toBe('aria-labelled-by');
  });
});

describe('resolveAttributeName', () => {
  it('returns the kebab-cased property name by default', () => {
    expect(resolveAttributeName('openState', { type: Boolean })).toBe('open-state');
  });

  it('returns the explicit attribute when provided', () => {
    expect(resolveAttributeName('variant', { type: String, attribute: 'kind' })).toBe('kind');
  });

  it('returns null when attribute reflection is disabled', () => {
    expect(resolveAttributeName('internal', { type: String, attribute: false })).toBeNull();
  });
});

describe('fromAttribute', () => {
  it('coerces boolean presence', () => {
    expect(fromAttribute('', Boolean)).toBe(true);
    expect(fromAttribute('false', Boolean)).toBe(true);
    expect(fromAttribute(null, Boolean)).toBe(false);
  });

  it('returns null for null non-boolean values', () => {
    expect(fromAttribute(null, String)).toBeNull();
    expect(fromAttribute(null, Number)).toBeNull();
    expect(fromAttribute(null, Array)).toBeNull();
  });

  it('passes through strings', () => {
    expect(fromAttribute('hello', String)).toBe('hello');
    expect(fromAttribute('', String)).toBe('');
  });

  it('parses numbers and rejects NaN', () => {
    expect(fromAttribute('42', Number)).toBe(42);
    expect(fromAttribute('3.14', Number)).toBe(3.14);
    expect(fromAttribute('abc', Number)).toBeNull();
  });

  it('JSON-parses arrays and objects', () => {
    expect(fromAttribute('[1,2]', Array)).toEqual([1, 2]);
    expect(fromAttribute('{"a":1}', Object)).toEqual({ a: 1 });
  });

  it('returns null for malformed JSON', () => {
    expect(fromAttribute('not json', Array)).toBeNull();
    expect(fromAttribute('{broken', Object)).toBeNull();
  });
});

describe('toAttribute', () => {
  it('returns empty string for truthy booleans, false for falsy', () => {
    expect(toAttribute(true, Boolean)).toBe('');
    expect(toAttribute(false, Boolean)).toBe(false);
  });

  it('returns null for null/undefined non-boolean values', () => {
    expect(toAttribute(null, String)).toBeNull();
    expect(toAttribute(undefined, Number)).toBeNull();
  });

  it('stringifies primitives', () => {
    expect(toAttribute('hi', String)).toBe('hi');
    expect(toAttribute(42, Number)).toBe('42');
  });

  it('JSON-stringifies arrays and objects', () => {
    expect(toAttribute([1, 2], Array)).toBe('[1,2]');
    expect(toAttribute({ a: 1 }, Object)).toBe('{"a":1}');
  });
});
