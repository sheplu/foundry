const NUMBER_RE = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

export function parseNumber(s: string): number | null {
  const trimmed = s.trim();
  if (trimmed === '') return null;
  if (!NUMBER_RE.test(trimmed)) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function decimalsOf(step: number): number {
  if (!Number.isFinite(step) || step === 0) return 0;
  const str = Math.abs(step).toString();
  const dot = str.indexOf('.');
  const exp = str.indexOf('e-');
  if (exp >= 0) {
    const mantissaDecimals = dot >= 0 ? exp - dot - 1 : 0;
    return Number(str.slice(exp + 2)) + mantissaDecimals;
  }
  if (dot >= 0) return str.length - dot - 1;
  return 0;
}

export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return rounded === 0 ? 0 : rounded;
}

export function addStep(value: number, step: number, sign: 1 | -1): number {
  const next = value + sign * step;
  const decimals = Math.max(decimalsOf(step), decimalsOf(value));
  return roundTo(next, decimals);
}

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function snapToGrid(value: number, min: number, step: number): number {
  if (step <= 0) return value;
  const decimals = decimalsOf(step);
  const anchor = Number.isFinite(min) ? min : 0;
  const k = Math.round((value - anchor) / step);
  return roundTo(anchor + k * step, decimals);
}

export function isOnGrid(value: number, min: number, step: number, eps?: number): boolean {
  if (step <= 0) return true;
  const tolerance = eps ?? Math.abs(step) / 1e6;
  return Math.abs(value - snapToGrid(value, min, step)) < tolerance;
}

export function formatNumber(n: number, step: number): string {
  if (!Number.isFinite(n)) return '';
  return n.toFixed(decimalsOf(step));
}
