// Multi-tenant isolation regression suite. Every service that takes a schoolId
// must refuse to read or mutate a row belonging to a different school. The
// pattern is `where: { id, schoolId }` (single-row) and `where: { ..., schoolId }`
// (list) — these tests lock that pattern down per resource.
//
// Coverage gap: services whose Prisma SELECT contains deeply nested 1:M
// relations (UserService via USER_SELECT, LessonLifecycleService.findAll via
// LESSON_SELECT, StudentService.update which fans out through USER_SELECT)
// can't be exercised here because PGlite crashes on those query shapes — see
// [[project-pglite-test-quirks]]. Cross-tenant for those services is covered
// indirectly: every single-row read/mutate uses the same `where: { id, schoolId }`
// pattern as VehicleService below, and Lesson lifecycle's single-row methods
// are verified in lesson-lifecycle.service.spec.ts.

import { NotFoundException } from "@nestjs/common";
import { createTestDb, type TestDb } from "./test-utils/pglite";
import { seedSchool } from "./test-utils/seed";
import { VehicleService } from "./vehicle/vehicle.service";

describe("cross-tenant isolation", () => {
  let db: TestDb;
  let vehicleService: VehicleService;

  beforeAll(async () => {
    db = await createTestDb();
    vehicleService = new VehicleService(db.prisma);
  });

  beforeEach(async () => {
    await db.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  describe("VehicleService", () => {
    it("findAll returns only the calling school's vehicles", async () => {
      const a = await seedSchool(db.prisma); // 1 vehicle seeded
      await seedSchool(db.prisma); // 1 vehicle in a different school

      const aVehicles = await vehicleService.findAll(a.id);
      expect(aVehicles.map((v) => v.id)).toEqual([a.vehicleId]);
    });

    it("update refuses to mutate a vehicle in another school", async () => {
      const a = await seedSchool(db.prisma);
      const b = await seedSchool(db.prisma);

      await expect(
        vehicleService.update(a.id, b.vehicleId, { make: "Hacked" }),
      ).rejects.toBeInstanceOf(NotFoundException);

      const persisted = await db.prisma.vehicle.findUniqueOrThrow({
        where: { id: b.vehicleId },
      });
      expect(persisted.make).not.toBe("Hacked");
    });

    it("remove refuses to delete a vehicle in another school", async () => {
      const a = await seedSchool(db.prisma);
      const b = await seedSchool(db.prisma);

      await expect(
        vehicleService.remove(a.id, b.vehicleId),
      ).rejects.toBeInstanceOf(NotFoundException);

      const stillThere = await db.prisma.vehicle.findUnique({
        where: { id: b.vehicleId },
      });
      expect(stillThere).not.toBeNull();
    });
  });
});
