import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import {
  PrismaClient,
  Role,
  Transmission,
  LessonStatus,
  EnrollmentStatus,
  UserStatus,
} from "../src/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCHOOL_ID = "seed-school-id";
const SCHOOL_NAME = "Demo Driving School";
const ADMIN_EMAIL = "admin@demo.com";

// Anchored to UTC midnight so re-running the seed at different times of day
// doesn't shift the demo timeline.
const TODAY = new Date();
TODAY.setUTCHours(0, 0, 0, 0);

function dayOffset(days: number, hourUtc: number): Date {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d;
}

// Categories live in the DB via the seed_categories migration; this seed only
// links three of them to the demo school.
const SCHOOL_CATEGORY_NAMES = ["B", "A", "AM"];

interface CourseSpec {
  key: string;
  name: string;
  categoryName: string;
  transmission: Transmission;
  hours: number;
  price: number;
}

const COURSES: CourseSpec[] = [
  {
    key: "B_AUTO",
    name: "Car (B) — Automatic",
    categoryName: "B",
    transmission: Transmission.AUTOMATIC,
    hours: 30,
    price: 1500,
  },
  {
    key: "B_MAN",
    name: "Car (B) — Manual",
    categoryName: "B",
    transmission: Transmission.MANUAL,
    hours: 30,
    price: 1700,
  },
  {
    key: "A_MOTO",
    name: "Motorcycle (A)",
    categoryName: "A",
    transmission: Transmission.MANUAL,
    hours: 20,
    price: 1200,
  },
];

interface VehicleSpec {
  plate: string;
  make: string;
  model: string;
  categoryName: string;
  transmission: Transmission;
}

const VEHICLES: VehicleSpec[] = [
  {
    plate: "B-AUTO-01",
    make: "Volkswagen",
    model: "Golf",
    categoryName: "B",
    transmission: Transmission.AUTOMATIC,
  },
  {
    plate: "B-AUTO-02",
    make: "Toyota",
    model: "Yaris",
    categoryName: "B",
    transmission: Transmission.AUTOMATIC,
  },
  {
    plate: "B-AUTO-03",
    make: "Peugeot",
    model: "208",
    categoryName: "B",
    transmission: Transmission.AUTOMATIC,
  },
  {
    plate: "B-MAN-01",
    make: "Opel",
    model: "Astra",
    categoryName: "B",
    transmission: Transmission.MANUAL,
  },
  {
    plate: "A-MOTO-01",
    make: "Honda",
    model: "CB500F",
    categoryName: "A",
    transmission: Transmission.MANUAL,
  },
];

interface InstructorSpec {
  email: string;
  firstName: string;
  lastName: string;
  instructorNumber: string;
  courses: string[];
  vehiclePlates: string[];
  // HH:MM is wall-clock in the school's timezone, not UTC.
  availability: { dayOfWeek: number; startTime: string; endTime: string }[];
}

const INSTRUCTORS: InstructorSpec[] = [
  {
    email: "erik@demo.com",
    firstName: "Erik",
    lastName: "Vandermeer",
    instructorNumber: "DSI-001",
    courses: ["B_AUTO", "B_MAN"],
    vehiclePlates: ["B-AUTO-01", "B-AUTO-02", "B-MAN-01"],
    availability: [
      { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
      { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
    ],
  },
  {
    email: "maria@demo.com",
    firstName: "Maria",
    lastName: "Bakker",
    instructorNumber: "DSI-002",
    courses: ["B_AUTO", "A_MOTO"],
    vehiclePlates: ["B-AUTO-02", "B-AUTO-03", "A-MOTO-01"],
    availability: [
      { dayOfWeek: 2, startTime: "10:00", endTime: "18:00" },
      { dayOfWeek: 3, startTime: "10:00", endTime: "18:00" },
      { dayOfWeek: 4, startTime: "10:00", endTime: "18:00" },
      { dayOfWeek: 5, startTime: "10:00", endTime: "18:00" },
      { dayOfWeek: 6, startTime: "10:00", endTime: "18:00" },
    ],
  },
  {
    email: "lars@demo.com",
    firstName: "Lars",
    lastName: "Jansen",
    instructorNumber: "DSI-003",
    courses: ["B_AUTO", "B_MAN", "A_MOTO"],
    vehiclePlates: ["B-AUTO-01", "B-AUTO-03", "B-MAN-01", "A-MOTO-01"],
    availability: [
      { dayOfWeek: 1, startTime: "08:00", endTime: "16:00" },
      { dayOfWeek: 2, startTime: "08:00", endTime: "16:00" },
      { dayOfWeek: 3, startTime: "08:00", endTime: "16:00" },
      { dayOfWeek: 4, startTime: "08:00", endTime: "16:00" },
    ],
  },
];

interface StudentSpec {
  email: string;
  firstName: string;
  lastName: string;
  courseKey: string;
}

const STUDENTS: StudentSpec[] = [
  {
    email: "sophie@demo.com",
    firstName: "Sophie",
    lastName: "de Jong",
    courseKey: "B_AUTO",
  },
  {
    email: "tom@demo.com",
    firstName: "Tom",
    lastName: "van Dijk",
    courseKey: "B_MAN",
  },
  {
    email: "anna@demo.com",
    firstName: "Anna",
    lastName: "Visser",
    courseKey: "B_AUTO",
  },
  {
    email: "lukas@demo.com",
    firstName: "Lukas",
    lastName: "Mueller",
    courseKey: "A_MOTO",
  },
  {
    email: "emma@demo.com",
    firstName: "Emma",
    lastName: "Schmidt",
    courseKey: "B_AUTO",
  },
];

// Hand-curated so no instructor/student/vehicle is ever double-booked. Times
// are UTC; school TZ is Europe/Amsterdam, so the visible local day is the
// same (UTC is ahead of Amsterdam for most of these hours, but never enough
// to flip the calendar date for these working-hour slots).
interface LessonSpec {
  studentEmail: string;
  instructorEmail: string;
  vehiclePlate: string;
  daysFromToday: number;
  hourUtc: number;
  status: LessonStatus;
}

const LESSONS: LessonSpec[] = [
  {
    studentEmail: "sophie@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-AUTO-01",
    daysFromToday: -28,
    hourUtc: 9,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "tom@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-MAN-01",
    daysFromToday: -28,
    hourUtc: 13,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "anna@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "B-AUTO-03",
    daysFromToday: -25,
    hourUtc: 9,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "sophie@demo.com",
    instructorEmail: "maria@demo.com",
    vehiclePlate: "B-AUTO-02",
    daysFromToday: -22,
    hourUtc: 11,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "lukas@demo.com",
    instructorEmail: "maria@demo.com",
    vehiclePlate: "A-MOTO-01",
    daysFromToday: -21,
    hourUtc: 13,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "tom@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "B-MAN-01",
    daysFromToday: -18,
    hourUtc: 9,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "anna@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-AUTO-01",
    daysFromToday: -17,
    hourUtc: 11,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "sophie@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-AUTO-02",
    daysFromToday: -15,
    hourUtc: 14,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "tom@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "B-MAN-01",
    daysFromToday: -14,
    hourUtc: 11,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "anna@demo.com",
    instructorEmail: "maria@demo.com",
    vehiclePlate: "B-AUTO-03",
    daysFromToday: -11,
    hourUtc: 13,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "lukas@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "A-MOTO-01",
    daysFromToday: -10,
    hourUtc: 9,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "sophie@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-AUTO-01",
    daysFromToday: -8,
    hourUtc: 11,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "tom@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-MAN-01",
    daysFromToday: -7,
    hourUtc: 9,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "anna@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "B-AUTO-03",
    daysFromToday: -4,
    hourUtc: 11,
    status: LessonStatus.COMPLETED,
  },
  {
    studentEmail: "sophie@demo.com",
    instructorEmail: "maria@demo.com",
    vehiclePlate: "B-AUTO-02",
    daysFromToday: -3,
    hourUtc: 13,
    status: LessonStatus.COMPLETED,
  },

  {
    studentEmail: "sophie@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-AUTO-01",
    daysFromToday: 2,
    hourUtc: 9,
    status: LessonStatus.SCHEDULED,
  },
  {
    studentEmail: "tom@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "B-MAN-01",
    daysFromToday: 2,
    hourUtc: 11,
    status: LessonStatus.SCHEDULED,
  },
  {
    studentEmail: "anna@demo.com",
    instructorEmail: "maria@demo.com",
    vehiclePlate: "B-AUTO-03",
    daysFromToday: 3,
    hourUtc: 13,
    status: LessonStatus.SCHEDULED,
  },
  {
    studentEmail: "lukas@demo.com",
    instructorEmail: "maria@demo.com",
    vehiclePlate: "A-MOTO-01",
    daysFromToday: 4,
    hourUtc: 11,
    status: LessonStatus.SCHEDULED,
  },
  {
    studentEmail: "sophie@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-AUTO-02",
    daysFromToday: 7,
    hourUtc: 14,
    status: LessonStatus.SCHEDULED,
  },
  {
    studentEmail: "tom@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "B-MAN-01",
    daysFromToday: 8,
    hourUtc: 9,
    status: LessonStatus.SCHEDULED,
  },
  {
    studentEmail: "anna@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "B-AUTO-01",
    daysFromToday: 9,
    hourUtc: 9,
    status: LessonStatus.SCHEDULED,
  },
  {
    studentEmail: "lukas@demo.com",
    instructorEmail: "lars@demo.com",
    vehiclePlate: "A-MOTO-01",
    daysFromToday: 10,
    hourUtc: 11,
    status: LessonStatus.SCHEDULED,
  },

  {
    studentEmail: "emma@demo.com",
    instructorEmail: "erik@demo.com",
    vehiclePlate: "",
    daysFromToday: 5,
    hourUtc: 11,
    status: LessonStatus.PENDING,
  },
  {
    studentEmail: "emma@demo.com",
    instructorEmail: "maria@demo.com",
    vehiclePlate: "",
    daysFromToday: 6,
    hourUtc: 13,
    status: LessonStatus.PENDING,
  },
];

const LESSON_DURATION_MIN = 120;

type CategoryMap = Record<string, { id: string }>;
type CourseMap = Record<string, { id: string; hours: number }>;
type VehicleMap = Record<string, { id: string }>;
type InstructorMap = Record<string, { userId: string; profileId: string }>;
type StudentMap = Record<
  string,
  { userId: string; profileId: string; courseKey: string }
>;
type EnrollmentMap = Record<string, { id: string; courseHours: number }>;

async function main() {
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "INITIAL_ADMIN_PASSWORD is required (the seed creates the demo school's first admin user). Set it in your .env or compose env.",
    );
  }
  const demoUsersPassword = process.env.DEMO_USERS_PASSWORD;

  const school = await upsertSchoolWithConfig();
  await upsertAdmin(school.id, adminPassword);

  if (!demoUsersPassword) {
    // eslint-disable-next-line no-console
    console.log(
      `Seed complete (admin only).
  School: ${SCHOOL_NAME} (id=${school.id})
  Admin:  ${ADMIN_EMAIL}
  (Set DEMO_USERS_PASSWORD to also populate demo instructors/students/lessons.)`,
    );
    return;
  }

  const categories = await linkCategoriesToSchool(school.id);
  const courses = await upsertCourses(school.id, categories);
  const vehicles = await upsertVehicles(school.id, categories);
  const instructors = await upsertInstructors(
    school.id,
    courses,
    vehicles,
    demoUsersPassword,
  );
  const students = await upsertStudents(school.id, demoUsersPassword);
  await wipeDemoEnrollmentsAndLessons(school.id);
  const enrollments = await createEnrollments(school.id, students, courses);
  const hoursPerStudent = await createLessons(
    school.id,
    instructors,
    vehicles,
    enrollments,
  );
  await tallyCompletedHours(enrollments, hoursPerStudent);
  printSummary(school.id);
}

async function upsertSchoolWithConfig() {
  const school = await prisma.school.upsert({
    where: { id: SCHOOL_ID },
    update: { name: SCHOOL_NAME },
    create: { id: SCHOOL_ID, name: SCHOOL_NAME },
  });
  await prisma.schoolConfig.upsert({
    where: { schoolId: school.id },
    update: {},
    create: { schoolId: school.id },
  });
  return school;
}

async function upsertAdmin(schoolId: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.upsert({
    where: { schoolId_email: { schoolId, email: ADMIN_EMAIL } },
    update: { passwordHash },
    create: {
      schoolId,
      email: ADMIN_EMAIL,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      adminProfile: { create: {} },
    },
  });
  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });
}

async function linkCategoriesToSchool(schoolId: string): Promise<CategoryMap> {
  await prisma.school.update({
    where: { id: schoolId },
    data: {
      categories: { set: SCHOOL_CATEGORY_NAMES.map((name) => ({ name })) },
    },
  });
  const rows = await prisma.category.findMany({
    where: { name: { in: SCHOOL_CATEGORY_NAMES } },
  });
  if (rows.length !== SCHOOL_CATEGORY_NAMES.length) {
    throw new Error(
      `Expected ${SCHOOL_CATEGORY_NAMES.length} categories in the DB (from the seed_categories migration), found ${rows.length}. Did migrations run?`,
    );
  }
  return Object.fromEntries(rows.map((c) => [c.name, { id: c.id }]));
}

async function upsertCourses(
  schoolId: string,
  categories: CategoryMap,
): Promise<CourseMap> {
  const out: CourseMap = {};
  for (const c of COURSES) {
    const categoryId = categories[c.categoryName].id;
    const course = await prisma.course.upsert({
      where: { schoolId_name: { schoolId, name: c.name } },
      update: {
        price: c.price,
        hours: c.hours,
        transmission: c.transmission,
        categoryId,
      },
      create: {
        schoolId,
        name: c.name,
        price: c.price,
        hours: c.hours,
        transmission: c.transmission,
        categoryId,
      },
    });
    out[c.key] = { id: course.id, hours: c.hours };
  }
  return out;
}

async function upsertVehicles(
  schoolId: string,
  categories: CategoryMap,
): Promise<VehicleMap> {
  const out: VehicleMap = {};
  for (const v of VEHICLES) {
    const categoryId = categories[v.categoryName].id;
    const vehicle = await prisma.vehicle.upsert({
      where: { schoolId_licensePlate: { schoolId, licensePlate: v.plate } },
      update: {
        make: v.make,
        model: v.model,
        transmission: v.transmission,
        categoryId,
      },
      create: {
        schoolId,
        licensePlate: v.plate,
        make: v.make,
        model: v.model,
        transmission: v.transmission,
        categoryId,
      },
    });
    out[v.plate] = { id: vehicle.id };
  }
  return out;
}

async function upsertInstructors(
  schoolId: string,
  courses: CourseMap,
  vehicles: VehicleMap,
  password: string,
): Promise<InstructorMap> {
  const out: InstructorMap = {};
  const passwordHash = await bcrypt.hash(password, 10);
  for (const i of INSTRUCTORS) {
    const user = await prisma.user.upsert({
      where: { schoolId_email: { schoolId, email: i.email } },
      update: {
        firstName: i.firstName,
        lastName: i.lastName,
        status: UserStatus.ACTIVE,
      },
      create: {
        schoolId,
        email: i.email,
        passwordHash,
        firstName: i.firstName,
        lastName: i.lastName,
        role: Role.INSTRUCTOR,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
        instructorProfile: { create: { instructorNumber: i.instructorNumber } },
      },
      include: { instructorProfile: true },
    });
    const profile = await ensureInstructorProfile(user, i.instructorNumber);
    await rewireInstructorRelations(profile.id, i, courses, vehicles);
    out[i.email] = { userId: user.id, profileId: profile.id };
  }
  return out;
}

async function ensureInstructorProfile(
  user: {
    id: string;
    instructorProfile: { id: string; instructorNumber: string | null } | null;
  },
  instructorNumber: string,
) {
  if (!user.instructorProfile) {
    return prisma.instructorProfile.create({
      data: { userId: user.id, instructorNumber },
    });
  }
  if (user.instructorProfile.instructorNumber !== instructorNumber) {
    return prisma.instructorProfile.update({
      where: { id: user.instructorProfile.id },
      data: { instructorNumber },
    });
  }
  return user.instructorProfile;
}

async function rewireInstructorRelations(
  profileId: string,
  spec: InstructorSpec,
  courses: CourseMap,
  vehicles: VehicleMap,
) {
  await prisma.instructorProfile.update({
    where: { id: profileId },
    data: {
      courses: { set: spec.courses.map((k) => ({ id: courses[k].id })) },
      vehicles: {
        set: spec.vehiclePlates.map((p) => ({ id: vehicles[p].id })),
      },
    },
  });
  await prisma.instructorAvailability.deleteMany({
    where: { instructorId: profileId },
  });
  if (spec.availability.length > 0) {
    await prisma.instructorAvailability.createMany({
      data: spec.availability.map((a) => ({
        instructorId: profileId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    });
  }
}

async function upsertStudents(
  schoolId: string,
  password: string,
): Promise<StudentMap> {
  const out: StudentMap = {};
  const passwordHash = await bcrypt.hash(password, 10);
  for (const s of STUDENTS) {
    const user = await prisma.user.upsert({
      where: { schoolId_email: { schoolId, email: s.email } },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        status: UserStatus.ACTIVE,
      },
      create: {
        schoolId,
        email: s.email,
        passwordHash,
        firstName: s.firstName,
        lastName: s.lastName,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
        studentProfile: { create: {} },
      },
      include: { studentProfile: true },
    });
    const profile =
      user.studentProfile ??
      (await prisma.studentProfile.create({ data: { userId: user.id } }));
    out[s.email] = {
      userId: user.id,
      profileId: profile.id,
      courseKey: s.courseKey,
    };
  }
  return out;
}

async function wipeDemoEnrollmentsAndLessons(schoolId: string) {
  await prisma.lesson.deleteMany({ where: { schoolId } });
  await prisma.enrollment.deleteMany({ where: { schoolId } });
}

async function createEnrollments(
  schoolId: string,
  students: StudentMap,
  courses: CourseMap,
): Promise<EnrollmentMap> {
  const out: EnrollmentMap = {};
  for (const [email, s] of Object.entries(students)) {
    const course = courses[s.courseKey];
    const enrollment = await prisma.enrollment.create({
      data: {
        schoolId,
        studentProfileId: s.profileId,
        courseId: course.id,
        hoursPurchased: course.hours,
        hoursCompleted: 0,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    out[email] = { id: enrollment.id, courseHours: course.hours };
  }
  return out;
}

async function createLessons(
  schoolId: string,
  instructors: InstructorMap,
  vehicles: VehicleMap,
  enrollments: EnrollmentMap,
): Promise<Record<string, number>> {
  const hoursPerStudent: Record<string, number> = {};
  for (const l of LESSONS) {
    const instructor = instructors[l.instructorEmail];
    const enrollment = enrollments[l.studentEmail];
    const startTime = dayOffset(l.daysFromToday, l.hourUtc);
    const endTime = new Date(
      startTime.getTime() + LESSON_DURATION_MIN * 60_000,
    );
    const vehicleId =
      l.status === LessonStatus.PENDING || l.vehiclePlate === ""
        ? null
        : vehicles[l.vehiclePlate].id;

    await prisma.lesson.create({
      data: {
        schoolId,
        enrollmentId: enrollment.id,
        instructorId: instructor.profileId,
        vehicleId,
        startTime,
        endTime,
        status: l.status,
        ...(l.status === LessonStatus.SCHEDULED && {
          confirmedAt: new Date(startTime.getTime() - 1000 * 60 * 60 * 24),
        }),
        ...(l.status === LessonStatus.COMPLETED && {
          confirmedAt: new Date(startTime.getTime() - 1000 * 60 * 60 * 24),
          completedAt: new Date(endTime.getTime() + 1000 * 60),
        }),
      },
    });

    if (l.status === LessonStatus.COMPLETED) {
      hoursPerStudent[l.studentEmail] =
        (hoursPerStudent[l.studentEmail] ?? 0) + LESSON_DURATION_MIN / 60;
    }
  }
  return hoursPerStudent;
}

async function tallyCompletedHours(
  enrollments: EnrollmentMap,
  hoursPerStudent: Record<string, number>,
) {
  for (const [email, hours] of Object.entries(hoursPerStudent)) {
    const enrollment = enrollments[email];
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        hoursCompleted: hours,
        ...(hours >= enrollment.courseHours && {
          status: EnrollmentStatus.COMPLETED,
        }),
      },
    });
  }
}

function printSummary(schoolId: string) {
  const completed = LESSONS.filter(
    (l) => l.status === LessonStatus.COMPLETED,
  ).length;
  const scheduled = LESSONS.filter(
    (l) => l.status === LessonStatus.SCHEDULED,
  ).length;
  const pending = LESSONS.filter(
    (l) => l.status === LessonStatus.PENDING,
  ).length;
  // eslint-disable-next-line no-console
  console.log(`Seed complete.
  School:      ${SCHOOL_NAME} (id=${schoolId})
  Admin:       ${ADMIN_EMAIL} (password from INITIAL_ADMIN_PASSWORD)
  Instructors: ${INSTRUCTORS.length} (password from DEMO_USERS_PASSWORD)
  Students:    ${STUDENTS.length} (password from DEMO_USERS_PASSWORD)
  Vehicles:    ${VEHICLES.length}
  Courses:     ${COURSES.length}
  Lessons:     ${LESSONS.length} (${completed} completed, ${scheduled} scheduled, ${pending} pending)`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
