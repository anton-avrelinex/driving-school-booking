import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import type {
  AuthSessionDto,
  JwtPayload,
  UserDto,
} from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import { USER_SELECT } from "../user/user.selects";
import { toUserDto } from "../user/user.mappers";
import type { UserModel } from "../generated/prisma/models/User";
import { UserStatus } from "../generated/prisma/enums";
import { BCRYPT_ROUNDS } from "../common/auth-constants";

export interface AuthResult {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  session: AuthSessionDto;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: { email, status: UserStatus.ACTIVE },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.buildAuthResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    try {
      const payload: JwtPayload = this.jwt.verify(refreshToken, {
        secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (user?.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException();
      }

      return this.buildAuthResult(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    return this.buildAuthResult(updatedUser);
  }

  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_SELECT,
    });

    return toUserDto(user);
  }

  async updateProfile(
    userId: string,
    schoolId: string,
    data: { firstName?: string; lastName?: string; email?: string },
  ): Promise<UserDto> {
    if (data.email) {
      const existing = await this.prisma.user.findUnique({
        where: { schoolId_email: { schoolId, email: data.email } },
      });

      if (existing && existing.id !== userId) {
        throw new ConflictException("A user with this email already exists");
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: USER_SELECT,
    });

    return toUserDto(user);
  }

  private buildAuthResult(user: UserModel): AuthResult {
    const payload = {
      sub: user.id,
      schoolId: user.schoolId,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    const accessToken = this.jwt.sign(payload);

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: this.config.getOrThrow<string>(
        "JWT_REFRESH_EXPIRATION",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any,
    });

    return {
      tokens: { accessToken, refreshToken },
      session: {
        id: user.id,
        schoolId: user.schoolId,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
      },
    };
  }
}
