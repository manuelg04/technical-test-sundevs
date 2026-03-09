import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class SelectedModifierOptionDocumentModel {
  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  priceCents!: number;
}

const SelectedModifierOptionSchema = SchemaFactory.createForClass(
  SelectedModifierOptionDocumentModel,
);

@Schema({ _id: false })
export class SelectedModifierGroupDocumentModel {
  @Prop({ required: true })
  groupCode!: string;

  @Prop({ required: true })
  groupName!: string;

  @Prop({ type: [SelectedModifierOptionSchema], default: [] })
  selections!: SelectedModifierOptionDocumentModel[];
}

const SelectedModifierGroupSchema = SchemaFactory.createForClass(
  SelectedModifierGroupDocumentModel,
);

@Schema({ _id: false })
export class OrderItemDocumentModel {
  @Prop({ required: true })
  itemId!: string;

  @Prop({ required: true })
  menuItemCode!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  basePriceCents!: number;

  @Prop({ required: true })
  lineUnitTotalCents!: number;

  @Prop({ type: [SelectedModifierGroupSchema], default: [] })
  modifierGroups!: SelectedModifierGroupDocumentModel[];
}

const OrderItemSchema = SchemaFactory.createForClass(OrderItemDocumentModel);

@Schema({ _id: false })
export class PricingSnapshotDocumentModel {
  @Prop({ required: true })
  subtotalCents!: number;

  @Prop({ required: true })
  serviceFeeCents!: number;

  @Prop({ required: true })
  totalCents!: number;
}

const PricingSnapshotSchema = SchemaFactory.createForClass(
  PricingSnapshotDocumentModel,
);

@Schema({
  collection: 'orders',
  timestamps: true,
})
export class OrderDocumentModel {
  @Prop({ required: true, unique: true })
  orderId!: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({
    required: true,
    enum: ['DRAFT', 'PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED'],
  })
  status!: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItemDocumentModel[];

  @Prop({ type: PricingSnapshotSchema, default: null })
  pricing!: PricingSnapshotDocumentModel | null;

  @Prop()
  correlationId?: string;
}

export type OrderDocument = HydratedDocument<OrderDocumentModel>;
export const OrderSchema = SchemaFactory.createForClass(OrderDocumentModel);
OrderSchema.index({ userId: 1, status: 1, updatedAt: -1 });
export const ORDER_MODEL = OrderDocumentModel.name;
