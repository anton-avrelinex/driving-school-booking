import { Temporal } from "@js-temporal/polyfill";

export interface DeadlineConfig {
  cancelDeadlineDaysBefore: number;
  cancelDeadlineTime: string;
  timezone: string;
}

export function computeCancelDeadlineUtc(
  startTime: Date,
  config: DeadlineConfig,
): Date {
  const [hour, minute] = config.cancelDeadlineTime.split(":").map(Number);
  if (
    hour === undefined ||
    minute === undefined ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    throw new Error(`Invalid cancelDeadlineTime: ${config.cancelDeadlineTime}`);
  }

  const deadline = Temporal.Instant.fromEpochMilliseconds(startTime.getTime())
    .toZonedDateTimeISO(config.timezone)
    .toPlainDate()
    .subtract({ days: config.cancelDeadlineDaysBefore })
    .toZonedDateTime({
      timeZone: config.timezone,
      plainTime: Temporal.PlainTime.from({ hour, minute }),
    });

  return new Date(deadline.epochMilliseconds);
}
