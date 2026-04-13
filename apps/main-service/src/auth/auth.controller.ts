import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshDto } from "./dto/refresh.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
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
