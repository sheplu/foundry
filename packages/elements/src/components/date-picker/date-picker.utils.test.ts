import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  clampDate,
  detectLocale,
  formatISO,
  formatMonthYear,
  formatWeekdays,
  getMonthGrid,
  getWeekStart,
  isInRange,
  isSameDay,
  parseISO,
} from './date-picker.utils.ts';

describe('parseISO', () => {
  it('parses a valid YYYY-MM-DD string', () => {
    const d = parseISO('2026-05-19');
    if (!d) throw new Error('expected non-null');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(19);
  });

  it('rejects strings with single-digit components', () => {
    expect(parseISO('2026-5-19')).toBeNull();
    expect(parseISO('2026-05-9')).toBeNull();
  });

  it('rejects non-ISO separators', () => {
    expect(parseISO('2026/05/19')).toBeNull();
    expect(parseISO('05-19-2026')).toBeNull();
  });

  it('rejects empty / non-date strings', () => {
    expect(parseISO('')).toBeNull();
    expect(parseISO('foo')).toBeNull();
    expect(parseISO('2026-05-19T12:00:00')).toBeNull();
  });

  it('rejects non-existent calendar dates', () => {
    expect(parseISO('2026-02-30')).toBeNull();
    expect(parseISO('2026-13-01')).toBeNull();
    expect(parseISO('2026-00-15')).toBeNull();
    expect(parseISO('2026-04-31')).toBeNull();
  });

  it('accepts Feb 29 in a leap year and rejects in a non-leap year', () => {
    expect(parseISO('2024-02-29')).not.toBeNull();
    expect(parseISO('2025-02-29')).toBeNull();
  });
});

describe('formatISO', () => {
  it('zero-pads month and day', () => {
    expect(formatISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatISO(new Date(2026, 9, 31))).toBe('2026-10-31');
  });

  it('round-trips with parseISO', () => {
    const iso = '2026-05-19';
    const parsed = parseISO(iso);
    if (!parsed) throw new Error('expected non-null');
    expect(formatISO(parsed)).toBe(iso);
  });
});

describe('addDays', () => {
  it('adds days and rolls over month boundaries', () => {
    expect(formatISO(addDays(new Date(2026, 0, 30), 5))).toBe('2026-02-04');
  });

  it('rolls over year boundaries', () => {
    expect(formatISO(addDays(new Date(2026, 11, 30), 5))).toBe('2027-01-04');
  });

  it('subtracts when n is negative', () => {
    expect(formatISO(addDays(new Date(2026, 0, 5), -10))).toBe('2025-12-26');
  });
});

describe('addMonths', () => {
  it('adds whole months', () => {
    expect(formatISO(addMonths(new Date(2026, 4, 19), 1))).toBe('2026-06-19');
  });

  it('clamps day when target month has fewer days (Jan 31 + 1mo non-leap)', () => {
    expect(formatISO(addMonths(new Date(2025, 0, 31), 1))).toBe('2025-02-28');
  });

  it('clamps day when target month has fewer days (Jan 31 + 1mo leap)', () => {
    expect(formatISO(addMonths(new Date(2024, 0, 31), 1))).toBe('2024-02-29');
  });

  it('rolls year forward when crossing December', () => {
    expect(formatISO(addMonths(new Date(2026, 11, 15), 1))).toBe('2027-01-15');
  });

  it('rolls year back when subtracting past January', () => {
    expect(formatISO(addMonths(new Date(2026, 1, 15), -2))).toBe('2025-12-15');
  });
});

describe('isSameDay', () => {
  it('returns true when year/month/day match regardless of time', () => {
    const a = new Date(2026, 4, 19, 0, 0, 0);
    const b = new Date(2026, 4, 19, 23, 59, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false when any of year/month/day differs', () => {
    expect(isSameDay(new Date(2026, 4, 19), new Date(2026, 4, 20))).toBe(false);
    expect(isSameDay(new Date(2026, 4, 19), new Date(2026, 5, 19))).toBe(false);
    expect(isSameDay(new Date(2026, 4, 19), new Date(2025, 4, 19))).toBe(false);
  });
});

describe('isInRange / clampDate', () => {
  const min = new Date(2026, 0, 1);
  const max = new Date(2026, 11, 31);

  it('isInRange treats endpoints as inclusive', () => {
    expect(isInRange(new Date(2026, 0, 1), min, max)).toBe(true);
    expect(isInRange(new Date(2026, 11, 31), min, max)).toBe(true);
  });

  it('isInRange returns false outside the range', () => {
    expect(isInRange(new Date(2025, 11, 31), min, max)).toBe(false);
    expect(isInRange(new Date(2027, 0, 1), min, max)).toBe(false);
  });

  it('isInRange treats null bounds as unbounded', () => {
    expect(isInRange(new Date(1900, 0, 1), null, null)).toBe(true);
    expect(isInRange(new Date(1900, 0, 1), null, max)).toBe(true);
    expect(isInRange(new Date(2100, 0, 1), min, null)).toBe(true);
  });

  it('clampDate returns the boundary when outside the range', () => {
    expect(formatISO(clampDate(new Date(2025, 5, 1), min, max))).toBe('2026-01-01');
    expect(formatISO(clampDate(new Date(2027, 5, 1), min, max))).toBe('2026-12-31');
  });

  it('clampDate returns the original date when in range', () => {
    expect(formatISO(clampDate(new Date(2026, 5, 15), min, max))).toBe('2026-06-15');
  });
});

describe('getMonthGrid', () => {
  it('returns 42 cells', () => {
    expect(getMonthGrid(2026, 4, 0)).toHaveLength(42);
    expect(getMonthGrid(2026, 4, 1)).toHaveLength(42);
  });

  it('starts on the configured weekStart for May 2026 (Sunday-first)', () => {
    const grid = getMonthGrid(2026, 4, 0);
    const first = grid[0];
    if (!first) throw new Error('expected first cell');
    expect(first.getDay()).toBe(0);
  });

  it('starts on the configured weekStart for May 2026 (Monday-first)', () => {
    const grid = getMonthGrid(2026, 4, 1);
    const first = grid[0];
    if (!first) throw new Error('expected first cell');
    expect(first.getDay()).toBe(1);
  });

  it('includes leading prev-month days when month does not start on weekStart', () => {
    const grid = getMonthGrid(2026, 4, 1);
    const first = grid[0];
    if (!first) throw new Error('expected first cell');
    expect(formatISO(first)).toBe('2026-04-27');
  });

  it('crosses year boundaries correctly', () => {
    const grid = getMonthGrid(2027, 0, 1);
    const first = grid[0];
    if (!first) throw new Error('expected first cell');
    expect(first.getFullYear()).toBe(2026);
    expect(first.getMonth()).toBe(11);
  });

  it('always includes the first day of the requested month somewhere in the grid', () => {
    const grid = getMonthGrid(2026, 4, 1);
    const target = formatISO(new Date(2026, 4, 1));
    expect(grid.map(formatISO)).toContain(target);
  });
});

describe('detectLocale', () => {
  let originalLang: string;

  beforeEach(() => {
    originalLang = document.documentElement.lang;
  });

  afterEach(() => {
    document.documentElement.lang = originalLang;
  });

  it('returns <html lang> when set', () => {
    document.documentElement.lang = 'fr-FR';
    expect(detectLocale()).toBe('fr-FR');
  });

  it('falls back to navigator.language when <html lang> is empty', () => {
    document.documentElement.lang = '';
    expect(detectLocale()).toBe(navigator.language);
  });
});

describe('getWeekStart', () => {
  it('returns 0 (Sunday) for en-US, en-CA, he, ja-JP', () => {
    expect(getWeekStart('en-US')).toBe(0);
    expect(getWeekStart('en-CA')).toBe(0);
    expect(getWeekStart('he')).toBe(0);
    expect(getWeekStart('ja-JP')).toBe(0);
  });

  it('returns 1 (Monday) for fr-FR, de-DE, es-ES, it-IT', () => {
    expect(getWeekStart('fr-FR')).toBe(1);
    expect(getWeekStart('de-DE')).toBe(1);
    expect(getWeekStart('es-ES')).toBe(1);
    expect(getWeekStart('it-IT')).toBe(1);
  });

  it('falls back to base language when full locale is unknown', () => {
    expect(getWeekStart('ja-Custom')).toBe(0);
  });
});

describe('formatMonthYear / formatWeekdays', () => {
  it('formatMonthYear produces a localized month + year string', () => {
    const out = formatMonthYear(new Date(2026, 4, 19), 'en-US');
    expect(out).toMatch(/May/);
    expect(out).toMatch(/2026/);
  });

  it('formatWeekdays returns 7 strings starting on Sunday when weekStart=0', () => {
    const days = formatWeekdays('en-US', 0);
    expect(days).toHaveLength(7);
    const first = days[0];
    if (first === undefined) throw new Error('expected first weekday');
    expect(first.toLowerCase()).toMatch(/^s/);
  });

  it('formatWeekdays returns 7 strings starting on Monday when weekStart=1', () => {
    const days = formatWeekdays('en-US', 1);
    expect(days).toHaveLength(7);
    const first = days[0];
    if (first === undefined) throw new Error('expected first weekday');
    expect(first.toLowerCase()).toMatch(/^m/);
  });
});
