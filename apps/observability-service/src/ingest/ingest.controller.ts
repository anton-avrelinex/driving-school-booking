import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from "@driving-school-booking/nestjs-auth";
import { IngestService } from "./ingest.service";
import { IngestLogsDto } from "./dto/ingest-logs.dto";
import { IngestAnalyticsDto } from "./dto/ingest-analytics.dto";

@Controller("ingest")
@UseGuards(JwtAuthGuard)
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post("logs")
  async ingestLogs(
    @Body() body: IngestLogsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.ingestService.ingestLogs(body.logs, req.user);
  }

  @Post("analytics")
  async ingestAnalytics(
    @Body() body: IngestAnalyticsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.ingestService.ingestAnalytics(body.events, req.user);
  }
}
