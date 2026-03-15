import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { InstructorService } from "./instructor.service";
import { InstructorController } from "./instructor.controller";

@Module({
  imports: [UserModule],
  controllers: [InstructorController],
  providers: [InstructorService],
})
export class InstructorModule {}
