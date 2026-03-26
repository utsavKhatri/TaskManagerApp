import {
  parse,
  format,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  isValid,
} from 'date-fns';

/** Local calendar day `yyyy-MM-dd` */
export type DayKey = string;

export type TaskDateRange = { start: DayKey; end: DayKey };

export function parseDayKeyLocal(key: DayKey): Date {
  return parse(key, 'yyyy-MM-dd', new Date());
}

export function dayKeyToStartIso(key: DayKey): string {
  return startOfDay(parseDayKeyLocal(key)).toISOString();
}

export function dayKeyToEndIso(key: DayKey): string {
  return endOfDay(parseDayKeyLocal(key)).toISOString();
}

export function normalizeDayRange(
  a: DayKey,
  b: DayKey,
): { start: DayKey; end: DayKey } {
  if (a <= b) return { start: a, end: b };
  return { start: b, end: a };
}

export function isValidDayKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = parseDayKeyLocal(key as DayKey);
  return isValid(d) && format(d, 'yyyy-MM-dd') === key;
}

export function formatTaskDateBadge(
  range: { start: DayKey; end: DayKey } | null,
): string {
  if (!range) return 'All time';
  const ds = parseDayKeyLocal(range.start);
  const de = parseDayKeyLocal(range.end);
  if (!isValid(ds) || !isValid(de)) return 'All time';
  if (range.start === range.end) {
    return format(ds, 'EEE, MMM d, yyyy');
  }
  const sameYear = ds.getFullYear() === de.getFullYear();
  const left = sameYear ? format(ds, 'MMM d') : format(ds, 'MMM d, yyyy');
  return `${left} – ${format(de, 'MMM d, yyyy')}`;
}

export function clampRangeToDataBounds(
  start: DayKey,
  end: DayKey,
  dataMin: DayKey | null,
  dataMax: DayKey | null,
): { start: DayKey; end: DayKey; wasClamped: boolean } {
  let s = start;
  let e = end;
  let wasClamped = false;

  if (dataMin && s < dataMin) {
    s = dataMin;
    wasClamped = true;
  }
  if (dataMax && e > dataMax) {
    e = dataMax;
    wasClamped = true;
  }
  if (dataMin && e < dataMin) {
    e = dataMin;
    wasClamped = true;
  }
  if (dataMax && s > dataMax) {
    s = dataMax;
    wasClamped = true;
  }

  const norm = normalizeDayRange(s, e);
  return { start: norm.start, end: norm.end, wasClamped };
}

export function buildCalendarPeriodMarked(
  start: DayKey,
  end: DayKey | null,
  periodColor: string,
): Record<string, object> {
  if (!end || start === end) {
    return {
      [start]: {
        startingDay: true,
        endingDay: true,
        color: periodColor,
        textColor: '#FFFFFF',
      },
    };
  }

  const { start: a, end: b } = normalizeDayRange(start, end);
  const fromD = parseDayKeyLocal(a);
  const toD = parseDayKeyLocal(b);
  const days = eachDayOfInterval({ start: fromD, end: toD });
  const marked: Record<string, object> = {};
  days.forEach((d, i) => {
    const k = format(d, 'yyyy-MM-dd');
    marked[k] = {
      color: periodColor,
      textColor: '#FFFFFF',
      startingDay: i === 0,
      endingDay: i === days.length - 1,
    };
  });
  return marked;
}
