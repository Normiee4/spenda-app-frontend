// Date/time helpers (PRD §8 — no hardcoded formats; Intl everywhere).

/** Local start-of-day for the day containing `date`. */
export function startOfDay(date: Date | number = Date.now()): number {
  const d = typeof date === 'number' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Local start-of-day of the next day (exclusive bound). */
export function endOfDay(date: Date | number = Date.now()): number {
  return startOfDay(date) + 24 * 60 * 60 * 1000;
}

let dayHeader: Intl.DateTimeFormat | null = null;
/** "Fri, Oct 23" */
export function formatDayHeader(date: Date | number = Date.now()): string {
  if (!dayHeader) {
    dayHeader = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }
  return dayHeader.format(typeof date === 'number' ? new Date(date) : date);
}

let timeFmt: Intl.DateTimeFormat | null = null;

/** "12:14 PM" — cached formatter. */
export function formatTime(epochMs: number): string {
  if (!timeFmt) {
    timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  return timeFmt.format(new Date(epochMs));
}

/** "Oct 23, 2026" — month calendar title style. */
export function formatMonthTitle(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
}

/** Local start-of-week, Monday. */
export function startOfWeek(date: Date | number = Date.now()): number {
  const d = new Date(startOfDay(date));
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return d.getTime();
}

/** Local start-of-month. */
export function startOfMonth(date: Date | number = Date.now()): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d.getTime();
}

/** Add whole days to a local timestamp. */
export function addDays(epochMs: number, days: number): number {
  const d = new Date(epochMs);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Add whole months to a local timestamp (day 1 stays day 1). */
export function addMonths(epochMs: number, months: number): number {
  const d = new Date(epochMs);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

let dateWithYear: Intl.DateTimeFormat | null = null;

/** "March 27, 2026" */
export function formatDateWithYear(epochMs: number): string {
  if (!dateWithYear) {
    dateWithYear = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return dateWithYear.format(new Date(epochMs));
}

/** Sticky History divider: "Today · March 27, 2026" or just the date. */
export function formatDividerDate(epochMs: number): string {
  const today = startOfDay();
  const relative =
    epochMs === today ? 'Today' : epochMs === addDays(today, -1) ? 'Yesterday' : null;
  return relative ? `${relative} · ${formatDateWithYear(epochMs)}` : formatDateWithYear(epochMs);
}
