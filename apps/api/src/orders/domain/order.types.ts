import { PricingSummary } from '../../pricing/domain/pricing.types';

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'FAILED';

export interface SelectedModifierOption {
  code: string;
  name: string;
  priceCents: number;
}

export interface SelectedModifierGroup {
  groupCode: string;
  groupName: string;
  selections: SelectedModifierOption[];
}

export interface OrderItemSnapshot {
  itemId: string;
  menuItemCode: string;
  name: string;
  quantity: number;
  basePriceCents: number;
  lineUnitTotalCents: number;
  modifierGroups: SelectedModifierGroup[];
}

export interface OrderView {
  orderId: string;
  userId: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  pricing?: PricingSummary | null;
  pricingPreview?: PricingSummary | null;
  createdAt: Date;
  updatedAt: Date;
}
