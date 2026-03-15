import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";

@Module({
  imports: [UserModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
