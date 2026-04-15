import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import {
  LOG_TYPES,
  type LogLevel,
  type Service,
} from "@driving-school-booking/shared-types";

export type LogDocument = HydratedDocument<Log>;

@Schema({
  collection: "logs",
  timestamps: false,
  discriminatorKey: "type",
})
export class Log {
  @Prop({ required: true, enum: Object.values(LOG_TYPES) })
  type!: string;

  @Prop({ required: true })
  service!: Service;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ type: String, default: null })
  userId!: string | null;

  @Prop({ type: String, default: null })
  schoolId!: string | null;
}

export const LogSchema = SchemaFactory.createForClass(Log);
LogSchema.index({ timestamp: -1, service: 1, type: 1 });
LogSchema.index({ message: "text" }, { sparse: true });
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

@Schema()
export class RequestLogEntry {
  @Prop({ required: true })
  method!: string;

  @Prop({ required: true })
  path!: string;

  @Prop({ required: true })
  statusCode!: number;

  @Prop({ required: true })
  durationMs!: number;
}

export const RequestLogEntrySchema =
  SchemaFactory.createForClass(RequestLogEntry);

@Schema()
export class AppLogEntry {
  @Prop({ required: true })
  level!: LogLevel;

  @Prop({ required: true })
  message!: string;

  @Prop({ type: Object, default: null })
  context!: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  stack!: string | null;
}

export const AppLogEntrySchema = SchemaFactory.createForClass(AppLogEntry);
