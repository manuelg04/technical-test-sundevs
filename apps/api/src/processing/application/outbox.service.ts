import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  OUTBOX_EVENT_MODEL,
  OutboxEventDocumentModel,
} from '../infrastructure/outbox-event.schema';

@Injectable()
export class OutboxService {
  constructor(
    @InjectModel(OUTBOX_EVENT_MODEL)
    private readonly outboxEventModel: Model<OutboxEventDocumentModel>,
  ) {}

  async enqueueCheckoutRequested(params: {
    orderId: string;
    userId: string;
    correlationId: string;
    session: ClientSession;
  }) {
    await this.outboxEventModel.create(
      [
        {
          eventId: randomUUID(),
          aggregateId: params.orderId,
          type: 'ORDER_CHECKOUT_REQUESTED',
          status: 'PENDING',
          attempts: 0,
          availableAt: new Date(),
          correlationId: params.correlationId,
          payload: {
            orderId: params.orderId,
            userId: params.userId,
          },
        },
      ],
      { session: params.session },
    );
  }

  async claimNextPending() {
    return this.outboxEventModel.findOneAndUpdate(
      {
        status: 'PENDING',
        availableAt: { $lte: new Date() },
      },
      {
        $set: {
          status: 'PROCESSING',
        },
        $inc: {
          attempts: 1,
        },
      },
      {
        sort: {
          createdAt: 1,
        },
        new: true,
      },
    );
  }

  async markCompleted(eventId: string) {
    await this.outboxEventModel.updateOne(
      { eventId },
      {
        $set: {
          status: 'COMPLETED',
          lastError: null,
        },
      },
    );
  }

  async reschedule(
    eventId: string,
    attempts: number,
    error: string,
    maxAttempts: number,
  ) {
    const nextStatus = attempts >= maxAttempts ? 'FAILED' : 'PENDING';
    const availableAt = new Date(Date.now() + attempts * 1_000);
    await this.outboxEventModel.updateOne(
      { eventId },
      {
        $set: {
          status: nextStatus,
          lastError: error,
          availableAt,
        },
      },
    );
  }

  async countByAggregate(aggregateId: string) {
    return this.outboxEventModel.countDocuments({ aggregateId });
  }
}
