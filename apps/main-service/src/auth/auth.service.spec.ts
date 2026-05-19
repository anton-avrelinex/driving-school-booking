import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { createTestDb, type TestDb } from "../test-utils/pglite";
import { seedSchool } from "../test-utils/seed";
import { Role, UserStatus } from "../generated/prisma/enums";
import { BCRYPT_ROUNDS } from "../common/auth-constants";

const ACCESS_SECRET = "test-access-secret";
const REFRESH_SECRET = "test-refresh-secret";

function makeConfig(): ConfigService {
  const values: Record<string, string> = {
    JWT_REFRESH_SECRET: REFRESH_SECRET,
    JWT_REFRESH_EXPIRATION: "7d",
  };
  return {
    getOrThrow: (key: string) => {
      const v = values[key];
      if (v === undefined) {
        throw new Error(`Missing config: ${key}`);
      }
      return v;
    },
  } as unknown as ConfigService;
}

async function makeUser(
  db: TestDb,
  schoolId: string,
  password: string,
  overrides: Partial<{ status: UserStatus; mustChangePassword: boolean }> = {},
) {
  return db.prisma.user.create({
    data: {
      schoolId,
      email: `auth-${Math.random().toString(36).slice(2, 8)}@test.dev`,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      firstName: "Auth",
      lastName: "User",
      role: Role.STUDENT,
      status: overrides.status ?? UserStatus.ACTIVE,
      mustChangePassword: overrides.mustChangePassword ?? false,
    },
  });
}

describe("AuthService", () => {
  let db: TestDb;
  let service: AuthService;

  beforeAll(async () => {
    db = await createTestDb();
    const jwt = new JwtService({
      secret: ACCESS_SECRET,
      signOptions: { expiresIn: "15m" },
    });
    service = new AuthService(db.prisma, jwt, makeConfig());
  });

  beforeEach(async () => {
    await db.truncate();
  });

  afterAll(async () => {
    await db.close();
  });

  describe("login", () => {
    it("returns tokens + session for valid credentials", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "hunter2");

      const result = await service.login(user.email, "hunter2");

      expect(result.tokens.accessToken).toBeTruthy();
      expect(result.tokens.refreshToken).toBeTruthy();
      expect(result.session).toEqual({
        id: user.id,
        schoolId: school.id,
        role: Role.STUDENT,
        mustChangePassword: false,
      });
    });

    it("rejects an unknown email with 401", async () => {
      const school = await seedSchool(db.prisma);
      await makeUser(db, school.id, "hunter2");

      await expect(
        service.login("nobody@test.dev", "hunter2"),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a wrong password with 401", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "hunter2");

      await expect(service.login(user.email, "wrong")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects an INACTIVE user even with correct password", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "hunter2", {
        status: UserStatus.INACTIVE,
      });

      await expect(service.login(user.email, "hunter2")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe("refresh", () => {
    it("issues a new access token AND a new refresh token (rotation)", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "hunter2");
      const first = await service.login(user.email, "hunter2");

      // Small wait so the JWT `iat` differs and the new token is bytewise distinct.
      await new Promise((r) => setTimeout(r, 1100));
      const second = await service.refresh(first.tokens.refreshToken);

      expect(second.tokens.accessToken).not.toBe(first.tokens.accessToken);
      expect(second.tokens.refreshToken).not.toBe(first.tokens.refreshToken);
      expect(second.session.id).toBe(user.id);
    });

    it("rejects a token signed with the wrong secret", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "hunter2");
      const session = await service.login(user.email, "hunter2");
      // Access token is signed with ACCESS_SECRET, not REFRESH_SECRET — using
      // it as a refresh token must fail.
      await expect(
        service.refresh(session.tokens.accessToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects a malformed token", async () => {
      await expect(service.refresh("not-a-jwt")).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects a refresh token for an INACTIVE user", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "hunter2");
      const session = await service.login(user.email, "hunter2");

      await db.prisma.user.update({
        where: { id: user.id },
        data: { status: UserStatus.INACTIVE },
      });

      await expect(
        service.refresh(session.tokens.refreshToken),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("changePassword", () => {
    it("rotates the password and clears mustChangePassword", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "old-pw", {
        mustChangePassword: true,
      });

      const result = await service.changePassword(user.id, "old-pw", "new-pw");

      expect(result.session.mustChangePassword).toBe(false);

      const persisted = await db.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      expect(persisted.mustChangePassword).toBe(false);
      expect(await bcrypt.compare("new-pw", persisted.passwordHash)).toBe(true);
      expect(await bcrypt.compare("old-pw", persisted.passwordHash)).toBe(
        false,
      );
    });

    it("rejects when the current password is wrong", async () => {
      const school = await seedSchool(db.prisma);
      const user = await makeUser(db, school.id, "old-pw");

      await expect(
        service.changePassword(user.id, "wrong", "new-pw"),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // Ensure the password was NOT rotated on a failed attempt.
      const persisted = await db.prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      expect(await bcrypt.compare("old-pw", persisted.passwordHash)).toBe(true);
    });
  });
});
