import {
  type CalendarDate,
  Time,
  getLocalTimeZone,
  parseAbsoluteToLocal,
  parseDate,
  parseTime,
  toCalendarDateTime,
  type ZonedDateTime,
} from "@internationalized/date";

export function parseDateString(s: string): CalendarDate {
  return parseDate(s);
}

export function parseTimeString(s: string): Time {
  const normalized = /^\d{2}:\d{2}$/.test(s) ? `${s}:00` : s;
  return parseTime(normalized);
}

export function parseISOToZoned(iso: string): ZonedDateTime {
  return parseAbsoluteToLocal(iso);
}

export function timeToString(t: Time): string {
  return `${pad(t.hour)}:${pad(t.minute)}`;
}

export function dateStart(d: CalendarDate, tz = getLocalTimeZone()): string {
  return d.toDate(tz).toISOString();
}

export function dateEnd(d: CalendarDate, tz = getLocalTimeZone()): string {
  return toCalendarDateTime(d, new Time(23, 59, 59, 999))
    .toDate(tz)
    .toISOString();
}

export function combineDateTime(
  date: CalendarDate,
  time: Time,
  tz = getLocalTimeZone(),
): string {
  return toCalendarDateTime(date, time).toDate(tz).toISOString();
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
