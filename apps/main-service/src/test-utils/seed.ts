import { randomUUID } from "node:crypto";
import type { PrismaClient, Prisma } from "../generated/prisma/client";

export interface SchoolHandle {
  id: string;
  categoryId: string;
  courseId: string;
  vehicleId: string;
  addVehicle(
    overrides?: Partial<Prisma.VehicleUncheckedCreateInput>,
  ): Promise<string>;
  addInstructor(
    overrides?: Partial<Prisma.UserUncheckedCreateInput>,
  ): Promise<InstructorHandle>;
  addStudent(
    overrides?: Partial<Prisma.UserUncheckedCreateInput>,
  ): Promise<StudentHandle>;
}

export interface InstructorHandle {
  userId: string;
  instructorProfileId: string;
  setAvailability(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ): Promise<void>;
}

export interface StudentHandle {
  userId: string;
  studentProfileId: string;
  enrollmentId: string;
  bookLesson(args: {
    instructorProfileId: string;
    startTime: Date;
    endTime: Date;
    vehicleId?: string | null;
  }): Promise<string>;
}

// Provisions a school + default category + course + ONE vehicle. Tests that
// care about vehicle scarcity rely on this default; tests that need more
// capacity call school.addVehicle().
export async function seedSchool(
  prisma: PrismaClient,
  overrides: Partial<Prisma.SchoolCreateInput> = {},
): Promise<SchoolHandle> {
  const school = await prisma.school.create({
    data: { name: "Test School", ...overrides },
  });
  await prisma.schoolConfig.create({ data: { schoolId: school.id } });

  const category = await prisma.category.create({
    data: {
      name: `B-${school.id.slice(0, 8)}`,
      schools: { connect: { id: school.id } },
    },
  });

  const course = await prisma.course.create({
    data: {
      schoolId: school.id,
      name: "Course",
      price: 100,
      hours: 30,
      categoryId: category.id,
      transmission: "AUTOMATIC",
    },
  });

  const vehicleId = await createVehicle(prisma, school.id, category.id);

  return {
    id: school.id,
    categoryId: category.id,
    courseId: course.id,
    vehicleId,
    addVehicle: (extra = {}) =>
      createVehicle(prisma, school.id, category.id, extra),
    addInstructor: async (extra = {}) =>
      createInstructor(prisma, school.id, course.id, extra),
    addStudent: async (extra = {}) =>
      createStudent(prisma, school.id, course.id, extra),
  };
}

async function createVehicle(
  prisma: PrismaClient,
  schoolId: string,
  categoryId: string,
  overrides: Partial<Prisma.VehicleUncheckedCreateInput> = {},
): Promise<string> {
  const vehicle = await prisma.vehicle.create({
    data: {
      schoolId,
      categoryId,
      make: "VW",
      model: "Golf",
      licensePlate: `PL-${randomUUID().slice(0, 6)}`,
      transmission: "AUTOMATIC",
      ...overrides,
    },
  });
  return vehicle.id;
}

async function createInstructor(
  prisma: PrismaClient,
  schoolId: string,
  courseId: string,
  overrides: Partial<Prisma.UserUncheckedCreateInput> = {},
): Promise<InstructorHandle> {
  const user = await prisma.user.create({
    data: {
      schoolId,
      email: `inst-${randomUUID().slice(0, 6)}@test.dev`,
      passwordHash: "x",
      firstName: "Inst",
      lastName: "Ructor",
      role: "INSTRUCTOR",
      status: "ACTIVE",
      mustChangePassword: false,
      ...overrides,
      instructorProfile: {
        create: { courses: { connect: { id: courseId } } },
      },
    },
    include: { instructorProfile: true },
  });
  const instructorProfileId = user.instructorProfile!.id;

  return {
    userId: user.id,
    instructorProfileId,
    setAvailability: async (dayOfWeek, startTime, endTime) => {
      await prisma.instructorAvailability.create({
        data: {
          instructorId: instructorProfileId,
          dayOfWeek,
          startTime,
          endTime,
        },
      });
    },
  };
}

async function createStudent(
  prisma: PrismaClient,
  schoolId: string,
  courseId: string,
  overrides: Partial<Prisma.UserUncheckedCreateInput> = {},
): Promise<StudentHandle> {
  const user = await prisma.user.create({
    data: {
      schoolId,
      email: `stu-${randomUUID().slice(0, 6)}@test.dev`,
      passwordHash: "x",
      firstName: "Stu",
      lastName: "Dent",
      role: "STUDENT",
      status: "ACTIVE",
      mustChangePassword: false,
      ...overrides,
      studentProfile: { create: {} },
    },
    include: { studentProfile: true },
  });
  const studentProfileId = user.studentProfile!.id;

  const enrollment = await prisma.enrollment.create({
    data: {
      schoolId,
      studentProfileId,
      courseId,
      hoursPurchased: 30,
      hoursCompleted: 0,
      status: "ACTIVE",
    },
  });

  return {
    userId: user.id,
    studentProfileId,
    enrollmentId: enrollment.id,
    bookLesson: async (args) => {
      const lesson = await prisma.lesson.create({
        data: {
          schoolId,
          enrollmentId: enrollment.id,
          instructorId: args.instructorProfileId,
          vehicleId: args.vehicleId ?? null,
          startTime: args.startTime,
          endTime: args.endTime,
          status: "SCHEDULED",
        },
      });
      return lesson.id;
    },
  };
}
