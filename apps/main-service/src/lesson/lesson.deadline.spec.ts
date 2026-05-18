import { computeCancelDeadlineUtc } from "./lesson.deadline";

describe("computeCancelDeadlineUtc", () => {
  it("subtracts days and applies the wall-clock time in the school timezone", () => {
    // Lesson 2026-01-15 10:00 Berlin (winter, UTC+1). Deadline = day before 15:00 Berlin = 14:00 UTC.
    const startTime = new Date("2026-01-15T09:00:00Z");
    const deadline = computeCancelDeadlineUtc(startTime, {
      cancelDeadlineDaysBefore: 1,
      cancelDeadlineTime: "15:00",
      timezone: "Europe/Berlin",
    });
    expect(deadline.toISOString()).toBe("2026-01-14T14:00:00.000Z");
  });

  it("uses the offset that applies at the deadline instant (summer)", () => {
    // Lesson 2026-06-15 10:00 Berlin (DST, UTC+2). Deadline = day before 15:00 Berlin = 13:00 UTC.
    const startTime = new Date("2026-06-15T08:00:00Z");
    const deadline = computeCancelDeadlineUtc(startTime, {
      cancelDeadlineDaysBefore: 1,
      cancelDeadlineTime: "15:00",
      timezone: "Europe/Berlin",
    });
    expect(deadline.toISOString()).toBe("2026-06-14T13:00:00.000Z");
  });

  it("anchors the deadline to the lesson's LOCAL date, not its UTC date", () => {
    // Lesson 2026-06-15 01:30 Berlin (= 2026-06-14 23:30 UTC). The lesson's
    // local date is the 15th; deadline = 14th 23:00 Berlin = 21:00 UTC.
    const startTime = new Date("2026-06-14T23:30:00Z");
    const deadline = computeCancelDeadlineUtc(startTime, {
      cancelDeadlineDaysBefore: 1,
      cancelDeadlineTime: "23:00",
      timezone: "Europe/Berlin",
    });
    expect(deadline.toISOString()).toBe("2026-06-14T21:00:00.000Z");
  });

  it("handles a deadline that falls on the spring-forward DST date", () => {
    // EU DST starts 2026-03-29 (clocks jump 02:00 → 03:00 Berlin). Lesson on
    // 2026-03-30 10:00 Berlin; deadline = 2026-03-29 15:00 Berlin, which is
    // after the jump → UTC+2 → 13:00 UTC.
    const startTime = new Date("2026-03-30T08:00:00Z");
    const deadline = computeCancelDeadlineUtc(startTime, {
      cancelDeadlineDaysBefore: 1,
      cancelDeadlineTime: "15:00",
      timezone: "Europe/Berlin",
    });
    expect(deadline.toISOString()).toBe("2026-03-29T13:00:00.000Z");
  });

  it("handles a deadline that falls on the fall-back DST date", () => {
    // EU DST ends 2026-10-25 (clocks fall 03:00 → 02:00 Berlin). Lesson on
    // 2026-10-26 10:00 Berlin; deadline = 2026-10-25 15:00 Berlin, which is
    // after the fall-back → UTC+1 → 14:00 UTC.
    const startTime = new Date("2026-10-26T09:00:00Z");
    const deadline = computeCancelDeadlineUtc(startTime, {
      cancelDeadlineDaysBefore: 1,
      cancelDeadlineTime: "15:00",
      timezone: "Europe/Berlin",
    });
    expect(deadline.toISOString()).toBe("2026-10-25T14:00:00.000Z");
  });

  it("respects cancelDeadlineDaysBefore = 0 (same-day deadline)", () => {
    // Lesson 2026-06-15 20:00 Berlin, deadline same day at 15:00 Berlin = 13:00 UTC.
    const startTime = new Date("2026-06-15T18:00:00Z");
    const deadline = computeCancelDeadlineUtc(startTime, {
      cancelDeadlineDaysBefore: 0,
      cancelDeadlineTime: "15:00",
      timezone: "Europe/Berlin",
    });
    expect(deadline.toISOString()).toBe("2026-06-15T13:00:00.000Z");
  });
});
