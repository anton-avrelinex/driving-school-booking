import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import type { Service } from "@driving-school-booking/shared-types";

export type AnalyticsEventDocument = HydratedDocument<AnalyticsEvent>;

@Schema({ collection: "analytics_events", timestamps: false })
export class AnalyticsEvent {
  @Prop({ required: true })
  event!: string;

  @Prop({ required: true })
  service!: Service;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ type: String, default: null })
  userId!: string | null;

  @Prop({ type: String, default: null })
  schoolId!: string | null;

  @Prop({ type: Object, default: null })
  properties!: Record<string, unknown> | null;

  @Prop({ type: String, default: null })
  sessionId!: string | null;
}

export const AnalyticsEventSchema =
  SchemaFactory.createForClass(AnalyticsEvent);

AnalyticsEventSchema.index({ timestamp: -1, event: 1 });
AnalyticsEventSchema.index({ sessionId: 1 }, { sparse: true });
AnalyticsEventSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);
