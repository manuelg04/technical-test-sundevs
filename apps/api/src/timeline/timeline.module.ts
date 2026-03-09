import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimelineService } from './application/timeline.service';
import {
  TIMELINE_EVENT_MODEL,
  TimelineEventSchema,
} from './infrastructure/timeline-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: TIMELINE_EVENT_MODEL,
        schema: TimelineEventSchema,
      },
    ]),
  ],
  providers: [TimelineService],
  exports: [TimelineService, MongooseModule],
})
export class TimelineModule {}
