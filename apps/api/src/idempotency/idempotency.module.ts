import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdempotencyService } from './application/idempotency.service';
import {
  IDEMPOTENCY_KEY_MODEL,
  IdempotencyKeySchema,
} from './infrastructure/idempotency-key.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: IDEMPOTENCY_KEY_MODEL,
        schema: IdempotencyKeySchema,
      },
    ]),
  ],
  providers: [IdempotencyService],
  exports: [IdempotencyService, MongooseModule],
})
export class IdempotencyModule {}
