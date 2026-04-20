import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health.controller";
import { HealthCheckRunnerService } from "./health-check-runner.service";
import { HealthSummaryService } from "./health-summary.service";
import { HealthCheck, HealthCheckSchema } from "../schemas/health-check.schema";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: HealthCheck.name, schema: HealthCheckSchema },
    ]),
  ],
  controllers: [HealthController],
  providers: [HealthCheckRunnerService, HealthSummaryService],
  exports: [MongooseModule],
})
export class HealthModule {}
