import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { TimelineRecordInput } from '../domain/timeline-event.types';
import {
  TIMELINE_EVENT_MODEL,
  TimelineEventDocumentModel,
} from '../infrastructure/timeline-event.schema';

@Injectable()
export class TimelineService {
  constructor(
    @InjectModel(TIMELINE_EVENT_MODEL)
    private readonly timelineEventModel: Model<TimelineEventDocumentModel>,
  ) {}

  async record(event: TimelineRecordInput, session?: ClientSession) {
    const sizeInBytes = Buffer.byteLength(
      JSON.stringify(event.payload),
      'utf8',
    );
    if (sizeInBytes > 16 * 1024) {
      throw new BadRequestException('Timeline payload exceeds 16KB');
    }

    await this.timelineEventModel.updateOne(
      { eventId: event.eventId },
      { $setOnInsert: event },
      { upsert: true, session },
    );
  }

  async listByOrder(orderId: string, page: number, pageSize: number) {
    const sanitizedPage = Math.max(page, 1);
    const sanitizedPageSize = Math.min(Math.max(pageSize, 1), 50);
    const skip = (sanitizedPage - 1) * sanitizedPageSize;
    const [items, total] = await Promise.all([
      this.timelineEventModel
        .find({ orderId })
        .sort({ timestamp: 1, eventId: 1 })
        .skip(skip)
        .limit(sanitizedPageSize)
        .lean(),
      this.timelineEventModel.countDocuments({ orderId }),
    ]);

    return {
      items,
      page: sanitizedPage,
      pageSize: sanitizedPageSize,
      total,
      hasMore: skip + items.length < total,
    };
  }
}
