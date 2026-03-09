import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'outboxEvents',
  timestamps: true,
})
export class OutboxEventDocumentModel {
  @Prop({ required: true, unique: true })
  eventId!: string;

  @Prop({ required: true, index: true })
  aggregateId!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({
    required: true,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  status!: string;

  @Prop({ required: true })
  attempts!: number;

  @Prop({ required: true })
  availableAt!: Date;

  @Prop({ required: true })
  correlationId!: string;

  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  @Prop()
  lastError?: string;
}

export type OutboxEventDocument = HydratedDocument<OutboxEventDocumentModel>;
export const OutboxEventSchema = SchemaFactory.createForClass(
  OutboxEventDocumentModel,
);
OutboxEventSchema.index({ status: 1, availableAt: 1, createdAt: 1 });
export const OUTBOX_EVENT_MODEL = OutboxEventDocumentModel.name;
