import { describe, expect, it } from 'vitest';
import {
  addStep,
  clamp,
  decimalsOf,
  formatNumber,
  isOnGrid,
  parseNumber,
  roundTo,
  snapToGrid,
} from './number-stepper.utils.ts';

describe('parseNumber', () => {
  it('accepts plain integers and decimals', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber('3.5')).toBe(3.5);
    expect(parseNumber('0')).toBe(0);
  });

  it('accepts signed numbers', () => {
    expect(parseNumber('-3.5')).toBe(-3.5);
    expect(parseNumber('+1')).toBe(1);
  });

  it('accepts scientific notation', () => {
    expect(parseNumber('1e2')).toBe(100);
    expect(parseNumber('1.5e-2')).toBe(0.015);
  });

  it('trims surrounding whitespace', () => {
    expect(parseNumber('  7 ')).toBe(7);
    expect(parseNumber('\t-1.2\n')).toBe(-1.2);
  });

  it('rejects empty / whitespace-only input', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
  });

  it('rejects non-numeric strings', () => {
    expect(parseNumber('foo')).toBeNull();
    expect(parseNumber('1.2.3')).toBeNull();
    expect(parseNumber('NaN')).toBeNull();
    expect(parseNumber('Infinity')).toBeNull();
  });
});

describe('decimalsOf', () => {
  it('returns 0 for whole numbers', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(100)).toBe(0);
    expect(decimalsOf(0)).toBe(0);
  });

  it('returns the number of decimal digits', () => {
    expect(decimalsOf(0.1)).toBe(1);
    expect(decimalsOf(0.01)).toBe(2);
    expect(decimalsOf(0.001)).toBe(3);
    expect(decimalsOf(2.5)).toBe(1);
  });

  it('handles scientific notation', () => {
    expect(decimalsOf(1e-4)).toBe(4);
    expect(decimalsOf(1.5e-3)).toBe(4);
  });

  it('handles values that stringify to exponential form', () => {
    // Numbers < 1e-6 stringify with `e-` notation (e.g. (1e-7).toString() === '1e-7').
    expect(decimalsOf(1e-7)).toBe(7);
    expect(decimalsOf(1.5e-7)).toBe(8);
  });

  it('handles non-finite values defensively', () => {
    expect(decimalsOf(Number.POSITIVE_INFINITY)).toBe(0);
    expect(decimalsOf(Number.NaN)).toBe(0);
  });
});

describe('roundTo', () => {
  it('rounds the canonical 0.1 + 0.2 case', () => {
    expect(roundTo(0.1 + 0.2, 1)).toBe(0.3);
  });

  it('rounds half away from zero', () => {
    expect(roundTo(2.5, 0)).toBe(3);
    expect(roundTo(-2.5, 0)).toBe(-2);
  });

  it('returns the value unchanged when finite without precision loss', () => {
    expect(roundTo(1, 5)).toBe(1);
    expect(roundTo(0.5, 1)).toBe(0.5);
  });

  it('coerces -0 results back to 0', () => {
    expect(Object.is(roundTo(-0, 2), 0)).toBe(true);
  });

  it('passes through non-finite values', () => {
    expect(roundTo(Number.POSITIVE_INFINITY, 2)).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(roundTo(Number.NaN, 2))).toBe(true);
  });
});

describe('addStep', () => {
  it('handles 0.1 + 0.2 cleanly', () => {
    expect(addStep(0.1, 0.2, 1)).toBe(0.3);
  });

  it('handles cumulative-error cases', () => {
    expect(addStep(1.005, 0.01, 1)).toBe(1.015);
  });

  it('subtracts when sign is -1', () => {
    expect(addStep(0.3, 0.1, -1)).toBe(0.2);
  });

  it('preserves the larger of value/step decimal precision', () => {
    expect(addStep(1.234, 0.1, 1)).toBe(1.334);
  });

  it('handles integer steps without spurious decimals', () => {
    expect(addStep(5, 1, 1)).toBe(6);
    expect(addStep(5, 1, -1)).toBe(4);
  });
});

describe('clamp', () => {
  it('returns the value when in range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when below', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('returns max when above', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('endpoints are inclusive', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('treats Infinity bounds as unbounded', () => {
    expect(clamp(99, -Infinity, Infinity)).toBe(99);
    expect(clamp(-99, -Infinity, Infinity)).toBe(-99);
  });
});

describe('snapToGrid', () => {
  it('snaps to nearest step relative to anchor 0', () => {
    expect(snapToGrid(2.7, 0, 0.5)).toBe(2.5);
    expect(snapToGrid(2.8, 0, 0.5)).toBe(3);
  });

  it('snaps relative to a non-zero finite min', () => {
    expect(snapToGrid(2.7, 0.1, 0.5)).toBe(2.6);
  });

  it('uses 0 as anchor when min is -Infinity', () => {
    expect(snapToGrid(2.7, -Infinity, 0.5)).toBe(2.5);
  });

  it('returns the value unchanged when step is 0 or negative', () => {
    expect(snapToGrid(2.7, 0, 0)).toBe(2.7);
    expect(snapToGrid(2.7, 0, -1)).toBe(2.7);
  });

  it('rounds the result to step precision (avoids float drift)', () => {
    expect(snapToGrid(0.1 + 0.2, 0, 0.1)).toBe(0.3);
  });
});

describe('isOnGrid', () => {
  it('returns true for integer multiples', () => {
    expect(isOnGrid(2, 0, 1)).toBe(true);
    expect(isOnGrid(2.5, 0, 0.5)).toBe(true);
  });

  it('survives the 0.1+0.1+0.1 ≠ 0.3 float trap', () => {
    expect(isOnGrid(0.1 + 0.1 + 0.1, 0, 0.1)).toBe(true);
  });

  it('returns false for off-grid values', () => {
    expect(isOnGrid(0.35, 0, 0.1)).toBe(false);
    expect(isOnGrid(2.7, 0, 0.5)).toBe(false);
  });

  it('respects an offset min', () => {
    expect(isOnGrid(2.6, 0.1, 0.5)).toBe(true);
    expect(isOnGrid(2.7, 0.1, 0.5)).toBe(false);
  });

  it('returns true when step is zero or negative', () => {
    expect(isOnGrid(2.7, 0, 0)).toBe(true);
    expect(isOnGrid(2.7, 0, -1)).toBe(true);
  });
});

describe('formatNumber', () => {
  it('forces step-decimal precision', () => {
    expect(formatNumber(3, 0.1)).toBe('3.0');
    expect(formatNumber(3, 0.01)).toBe('3.00');
  });

  it('rounds the canonical 0.1 + 0.2', () => {
    expect(formatNumber(0.1 + 0.2, 0.1)).toBe('0.3');
  });

  it('produces an integer string when step is whole', () => {
    expect(formatNumber(42, 1)).toBe('42');
  });

  it('returns empty string for non-finite input', () => {
    expect(formatNumber(Number.POSITIVE_INFINITY, 1)).toBe('');
    expect(formatNumber(Number.NaN, 1)).toBe('');
  });
});
