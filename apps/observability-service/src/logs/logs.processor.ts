import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Job } from "bullmq";
import {
  OBS_LOGS_QUEUE,
  type RequestLogDto,
  type AppLogDto,
} from "@driving-school-booking/shared-types";
import { Log } from "../schemas/log.schema";

@Processor(OBS_LOGS_QUEUE)
export class LogsProcessor extends WorkerHost {
  constructor(
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
  ) {
    super();
  }

  async process(job: Job<RequestLogDto | AppLogDto>): Promise<void> {
    const data = job.data;
    await this.logModel.create({
      ...data,
      timestamp: new Date(data.timestamp),
    });
  }
}
