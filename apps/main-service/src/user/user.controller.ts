import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { Role } from "../generated/prisma/enums";
import type { AuthenticatedRequest } from "../auth/authenticated-request.interface";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto, @Request() req: AuthenticatedRequest) {
    return this.userService.create(req.user.schoolId, dto);
  }

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

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.userService.update(req.user.schoolId, id, dto);
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string, @Request() req: AuthenticatedRequest) {
    return this.userService.deactivate(req.user.schoolId, id);
  }
}
