import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type HealthCheckDocument = HydratedDocument<HealthCheck>;

@Schema({ collection: "health_checks", timestamps: false })
export class HealthCheck {
  @Prop({ required: true })
  component!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ required: true })
  status!: string;

  @Prop({ required: true })
  responseTimeMs!: number;

  @Prop({ type: String, default: null })
  error!: string | null;
}

export const HealthCheckSchema = SchemaFactory.createForClass(HealthCheck);

HealthCheckSchema.index({ component: 1, timestamp: -1 });
HealthCheckSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 },
);
