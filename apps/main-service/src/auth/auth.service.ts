import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import type {
  JwtPayload,
  TokenResponseDto,
} from "@driving-school-booking/shared-types";
import { PrismaService } from "../prisma/prisma.service";
import type { UserModel } from "../generated/prisma/models/User";
import { UserStatus } from "../generated/prisma/enums";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: { email, status: UserStatus.ACTIVE },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenResponseDto> {
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

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false },
    });

    return this.generateTokens(updatedUser);
  }

  private generateTokens(user: UserModel): TokenResponseDto {
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

    return { accessToken, refreshToken };
  }
}
