export type TimelineEventType =
  | 'CART_ITEM_ADDED'
  | 'CART_ITEM_UPDATED'
  | 'CART_ITEM_REMOVED'
  | 'PRICING_CALCULATED'
  | 'ORDER_PLACED'
  | 'ORDER_STATUS_CHANGED'
  | 'VALIDATION_FAILED';

export type TimelineEventSource = 'api' | 'worker' | 'ui';

export interface TimelineRecordInput {
  eventId: string;
  timestamp: Date;
  orderId: string;
  userId: string;
  type: TimelineEventType;
  source: TimelineEventSource;
  correlationId: string;
  payload: Record<string, unknown>;
}
