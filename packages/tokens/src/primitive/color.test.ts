import { describe, expect, it } from 'vitest';
import { blue, gray, green, red, yellow } from './color.ts';

const hex = /^#[0-9a-f]{6}$/;

describe('primitive color', () => {
  it('gray ramp has 10 steps (50 + 100..900)', () => {
    expect(Object.keys(gray)).toEqual(['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']);
  });

  it('blue ramp covers 100..900', () => {
    expect(Object.keys(blue)).toEqual(['100', '200', '300', '400', '500', '600', '700', '800', '900']);
  });

  it('red ramp covers 100..900', () => {
    expect(Object.keys(red)).toEqual(['100', '200', '300', '400', '500', '600', '700', '800', '900']);
  });

  it('green ramp covers 100..900', () => {
    expect(Object.keys(green)).toEqual(['100', '200', '300', '400', '500', '600', '700', '800', '900']);
  });

  it('yellow ramp covers 100..900', () => {
    expect(Object.keys(yellow)).toEqual(['100', '200', '300', '400', '500', '600', '700', '800', '900']);
  });

  it('all values are 6-digit lowercase hex', () => {
    const all = [
      ...Object.values(gray),
      ...Object.values(blue),
      ...Object.values(red),
      ...Object.values(green),
      ...Object.values(yellow),
    ];
    for (const value of all) {
      expect(value).toMatch(hex);
    }
  });
});
