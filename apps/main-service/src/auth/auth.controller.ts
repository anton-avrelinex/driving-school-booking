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
import { randomBytes } from "crypto";
import type { Request as ExpressRequest, Response } from "express";
import type { AuthSessionDto } from "@driving-school-booking/shared-types";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";

const REFRESH_COOKIE_NAME = "refreshToken";
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    const { tokens, session } = await this.auth.login(dto.email, dto.password);
    issueAuthCookies(res, tokens);
    return session;
  }

  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post("refresh")
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionDto> {
    const cookies = req.cookies as Record<string, string | undefined>;
    const incoming = cookies[REFRESH_COOKIE_NAME];
    if (!incoming) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const { tokens, session } = await this.auth.refresh(incoming);
    issueAuthCookies(res, tokens);
    return session;
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response): { ok: true } {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/api" });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    res.clearCookie(CSRF_TOKEN_COOKIE, { path: "/" });
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
  ): Promise<AuthSessionDto> {
    const { tokens, session } = await this.auth.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
    issueAuthCookies(res, tokens);
    return session;
  }
}

const isProd = () => process.env.NODE_ENV === "production";

function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict" as const,
    path: "/api",
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  };
}

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "strict" as const,
    path: "/api/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

function csrfCookieOptions() {
  return {
    httpOnly: false,
    secure: isProd(),
    sameSite: "strict" as const,
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  };
}

function issueAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions());
  res.cookie(
    CSRF_TOKEN_COOKIE,
    randomBytes(32).toString("hex"),
    csrfCookieOptions(),
  );
}
