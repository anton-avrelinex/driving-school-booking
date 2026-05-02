import { Module } from "@nestjs/common";
import { SchoolConfigController } from "./school-config.controller";
import { SchoolConfigService } from "./school-config.service";

@Module({
  controllers: [SchoolConfigController],
  providers: [SchoolConfigService],
  exports: [SchoolConfigService],
})
export class SchoolConfigModule {}
