import { slotsQuery } from "./lesson.queries";
import { createTestDb, type TestDb } from "../test-utils/pglite";
import { seedSchool } from "../test-utils/seed";
import {
  LessonStatus,
  Transmission,
  UserStatus,
} from "../generated/prisma/enums";

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

    it("excludes slots overlapping a lesson the same student already has (with a different instructor)", async () => {
      const school = await seedSchool(db.prisma);
      const instructorA = await school.addInstructor();
      const instructorB = await school.addInstructor();
      const student = await school.addStudent();
      await instructorA.setAvailability(1, "09:00", "13:00");
      await instructorB.setAvailability(1, "09:00", "13:00");

      // Student already booked with instructor A at 09:00; querying for B
      // should drop the 09:00 slot but keep 11:00.
      await student.bookLesson({
        instructorProfileId: instructorA.instructorProfileId,
        startTime: new Date("2026-05-04T09:00:00.000Z"),
        endTime: new Date("2026-05-04T11:00:00.000Z"),
      });

      const rows = await db.prisma.$queryRaw<{ startTime: string }[]>(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: FROM,
          to: TO,
          instructorUserId: instructorB.userId,
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

    it("treats a PENDING instructor lesson as blocking the slot (same as SCHEDULED)", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const otherStudent = await school.addStudent();
      const student = await school.addStudent();
      await instructor.setAvailability(1, "09:00", "13:00");

      const existing = await otherStudent.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: new Date("2026-05-04T09:00:00.000Z"),
        endTime: new Date("2026-05-04T11:00:00.000Z"),
      });
      await db.prisma.lesson.update({
        where: { id: existing },
        data: { status: LessonStatus.PENDING },
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

    // Locks down ACTIVE_LESSON_STATUSES at the SQL level: a regression that
    // adds REJECTED/CANCELLED/COMPLETED to the active set would silently hide
    // bookable slots from students.
    it.each([
      LessonStatus.REJECTED,
      LessonStatus.CANCELLED,
      LessonStatus.COMPLETED,
    ])(
      "does not block slots for an instructor lesson in %s status",
      async (status) => {
        const school = await seedSchool(db.prisma);
        const instructor = await school.addInstructor();
        const otherStudent = await school.addStudent();
        const student = await school.addStudent();
        await instructor.setAvailability(1, "09:00", "13:00");

        const existing = await otherStudent.bookLesson({
          instructorProfileId: instructor.instructorProfileId,
          startTime: new Date("2026-05-04T09:00:00.000Z"),
          endTime: new Date("2026-05-04T11:00:00.000Z"),
        });
        await db.prisma.lesson.update({
          where: { id: existing },
          data: { status },
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
          "2026-05-04T09:00:00.000Z",
          "2026-05-04T11:00:00.000Z",
        ]);
      },
    );

    it("excludes INACTIVE instructors from eligible set", async () => {
      const school = await seedSchool(db.prisma);
      const active = await school.addInstructor();
      const inactive = await school.addInstructor({
        status: UserStatus.INACTIVE,
      });
      const student = await school.addStudent();
      await active.setAvailability(1, "09:00", "11:00");
      await inactive.setAvailability(1, "09:00", "11:00");

      const rows = await db.prisma.$queryRaw<
        { startTime: string; instructorIds: string[] }[]
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

      expect(rows).toHaveLength(1);
      expect(rows[0]?.instructorIds).toEqual([active.userId]);
    });

    it("excludes instructors who don't teach the requested course", async () => {
      const school = await seedSchool(db.prisma);
      const eligible = await school.addInstructor();
      const student = await school.addStudent();
      await eligible.setAvailability(1, "09:00", "11:00");

      // A second instructor exists but is connected to a *different* course.
      const otherCourse = await db.prisma.course.create({
        data: {
          schoolId: school.id,
          name: "Other",
          price: 100,
          hours: 30,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
        },
      });
      const otherUser = await db.prisma.user.create({
        data: {
          schoolId: school.id,
          email: "other-course@test.dev",
          passwordHash: "x",
          firstName: "Other",
          lastName: "Inst",
          role: "INSTRUCTOR",
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
          instructorProfile: {
            create: { courses: { connect: { id: otherCourse.id } } },
          },
        },
        include: { instructorProfile: true },
      });
      await db.prisma.instructorAvailability.create({
        data: {
          instructorId: otherUser.instructorProfile!.id,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "11:00",
        },
      });

      const rows = await db.prisma.$queryRaw<
        { startTime: string; instructorIds: string[] }[]
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

      expect(rows).toHaveLength(1);
      expect(rows[0]?.instructorIds).toEqual([eligible.userId]);
    });

    it("narrows to a single instructor when instructorUserId is set", async () => {
      const school = await seedSchool(db.prisma);
      const a = await school.addInstructor();
      const b = await school.addInstructor();
      const student = await school.addStudent();
      await a.setAvailability(1, "09:00", "11:00");
      await b.setAvailability(1, "09:00", "11:00");

      const rows = await db.prisma.$queryRaw<
        { startTime: string; instructorIds: string[] }[]
      >(
        slotsQuery({
          schoolId: school.id,
          courseId: school.courseId,
          from: FROM,
          to: TO,
          instructorUserId: a.userId,
          studentProfileId: student.studentProfileId,
          categoryId: school.categoryId,
          transmission: Transmission.AUTOMATIC,
          durationMin: 120,
          schoolTz: "UTC",
        }),
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]?.instructorIds).toEqual([a.userId]);
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
