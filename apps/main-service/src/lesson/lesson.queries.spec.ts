import { slotsQuery } from "./lesson.queries";
import { createTestDb, type TestDb } from "../test-utils/pglite";
import { seedSchool } from "../test-utils/seed";
import { Transmission } from "../generated/prisma/enums";

const FROM = new Date("2026-05-04T00:00:00.000Z"); // Monday
const TO = new Date("2026-05-05T00:00:00.000Z"); // Tuesday (exclusive)

describe("lesson.queries", () => {
  let db: TestDb;

  beforeAll(async () => {
    db = await createTestDb();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  describe("slotsQuery", () => {
    it("slices a window into duration-sized slots", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      await instructor.setAvailability(1, "09:00", "13:00"); // 4h

      const rows = await db.prisma.$queryRaw<
        {
          startTime: string;
          endTime: string;
          instructorIds: string[];
        }[]
      >(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: FROM,
          to: TO,
          instructorUserId: null,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "UTC",
        }),
      );

      expect(rows.map((r) => r.startTime)).toEqual([
        "2026-05-04T09:00:00.000Z",
        "2026-05-04T11:00:00.000Z",
      ]);
      expect(rows[0]?.instructorIds).toEqual([instructor.userId]);
    });

    it("interprets HH:MM rules as wall time in the school's timezone", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      // 09:00 wall time in Asia/Tokyo (UTC+9, no DST) = 00:00 UTC.
      await instructor.setAvailability(1, "09:00", "13:00");

      const rows = await db.prisma.$queryRaw<{ startTime: string }[]>(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: FROM,
          to: TO,
          instructorUserId: null,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "Asia/Tokyo",
        }),
      );

      expect(rows.map((r) => r.startTime)).toEqual([
        "2026-05-04T00:00:00.000Z",
        "2026-05-04T02:00:00.000Z",
      ]);
    });

    it("respects DST when projecting wall time to UTC (Europe/Berlin)", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      await instructor.setAvailability(1, "10:00", "12:00");

      // 2026-03-23 (Mon, before EU DST flip on 2026-03-29) —
      // Berlin is UTC+1, so 10:00 local = 09:00 UTC.
      const winter = await db.prisma.$queryRaw<{ startTime: string }[]>(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: new Date("2026-03-23T00:00:00.000Z"),
          to: new Date("2026-03-24T00:00:00.000Z"),
          instructorUserId: null,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "Europe/Berlin",
        }),
      );
      expect(winter.map((r) => r.startTime)).toEqual([
        "2026-03-23T09:00:00.000Z",
      ]);

      // 2026-04-06 (Mon, after the DST flip) — Berlin is UTC+2,
      // so 10:00 local = 08:00 UTC. Same stored rule, different UTC instant.
      const summer = await db.prisma.$queryRaw<{ startTime: string }[]>(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: new Date("2026-04-06T00:00:00.000Z"),
          to: new Date("2026-04-07T00:00:00.000Z"),
          instructorUserId: null,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "Europe/Berlin",
        }),
      );
      expect(summer.map((r) => r.startTime)).toEqual([
        "2026-04-06T08:00:00.000Z",
      ]);
    });

    it("excludes slots overlapping an existing instructor lesson", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const otherStudent = await school.addStudent();
      await instructor.setAvailability(1, "09:00", "13:00");

      // Block the 09:00 slot with a lesson for a *different* student
      await otherStudent.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: new Date("2026-05-04T09:00:00.000Z"),
        endTime: new Date("2026-05-04T11:00:00.000Z"),
      });

      const rows = await db.prisma.$queryRaw<{ startTime: string }[]>(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: FROM,
          to: TO,
          instructorUserId: null,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "UTC",
        }),
      );

      expect(rows.map((r) => r.startTime)).toEqual([
        "2026-05-04T11:00:00.000Z",
      ]);
    });

    it("excludes slots when no vehicle is free", async () => {
      const school = await seedSchool(db.prisma); // 1 vehicle
      const instructorA = await school.addInstructor();
      const instructorB = await school.addInstructor();
      const student = await school.addStudent();
      const otherStudent = await school.addStudent();
      await instructorA.setAvailability(1, "09:00", "11:00");
      await instructorB.setAvailability(1, "09:00", "11:00");

      // The only vehicle is locked at 09:00 by an unrelated booking
      await otherStudent.bookLesson({
        instructorProfileId: instructorA.instructorProfileId,
        startTime: new Date("2026-05-04T09:00:00.000Z"),
        endTime: new Date("2026-05-04T11:00:00.000Z"),
        vehicleId: school.vehicleId,
      });

      const rows = await db.prisma.$queryRaw<{ startTime: string }[]>(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: FROM,
          to: TO,
          instructorUserId: null,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "UTC",
        }),
      );

      expect(rows).toEqual([]);
    });

    it("aggregates instructorIds across multiple eligible instructors", async () => {
      const school = await seedSchool(db.prisma);
      await school.addVehicle(); // second vehicle so scarcity isn't the limit

      const instructorA = await school.addInstructor();
      const instructorB = await school.addInstructor();
      const student = await school.addStudent();
      await instructorA.setAvailability(1, "09:00", "11:00");
      await instructorB.setAvailability(1, "09:00", "11:00");

      const rows = await db.prisma.$queryRaw<
        {
          startTime: string;
          instructorIds: string[];
        }[]
      >(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: FROM,
          to: TO,
          instructorUserId: null,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "UTC",
        }),
      );

      const sortAlpha = (a: string, b: string) => a.localeCompare(b);
      expect(rows).toHaveLength(1);
      expect([...(rows[0]?.instructorIds ?? [])].sort(sortAlpha)).toEqual(
        [instructorA.userId, instructorB.userId].sort(sortAlpha),
      );
    });
  });
});
