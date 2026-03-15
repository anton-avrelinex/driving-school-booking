import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";

import * as bcrypt from "bcrypt";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const school = await prisma.school.upsert({
    where: { id: "seed-school-id" },
    update: {},
    create: {
      id: "seed-school-id",
      name: "Demo Driving School",
    },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: {
      schoolId_email: {
        schoolId: school.id,
        email: "admin@demo.com",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      email: "admin@demo.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
      mustChangePassword: false,
      adminProfile: {
        create: {},
      },
    },
  });

  // Ensure admin profile exists (for re-runs where user already existed)
  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const categoryNames = [
    "AM",
    "A1",
    "A2",
    "A",
    "B",
    "BE",
    "C1",
    "C1E",
    "C",
    "CE",
    "D1",
    "D1E",
    "D",
    "DE",
  ];

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(
    `Seed complete: admin@demo.com / admin123, ${categoryNames.length} categories`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
