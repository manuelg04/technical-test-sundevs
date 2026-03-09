import { Module } from '@nestjs/common';
import { MenuModule } from '../menu/menu.module';
import { OrdersModule } from '../orders/orders.module';
import { PricingModule } from '../pricing/pricing.module';
import { TimelineModule } from '../timeline/timeline.module';
import { OutboxModule } from './outbox.module';
import { ProcessingWorkerService } from './application/processing-worker.service';

@Module({
  imports: [
    OutboxModule,
    OrdersModule,
    MenuModule,
    PricingModule,
    TimelineModule,
  ],
  providers: [ProcessingWorkerService],
  exports: [ProcessingWorkerService],
})
export class WorkerModule {}
