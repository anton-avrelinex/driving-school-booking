import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Job } from "bullmq";
import {
  REQUEST_LOG_QUEUE,
  type RequestLogDto,
} from "@driving-school-booking/shared-types";
import { RequestLog } from "./request-log.schema";

@Processor(REQUEST_LOG_QUEUE)
export class RequestLogProcessor extends WorkerHost {
  constructor(
    @InjectModel(RequestLog.name)
    private readonly requestLogModel: Model<RequestLog>,
  ) {
    super();
  }

  async process(job: Job<RequestLogDto>): Promise<void> {
    await this.requestLogModel.create(job.data);
  }
}
