import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'timelineEvents',
  timestamps: false,
})
export class TimelineEventDocumentModel {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true })
  timestamp!: Date;

  @Prop({ required: true, index: true })
  orderId!: string;

  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ required: true, enum: ['api', 'worker', 'ui'] })
  source!: string;

  @Prop({ required: true })
  correlationId!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;
}

export type TimelineEventDocument =
  HydratedDocument<TimelineEventDocumentModel>;
export const TimelineEventSchema = SchemaFactory.createForClass(
  TimelineEventDocumentModel,
);
TimelineEventSchema.index({ orderId: 1, timestamp: 1, eventId: 1 });
export const TIMELINE_EVENT_MODEL = TimelineEventDocumentModel.name;
