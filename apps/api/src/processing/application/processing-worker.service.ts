import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { MenuService } from '../../menu/application/menu.service';
import { OrdersService } from '../../orders/application/orders.service';
import { ModifierValidationService } from '../../orders/application/modifier-validation.service';
import { OutboxEventDocument } from '../infrastructure/outbox-event.schema';
import { PricingService } from '../../pricing/application/pricing.service';
import { TimelineService } from '../../timeline/application/timeline.service';
import { OutboxService } from './outbox.service';

@Injectable()
export class ProcessingWorkerService {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly outboxService: OutboxService,
    private readonly ordersService: OrdersService,
    private readonly menuService: MenuService,
    private readonly modifierValidationService: ModifierValidationService,
    private readonly pricingService: PricingService,
    private readonly timelineService: TimelineService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProcessingWorkerService.name);
  }

  async start() {
    const pollingMs = this.configService.get<number>('WORKER_POLLING_MS', 1500);
    await this.tick();
    this.timer = setInterval(() => {
      void this.tick();
    }, pollingMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async tick() {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const event = await this.outboxService.claimNextPending();
      if (!event) {
        return;
      }

      await this.processEvent(event);
    } finally {
      this.running = false;
    }
  }

  private async processEvent(event: OutboxEventDocument) {
    try {
      if (event.type !== 'ORDER_CHECKOUT_REQUESTED') {
        await this.outboxService.markCompleted(event.eventId);
        return;
      }

      const order = await this.ordersService.getOrderForProcessing(
        event.aggregateId,
      );
      await this.ordersService.markProcessing(
        order.orderId,
        event.correlationId,
      );
      await this.timelineService.record({
        eventId: randomUUID(),
        timestamp: new Date(),
        orderId: order.orderId,
        userId: order.userId,
        type: 'ORDER_STATUS_CHANGED',
        source: 'worker',
        correlationId: event.correlationId,
        payload: {
          status: 'PROCESSING',
        },
      });

      const menuItemsByCode = await this.menuService.getMenuItemsByCodes(
        order.items.map((item) => item.menuItemCode),
      );
      for (const item of order.items) {
        this.modifierValidationService.validatePersistedItem(
          menuItemsByCode.get(item.menuItemCode)!,
          item as never,
        );
      }

      const pricing = this.pricingService.calculate(order.items);
      await this.timelineService.record({
        eventId: randomUUID(),
        timestamp: new Date(),
        orderId: order.orderId,
        userId: order.userId,
        type: 'PRICING_CALCULATED',
        source: 'worker',
        correlationId: event.correlationId,
        payload: {
          subtotalCents: pricing.subtotalCents,
          serviceFeeCents: pricing.serviceFeeCents,
          totalCents: pricing.totalCents,
        },
      });
      await this.ordersService.confirmOrder(
        order.orderId,
        event.correlationId,
        pricing,
      );
      await this.timelineService.record({
        eventId: randomUUID(),
        timestamp: new Date(),
        orderId: order.orderId,
        userId: order.userId,
        type: 'ORDER_STATUS_CHANGED',
        source: 'worker',
        correlationId: event.correlationId,
        payload: {
          status: 'CONFIRMED',
        },
      });
      await this.outboxService.markCompleted(event.eventId);
    } catch (error: unknown) {
      const maxAttempts = this.configService.get<number>(
        'WORKER_MAX_ATTEMPTS',
        3,
      );
      const reason =
        error instanceof Error ? error.message : 'Unknown worker failure';

      if (
        error instanceof NotFoundException ||
        error instanceof UnprocessableEntityException
      ) {
        const order = await this.ordersService.getOrderForProcessing(
          event.aggregateId,
        );
        await this.timelineService.record({
          eventId: randomUUID(),
          timestamp: new Date(),
          orderId: order.orderId,
          userId: order.userId,
          type: 'VALIDATION_FAILED',
          source: 'worker',
          correlationId: event.correlationId,
          payload: {
            reason,
          },
        });
        await this.ordersService.failOrder(order.orderId, event.correlationId);
        await this.timelineService.record({
          eventId: randomUUID(),
          timestamp: new Date(),
          orderId: order.orderId,
          userId: order.userId,
          type: 'ORDER_STATUS_CHANGED',
          source: 'worker',
          correlationId: event.correlationId,
          payload: {
            status: 'FAILED',
          },
        });
        await this.outboxService.markCompleted(event.eventId);
        return;
      }

      this.logger.error(
        { eventId: event.eventId, reason },
        'Worker execution failed',
      );
      await this.outboxService.reschedule(
        event.eventId,
        event.attempts,
        reason,
        maxAttempts,
      );
    }
  }
}
