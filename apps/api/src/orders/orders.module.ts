import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { MenuModule } from '../menu/menu.module';
import { OutboxModule } from '../processing/outbox.module';
import { PricingModule } from '../pricing/pricing.module';
import { TimelineModule } from '../timeline/timeline.module';
import { ModifierValidationService } from './application/modifier-validation.service';
import { OrdersService } from './application/orders.service';
import { ORDER_MODEL, OrderSchema } from './infrastructure/order.schema';
import { OrdersController } from './presentation/orders.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ORDER_MODEL,
        schema: OrderSchema,
      },
    ]),
    MenuModule,
    PricingModule,
    TimelineModule,
    IdempotencyModule,
    OutboxModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ModifierValidationService],
  exports: [OrdersService, ModifierValidationService, MongooseModule],
})
export class OrdersModule {}
