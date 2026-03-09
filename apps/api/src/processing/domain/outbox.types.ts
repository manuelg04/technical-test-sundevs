export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface OutboxEventPayload {
  orderId: string;
  userId: string;
}
