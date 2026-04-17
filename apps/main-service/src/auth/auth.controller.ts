import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
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
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.auth.changePassword(
      req.user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
