export function dayStartUtc(d: Date): Date {
  const result = new Date(d);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

export function addUtcDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

export function startOfUtcWeek(d: Date): Date {
  const result = dayStartUtc(d);
  const day = result.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
}

export function endOfUtcWeek(d: Date): Date {
  const result = addUtcDays(startOfUtcWeek(d), 7);
  result.setUTCMilliseconds(result.getUTCMilliseconds() - 1);
  return result;
}

export function isoDateUtc(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
