import { Module } from "@nestjs/common";
import { UserModule } from "../user/user.module";
import { StudentService } from "./student.service";
import { StudentController } from "./student.controller";

@Module({
  imports: [UserModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
