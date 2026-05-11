import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const MIGRATIONS_DIR = join(__dirname, "..", "..", "prisma", "migrations");

export interface TestDb {
  prisma: PrismaClient;
  truncate(): Promise<void>;
  close(): Promise<void>;
}

export async function createTestDb(): Promise<TestDb> {
  const raw = new PGlite();
  await raw.waitReady;

  const dirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));
  for (const dir of dirs) {
    const file = join(MIGRATIONS_DIR, dir, "migration.sql");
    try {
      await raw.exec(readFileSync(file, "utf8"));
    } catch (err) {
      throw new Error(
        `Failed to apply migration ${dir}: ${(err as Error).message}`,
        {
          cause: err,
        },
      );
    }
  }

  const port = 5500 + Number(process.env.JEST_WORKER_ID ?? 1);
  const server = new PGLiteSocketServer({ db: raw, port, host: "127.0.0.1" });
  await server.start();

  const adapter = new PrismaPg({
    connectionString: `postgres://postgres:postgres@127.0.0.1:${port}/postgres`,
  });
  const prisma = new PrismaClient({ adapter });

  return {
    prisma,
    async truncate() {
      await raw.exec(`
        TRUNCATE TABLE
          lessons, "instructor_availabilities", enrollments,
          "_CourseToInstructorProfile", "_InstructorProfileToVehicle",
          vehicles, courses,
          "instructor_profiles", "student_profiles", "admin_profiles",
          users, "school_configs", schools, categories
        RESTART IDENTITY CASCADE;
      `);
    },
    async close() {
      await prisma.$disconnect();
      await server.stop();
      await raw.close();
    },
  };
}
