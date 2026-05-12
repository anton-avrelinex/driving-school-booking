import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request as ExpressRequest, Response } from "express";
import type { TokenResponseDto } from "@driving-school-booking/shared-types";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { accessToken, refreshToken } = await this.auth.login(
      dto.email,
      dto.password,
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return { accessToken };
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post("refresh")
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const cookies = req.cookies as Record<string, string | undefined>;
    const incoming = cookies[REFRESH_COOKIE_NAME];
    if (!incoming) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const { accessToken, refreshToken } = await this.auth.refresh(incoming);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return { accessToken };
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.auth.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.auth.updateProfile(req.user.sub, req.user.schoolId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenResponseDto> {
    const { accessToken, refreshToken } = await this.auth.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
    return { accessToken };
  }
}
