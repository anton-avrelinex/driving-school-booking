import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { JwtPayload } from "@driving-school-booking/shared-types";
import { Log } from "../schemas/log.schema";
import { AnalyticsEvent } from "../schemas/analytics-event.schema";
import type { AppLogItemDto } from "./dto/ingest-logs.dto";
import type { AnalyticsEventItemDto } from "./dto/ingest-analytics.dto";

@Injectable()
export class IngestService {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsModel: Model<AnalyticsEvent>,
  ) {}

  async ingestLogs(logs: AppLogItemDto[], user: JwtPayload): Promise<void> {
    if (logs.length === 0) return;

    const docs = logs.map((log) => ({
      ...log,
      timestamp: new Date(log.timestamp),
      userId: user.sub,
      schoolId: user.schoolId,
      context: log.context ?? null,
      stack: log.stack ?? null,
    }));

    await this.logModel.insertMany(docs);
  }

  async ingestAnalytics(
    events: AnalyticsEventItemDto[],
    user: JwtPayload,
  ): Promise<void> {
    if (events.length === 0) return;

    const docs = events.map((event) => ({
      ...event,
      timestamp: new Date(event.timestamp),
      userId: user.sub,
      schoolId: user.schoolId,
      properties: event.properties ?? null,
      sessionId: event.sessionId ?? null,
    }));

    await this.analyticsModel.insertMany(docs);
  }
}
