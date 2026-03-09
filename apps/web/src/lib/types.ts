export type ModifierGroup = {
  code: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: {
    code: string;
    name: string;
    priceCents: number;
  }[];
};

export type MenuItem = {
  code: string;
  category: string;
  name: string;
  description: string;
  basePriceCents: number;
  modifierGroups: ModifierGroup[];
};

export type MenuResponse = {
  categories: string[];
  items: MenuItem[];
};

export type OrderItem = {
  itemId: string;
  menuItemCode: string;
  name: string;
  quantity: number;
  basePriceCents: number;
  lineUnitTotalCents: number;
  modifierGroups: {
    groupCode: string;
    groupName: string;
    selections: {
      code: string;
      name: string;
      priceCents: number;
    }[];
  }[];
};

export type PricingSummary = {
  subtotalCents: number;
  serviceFeeCents: number;
  totalCents: number;
};

export type OrderView = {
  orderId: string;
  userId: string;
  status: "DRAFT" | "PENDING" | "PROCESSING" | "CONFIRMED" | "FAILED";
  items: OrderItem[];
  pricing?: PricingSummary | null;
  pricingPreview?: PricingSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type TimelineResponse = {
  items: {
    eventId: string;
    timestamp: string;
    orderId: string;
    userId: string;
    type: string;
    source: "api" | "worker" | "ui";
    correlationId: string;
    payload: Record<string, unknown>;
  }[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};
