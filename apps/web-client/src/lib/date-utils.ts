import {
  type CalendarDate,
  Time,
  getLocalTimeZone,
  parseAbsolute,
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
  return parseAbsolute(iso, getLocalTimeZone());
}

export function timeToString(t: Time): string {
  return `${pad(t.hour)}:${pad(t.minute)}`;
}

export function dateStart(
  d: CalendarDate,
  timezone = getLocalTimeZone(),
): string {
  return d.toDate(timezone).toISOString();
}

export function dateEnd(
  d: CalendarDate,
  timezone = getLocalTimeZone(),
): string {
  return toCalendarDateTime(d, new Time(23, 59, 59, 999))
    .toDate(timezone)
    .toISOString();
}

// Display-only convention. Stored dayOfWeek always follows JS/Postgres
// (Sunday = 0); these constants only affect rendering order.
export const WEEK_STARTS_ON = 1; // Monday
export const WEEK_LOCALE = "en-GB"; // Monday-first locale for startOfWeek
export const WEEK_ORDER: readonly number[] = Array.from(
  { length: 7 },
  (_, i) => (WEEK_STARTS_ON + i) % 7,
);

export function isoLocalDate(zdt: ZonedDateTime): string {
  return `${zdt.year}-${pad(zdt.month)}-${pad(zdt.day)}`;
}

export function sameLocalDay(zdt: ZonedDateTime, date: CalendarDate): boolean {
  return (
    zdt.year === date.year && zdt.month === date.month && zdt.day === date.day
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
