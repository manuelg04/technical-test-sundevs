import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class ModifierOptionDocumentModel {
  @Prop({ required: true })
  code!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  priceCents!: number;
}

const ModifierOptionSchema = SchemaFactory.createForClass(
  ModifierOptionDocumentModel,
);

@Schema({ _id: false })
export class ModifierGroupDocumentModel {
  @Prop({ required: true, enum: ['protein', 'toppings', 'sauces'] })
  code!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  required!: boolean;

  @Prop({ required: true })
  minSelections!: number;

  @Prop({ required: true })
  maxSelections!: number;

  @Prop({ type: [ModifierOptionSchema], default: [] })
  options!: ModifierOptionDocumentModel[];
}

const ModifierGroupSchema = SchemaFactory.createForClass(
  ModifierGroupDocumentModel,
);

@Schema({
  collection: 'menuItems',
  timestamps: true,
})
export class MenuItemDocumentModel {
  @Prop({ required: true, unique: true })
  code!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  basePriceCents!: number;

  @Prop({ type: [ModifierGroupSchema], default: [] })
  modifierGroups!: ModifierGroupDocumentModel[];
}

export type MenuItemDocument = HydratedDocument<MenuItemDocumentModel>;
export const MenuItemSchema = SchemaFactory.createForClass(
  MenuItemDocumentModel,
);
export const MENU_ITEM_MODEL = MenuItemDocumentModel.name;
