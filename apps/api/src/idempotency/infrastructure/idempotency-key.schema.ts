import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'idempotencyKeys',
  timestamps: true,
})
export class IdempotencyKeyDocumentModel {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  route!: string;

  @Prop({ required: true })
  idempotencyKey!: string;

  @Prop({ required: true })
  requestFingerprint!: string;

  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  responseStatus!: number;
}

export type IdempotencyKeyDocument =
  HydratedDocument<IdempotencyKeyDocumentModel>;
export const IdempotencyKeySchema = SchemaFactory.createForClass(
  IdempotencyKeyDocumentModel,
);
IdempotencyKeySchema.index(
  { userId: 1, route: 1, idempotencyKey: 1 },
  { unique: true },
);
export const IDEMPOTENCY_KEY_MODEL = IdempotencyKeyDocumentModel.name;
