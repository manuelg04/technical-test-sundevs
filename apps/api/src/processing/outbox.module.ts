import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OutboxService } from './application/outbox.service';
import {
  OUTBOX_EVENT_MODEL,
  OutboxEventSchema,
} from './infrastructure/outbox-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OUTBOX_EVENT_MODEL,
        schema: OutboxEventSchema,
      },
    ]),
  ],
  providers: [OutboxService],
  exports: [OutboxService, MongooseModule],
})
export class OutboxModule {}
