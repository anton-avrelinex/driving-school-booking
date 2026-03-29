import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type RequestLogDocument = HydratedDocument<RequestLog>;

@Schema({ collection: "request_logs", timestamps: false })
export class RequestLog {
  @Prop({ required: true })
  method!: string;

  @Prop({ required: true })
  path!: string;

  @Prop({ required: true })
  statusCode!: number;

  @Prop({ required: true })
  durationMs!: number;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ type: String, default: null })
  userId!: string | null;

  @Prop({ type: String, default: null })
  schoolId!: string | null;
}

export const RequestLogSchema = SchemaFactory.createForClass(RequestLog);
