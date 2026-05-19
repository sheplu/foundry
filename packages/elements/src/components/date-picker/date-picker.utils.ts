const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const SUNDAY_FIRST_LANGS = new Set(['en-US', 'en-CA', 'he', 'he-IL', 'ja', 'ja-JP', 'pt-BR', 'ar-SA']);

export function parseISO(s: string): Date | null {
  const m = ISO_RE.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function formatISO(d: Date): string {
  const y = String(d.getFullYear()).padStart(4, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function addMonths(d: Date, n: number): Date {
  const targetMonth = d.getMonth() + n;
  const targetYear = d.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  return new Date(targetYear, normalizedMonth, Math.min(d.getDate(), lastDay));
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function isInRange(d: Date, min: Date | null, max: Date | null): boolean {
  if (min && d < startOfDay(min)) return false;
  if (max && d > endOfDay(max)) return false;
  return true;
}

export function clampDate(d: Date, min: Date | null, max: Date | null): Date {
  if (min && d < startOfDay(min)) return new Date(min.getFullYear(), min.getMonth(), min.getDate());
  if (max && d > endOfDay(max)) return new Date(max.getFullYear(), max.getMonth(), max.getDate());
  return d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function getMonthGrid(year: number, month: number, weekStart: 0 | 1): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const leading = (firstWeekday - weekStart + 7) % 7;
  const start = new Date(year, month, 1 - leading);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) cells.push(addDays(start, i));
  return cells;
}

export function detectLocale(): string {
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.lang;
    if (lang) return lang;
  }
  /* v8 ignore next -- jsdom always provides navigator.language */
  if (typeof navigator !== 'undefined' && navigator.language) return navigator.language;
  /* v8 ignore next -- final fallback for non-browser environments */
  return 'en-US';
}

export function getWeekStart(locale: string): 0 | 1 {
  if (SUNDAY_FIRST_LANGS.has(locale)) return 0;
  const base = locale.split('-')[0];
  if (base && SUNDAY_FIRST_LANGS.has(base)) return 0;
  return 1;
}

export function formatMonthYear(d: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(d);
}

export function formatWeekdays(locale: string, weekStart: 0 | 1): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const reference = new Date(2024, 0, 7);
  const days: string[] = [];
  for (let i = 0; i < 7; i += 1) days.push(fmt.format(addDays(reference, i + weekStart)));
  return days;
}
