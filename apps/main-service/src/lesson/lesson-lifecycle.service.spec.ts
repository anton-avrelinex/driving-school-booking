import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { LessonLifecycleService } from "./lesson-lifecycle.service";
import { createTestDb, type TestDb } from "../test-utils/pglite";
import { seedSchool } from "../test-utils/seed";
import {
  EnrollmentStatus,
  LessonStatus,
  Role,
  Transmission,
  UserStatus,
} from "../generated/prisma/enums";

// Far enough in the future that the default 2h booking lead never bites.
const FUTURE_START = new Date("2030-01-06T10:00:00.000Z"); // Mon 10:00 UTC
const FUTURE_END = new Date("2030-01-06T12:00:00.000Z"); // +2h, default duration

describe("LessonLifecycleService", () => {
  let db: TestDb;
  let service: LessonLifecycleService;

  beforeAll(async () => {
    db = await createTestDb();
    service = new LessonLifecycleService(db.prisma);
  });

  beforeEach(async () => {
    await db.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  describe("create", () => {
    it("creates a PENDING lesson with endTime = startTime + default duration", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();

      const lesson = await service.create(school.id, student.studentProfileId, {
        enrollmentId: student.enrollmentId,
        instructorId: instructor.userId,
        startTime: FUTURE_START.toISOString(),
      });

      expect(lesson.status).toBe(LessonStatus.PENDING);
      expect(new Date(lesson.startTime).toISOString()).toBe(
        FUTURE_START.toISOString(),
      );
      expect(new Date(lesson.endTime).toISOString()).toBe(
        FUTURE_END.toISOString(),
      );
    });

    it("rejects when the instructor already has a PENDING lesson overlapping the slot", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const other = await school.addStudent();
      const student = await school.addStudent();

      const existing = await other.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: existing },
        data: { status: LessonStatus.PENDING },
      });

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: instructor.userId,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the instructor already has a SCHEDULED lesson overlapping the slot", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const other = await school.addStudent();
      const student = await school.addStudent();

      await other.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: instructor.userId,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // REJECTED/CANCELLED/COMPLETED lessons must NOT block — they are inactive
    // statuses (see ACTIVE_LESSON_STATUSES). A regression that adds any of them
    // to the active set would silently block re-bookings of dropped slots.
    it.each([
      LessonStatus.REJECTED,
      LessonStatus.CANCELLED,
      LessonStatus.COMPLETED,
    ])(
      "allows booking when the instructor has an overlapping %s lesson",
      async (status) => {
        const school = await seedSchool(db.prisma);
        const instructor = await school.addInstructor();
        const other = await school.addStudent();
        const student = await school.addStudent();

        const existing = await other.bookLesson({
          instructorProfileId: instructor.instructorProfileId,
          startTime: FUTURE_START,
          endTime: FUTURE_END,
        });
        await db.prisma.lesson.update({
          where: { id: existing },
          data: { status },
        });

        const lesson = await service.create(
          school.id,
          student.studentProfileId,
          {
            enrollmentId: student.enrollmentId,
            instructorId: instructor.userId,
            startTime: FUTURE_START.toISOString(),
          },
        );

        expect(lesson.status).toBe(LessonStatus.PENDING);
      },
    );

    it("rejects when the student already has an overlapping active lesson with a different instructor", async () => {
      const school = await seedSchool(db.prisma);
      const a = await school.addInstructor();
      const b = await school.addInstructor();
      const student = await school.addStudent();

      await student.bookLesson({
        instructorProfileId: a.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: b.userId,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when every matching vehicle is already booked at this time", async () => {
      const school = await seedSchool(db.prisma); // 1 vehicle by default
      const instructor = await school.addInstructor();
      const other = await school.addInstructor();
      const otherStudent = await school.addStudent();
      const student = await school.addStudent();

      // Lock the only vehicle with a different instructor's lesson, same slot.
      await otherStudent.bookLesson({
        instructorProfileId: other.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
        vehicleId: school.vehicleId,
      });

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: instructor.userId,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects with 404 when the instructor doesn't teach this enrollment's course", async () => {
      const school = await seedSchool(db.prisma);
      const student = await school.addStudent();

      // Instructor created for a different course in the same school
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
      const user = await db.prisma.user.create({
        data: {
          schoolId: school.id,
          email: "alien@test.dev",
          passwordHash: "x",
          firstName: "Alien",
          lastName: "Inst",
          role: Role.INSTRUCTOR,
          status: UserStatus.ACTIVE,
          mustChangePassword: false,
          instructorProfile: {
            create: { courses: { connect: { id: otherCourse.id } } },
          },
        },
      });

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: user.id,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects with 404 when the instructor is INACTIVE", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();

      await db.prisma.user.update({
        where: { id: instructor.userId },
        data: { status: UserStatus.INACTIVE },
      });

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: instructor.userId,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects when startTime is inside the minBookingLeadHours window", async () => {
      const school = await seedSchool(db.prisma); // default leadHours = 2
      const instructor = await school.addInstructor();
      const student = await school.addStudent();

      const tooSoon = new Date(Date.now() + 30 * 60 * 1000); // +30 min

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: instructor.userId,
          startTime: tooSoon.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects with 403 when the enrollment belongs to a different student", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const a = await school.addStudent();
      const b = await school.addStudent();

      await expect(
        service.create(school.id, a.studentProfileId, {
          enrollmentId: b.enrollmentId,
          instructorId: instructor.userId,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("rejects when the enrollment is not ACTIVE", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();

      await db.prisma.enrollment.update({
        where: { id: student.enrollmentId },
        data: { status: EnrollmentStatus.COMPLETED },
      });

      await expect(
        service.create(school.id, student.studentProfileId, {
          enrollmentId: student.enrollmentId,
          instructorId: instructor.userId,
          startTime: FUTURE_START.toISOString(),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("confirm", () => {
    it("transitions PENDING → SCHEDULED and sets confirmedAt", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.PENDING },
      });

      const result = await service.confirm(
        school.id,
        lessonId,
        instructor.userId,
        Role.INSTRUCTOR,
      );

      expect(result.status).toBe(LessonStatus.SCHEDULED);
      const persisted = await db.prisma.lesson.findUniqueOrThrow({
        where: { id: lessonId },
      });
      expect(persisted.confirmedAt).not.toBeNull();
    });

    it.each([
      LessonStatus.SCHEDULED,
      LessonStatus.COMPLETED,
      LessonStatus.CANCELLED,
      LessonStatus.REJECTED,
    ])("rejects when current status is %s (not PENDING)", async (status) => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status },
      });

      await expect(
        service.confirm(
          school.id,
          lessonId,
          instructor.userId,
          Role.INSTRUCTOR,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("forbids an INSTRUCTOR from confirming someone else's lesson", async () => {
      const school = await seedSchool(db.prisma);
      const owner = await school.addInstructor();
      const intruder = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: owner.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.PENDING },
      });

      await expect(
        service.confirm(school.id, lessonId, intruder.userId, Role.INSTRUCTOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it("allows an ADMIN to confirm any instructor's lesson", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.PENDING },
      });

      const result = await service.confirm(
        school.id,
        lessonId,
        "admin-user-id-not-instructor",
        Role.ADMIN,
      );

      expect(result.status).toBe(LessonStatus.SCHEDULED);
    });
  });

  describe("reject", () => {
    it("transitions PENDING → REJECTED and records rejectedBy", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.PENDING },
      });

      const result = await service.reject(
        school.id,
        lessonId,
        instructor.userId,
        Role.INSTRUCTOR,
      );

      expect(result.status).toBe(LessonStatus.REJECTED);
      const persisted = await db.prisma.lesson.findUniqueOrThrow({
        where: { id: lessonId },
      });
      expect(persisted.rejectedAt).not.toBeNull();
      expect(persisted.rejectedBy).toBe(instructor.userId);
    });

    it("rejects when current status is not PENDING", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      // bookLesson leaves it SCHEDULED — already non-PENDING

      await expect(
        service.reject(school.id, lessonId, instructor.userId, Role.INSTRUCTOR),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("forbids an INSTRUCTOR from rejecting someone else's lesson", async () => {
      const school = await seedSchool(db.prisma);
      const owner = await school.addInstructor();
      const intruder = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: owner.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.PENDING },
      });

      await expect(
        service.reject(school.id, lessonId, intruder.userId, Role.INSTRUCTOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe("complete", () => {
    it("transitions SCHEDULED → COMPLETED and increments enrollment hoursCompleted by lesson duration", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent(); // hoursPurchased = 30
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END, // 2h lesson
      });

      const result = await service.complete(school.id, lessonId);
      expect(result.status).toBe(LessonStatus.COMPLETED);

      const enrollment = await db.prisma.enrollment.findUniqueOrThrow({
        where: { id: student.enrollmentId },
      });
      expect(Number(enrollment.hoursCompleted)).toBe(2);
      expect(enrollment.status).toBe(EnrollmentStatus.ACTIVE);
    });

    it("flips the enrollment to COMPLETED when hoursCompleted reaches hoursPurchased", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      // Pretend 28h already done; this 2h lesson takes us to 30/30.
      await db.prisma.enrollment.update({
        where: { id: student.enrollmentId },
        data: { hoursCompleted: 28 },
      });
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await service.complete(school.id, lessonId);

      const enrollment = await db.prisma.enrollment.findUniqueOrThrow({
        where: { id: student.enrollmentId },
      });
      expect(Number(enrollment.hoursCompleted)).toBe(30);
      expect(enrollment.status).toBe(EnrollmentStatus.COMPLETED);
    });

    it.each([
      LessonStatus.PENDING,
      LessonStatus.COMPLETED,
      LessonStatus.CANCELLED,
      LessonStatus.REJECTED,
    ])("rejects completion when current status is %s", async (status) => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status },
      });

      await expect(
        service.complete(school.id, lessonId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects completion of a lesson in another school", async () => {
      const a = await seedSchool(db.prisma);
      const b = await seedSchool(db.prisma);
      const instructor = await a.addInstructor();
      const student = await a.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(service.complete(b.id, lessonId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("cancel", () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it("cancels a PENDING lesson with no fee (status check exempts pending)", async () => {
      const school = await seedSchool(db.prisma);
      // Even with a non-zero penalty, PENDING cancellations are free.
      await db.prisma.schoolConfig.update({
        where: { schoolId: school.id },
        data: { lateCancelPenaltyPerHour: 50 },
      });
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.PENDING },
      });

      const result = await service.cancel(
        school.id,
        lessonId,
        student.userId,
        Role.STUDENT,
      );

      expect(result.status).toBe(LessonStatus.CANCELLED);
      const persisted = await db.prisma.lesson.findUniqueOrThrow({
        where: { id: lessonId },
      });
      expect(persisted.cancelledBy).toBe(student.userId);
      expect(persisted.cancelledAt).not.toBeNull();

      const profile = await db.prisma.studentProfile.findUniqueOrThrow({
        where: { id: student.studentProfileId },
      });
      expect(Number(profile.outstandingBalance)).toBe(0);
    });

    it("charges no fee when a STUDENT cancels SCHEDULED before the deadline", async () => {
      const school = await seedSchool(db.prisma);
      await db.prisma.schoolConfig.update({
        where: { schoolId: school.id },
        data: { lateCancelPenaltyPerHour: 50 },
      });
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START, // 2030 — deadline far in the future
        endTime: FUTURE_END,
      });

      await service.cancel(school.id, lessonId, student.userId, Role.STUDENT);

      const profile = await db.prisma.studentProfile.findUniqueOrThrow({
        where: { id: student.studentProfileId },
      });
      expect(Number(profile.outstandingBalance)).toBe(0);
    });

    it("charges penaltyPerHour × hours when a STUDENT cancels SCHEDULED past the deadline", async () => {
      const school = await seedSchool(db.prisma);
      await db.prisma.schoolConfig.update({
        where: { schoolId: school.id },
        data: { lateCancelPenaltyPerHour: 50 },
      });
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START, // 2030-01-06T10:00Z, 2h lesson
        endTime: FUTURE_END,
      });

      // Now = 2h before the lesson start, well past the 1-day-before deadline.
      // Fake Date only — leave timer/socket primitives real so PGlite's
      // pg socket doesn't lose its heartbeat.
      jest
        .useFakeTimers({
          doNotFake: [
            "setTimeout",
            "setInterval",
            "setImmediate",
            "queueMicrotask",
            "nextTick",
          ],
        })
        .setSystemTime(new Date("2030-01-06T08:00:00.000Z"));

      await service.cancel(school.id, lessonId, student.userId, Role.STUDENT);

      const profile = await db.prisma.studentProfile.findUniqueOrThrow({
        where: { id: student.studentProfileId },
      });
      expect(Number(profile.outstandingBalance)).toBe(100); // 50 * 2h
    });

    it("does not charge an INSTRUCTOR-initiated cancellation, even past the deadline", async () => {
      const school = await seedSchool(db.prisma);
      await db.prisma.schoolConfig.update({
        where: { schoolId: school.id },
        data: { lateCancelPenaltyPerHour: 50 },
      });
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      // Fake Date only — leave timer/socket primitives real so PGlite's
      // pg socket doesn't lose its heartbeat.
      jest
        .useFakeTimers({
          doNotFake: [
            "setTimeout",
            "setInterval",
            "setImmediate",
            "queueMicrotask",
            "nextTick",
          ],
        })
        .setSystemTime(new Date("2030-01-06T08:00:00.000Z"));

      await service.cancel(
        school.id,
        lessonId,
        instructor.userId,
        Role.INSTRUCTOR,
      );

      const profile = await db.prisma.studentProfile.findUniqueOrThrow({
        where: { id: student.studentProfileId },
      });
      expect(Number(profile.outstandingBalance)).toBe(0);
    });

    it("does not charge an ADMIN-initiated cancellation, even past the deadline", async () => {
      const school = await seedSchool(db.prisma);
      await db.prisma.schoolConfig.update({
        where: { schoolId: school.id },
        data: { lateCancelPenaltyPerHour: 50 },
      });
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      // Fake Date only — leave timer/socket primitives real so PGlite's
      // pg socket doesn't lose its heartbeat.
      jest
        .useFakeTimers({
          doNotFake: [
            "setTimeout",
            "setInterval",
            "setImmediate",
            "queueMicrotask",
            "nextTick",
          ],
        })
        .setSystemTime(new Date("2030-01-06T08:00:00.000Z"));

      await service.cancel(school.id, lessonId, "admin-id", Role.ADMIN);

      const profile = await db.prisma.studentProfile.findUniqueOrThrow({
        where: { id: student.studentProfileId },
      });
      expect(Number(profile.outstandingBalance)).toBe(0);
    });

    it.each([
      LessonStatus.COMPLETED,
      LessonStatus.CANCELLED,
      LessonStatus.REJECTED,
    ])("rejects cancellation when current status is %s", async (status) => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status },
      });

      await expect(
        service.cancel(school.id, lessonId, student.userId, Role.STUDENT),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // Multi-tenant invariant: every single-row write method must refuse a lesson
  // belonging to a different school. They all share the same
  // `where: { id, schoolId }` shape, so one parameterized test locks the
  // pattern. (assignVehicle / complete are tested separately above with the
  // full cross-school setup.)
  describe("single-row methods refuse a lesson in another school", () => {
    async function setupForeignLesson() {
      const a = await seedSchool(db.prisma);
      const b = await seedSchool(db.prisma);
      const instructor = await a.addInstructor();
      const student = await a.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });
      await db.prisma.lesson.update({
        where: { id: lessonId },
        data: { status: LessonStatus.PENDING },
      });
      return { a, b, lessonId, instructor, student };
    }

    it("cancel → NotFound", async () => {
      const { b, lessonId, student } = await setupForeignLesson();
      await expect(
        service.cancel(b.id, lessonId, student.userId, Role.STUDENT),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("confirm → NotFound", async () => {
      const { b, lessonId, instructor } = await setupForeignLesson();
      await expect(
        service.confirm(b.id, lessonId, instructor.userId, Role.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("reject → NotFound", async () => {
      const { b, lessonId, instructor } = await setupForeignLesson();
      await expect(
        service.reject(b.id, lessonId, instructor.userId, Role.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("getCancellationInfo → NotFound", async () => {
      const { b, lessonId } = await setupForeignLesson();
      await expect(
        service.getCancellationInfo(b.id, lessonId, Role.ADMIN),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("getAvailableVehicles → NotFound", async () => {
      const { b, lessonId, instructor } = await setupForeignLesson();
      await expect(
        service.getAvailableVehicles(
          b.id,
          lessonId,
          instructor.userId,
          Role.ADMIN,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("assignVehicle → NotFound", async () => {
      const { b, lessonId } = await setupForeignLesson();
      await expect(
        service.assignVehicle(b.id, lessonId, {
          vehicleId: b.vehicleId,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("assignVehicle", () => {
    it("assigns a matching vehicle to a SCHEDULED lesson", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      const result = await service.assignVehicle(school.id, lessonId, {
        vehicleId: school.vehicleId,
      });

      expect(result.vehicleId).toBe(school.vehicleId);
    });

    it("allows re-assigning the same vehicle to the same lesson (self-overlap excluded)", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
        vehicleId: school.vehicleId,
      });

      const result = await service.assignVehicle(school.id, lessonId, {
        vehicleId: school.vehicleId,
      });

      expect(result.vehicleId).toBe(school.vehicleId);
    });

    it.each([
      LessonStatus.PENDING,
      LessonStatus.COMPLETED,
      LessonStatus.CANCELLED,
      LessonStatus.REJECTED,
    ])(
      "rejects when current lesson status is %s (not SCHEDULED)",
      async (status) => {
        const school = await seedSchool(db.prisma);
        const instructor = await school.addInstructor();
        const student = await school.addStudent();
        const lessonId = await student.bookLesson({
          instructorProfileId: instructor.instructorProfileId,
          startTime: FUTURE_START,
          endTime: FUTURE_END,
        });
        await db.prisma.lesson.update({
          where: { id: lessonId },
          data: { status },
        });

        await expect(
          service.assignVehicle(school.id, lessonId, {
            vehicleId: school.vehicleId,
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      },
    );

    it("rejects with 404 when the vehicle does not exist", async () => {
      const school = await seedSchool(db.prisma);
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(
        service.assignVehicle(school.id, lessonId, {
          vehicleId: "00000000-0000-0000-0000-000000000000",
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects when the vehicle belongs to a different school", async () => {
      const a = await seedSchool(db.prisma);
      const b = await seedSchool(db.prisma);
      const instructor = await a.addInstructor();
      const student = await a.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(
        service.assignVehicle(a.id, lessonId, { vehicleId: b.vehicleId }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the vehicle's category does not match the course", async () => {
      const school = await seedSchool(db.prisma);
      const otherCategory = await db.prisma.category.create({
        data: {
          name: `OTHER-${school.id.slice(0, 8)}`,
          schools: { connect: { id: school.id } },
        },
      });
      const wrongVehicleId = await school.addVehicle({
        categoryId: otherCategory.id,
      });
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(
        service.assignVehicle(school.id, lessonId, {
          vehicleId: wrongVehicleId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the vehicle's transmission does not match the course", async () => {
      const school = await seedSchool(db.prisma);
      const manualVehicleId = await school.addVehicle({
        transmission: Transmission.MANUAL,
      });
      const instructor = await school.addInstructor();
      const student = await school.addStudent();
      const lessonId = await student.bookLesson({
        instructorProfileId: instructor.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(
        service.assignVehicle(school.id, lessonId, {
          vehicleId: manualVehicleId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when the vehicle is already booked by an overlapping active lesson", async () => {
      const school = await seedSchool(db.prisma);
      const a = await school.addInstructor();
      const b = await school.addInstructor();
      const other = await school.addStudent();
      const student = await school.addStudent();

      // Vehicle is held by another lesson at the same time
      await other.bookLesson({
        instructorProfileId: a.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
        vehicleId: school.vehicleId,
      });
      const lessonId = await student.bookLesson({
        instructorProfileId: b.instructorProfileId,
        startTime: FUTURE_START,
        endTime: FUTURE_END,
      });

      await expect(
        service.assignVehicle(school.id, lessonId, {
          vehicleId: school.vehicleId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
