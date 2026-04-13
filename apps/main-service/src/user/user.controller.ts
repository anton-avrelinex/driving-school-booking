import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import { UserService } from "./user.service";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { Role } from "../generated/prisma/enums";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll(
    @Query() query: ListUsersQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.findAll(req.user.schoolId, query);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.userService.findOne(req.user.schoolId, id);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.userService.deactivate(req.user.schoolId, id);
  }
}
