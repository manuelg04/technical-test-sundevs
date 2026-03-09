import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { IdempotencyService } from '../../idempotency/application/idempotency.service';
import { MenuService } from '../../menu/application/menu.service';
import { OrderItemSnapshot, OrderView } from '../domain/order.types';
import { OutboxService } from '../../processing/application/outbox.service';
import { PricingService } from '../../pricing/application/pricing.service';
import { TimelineService } from '../../timeline/application/timeline.service';
import {
  ORDER_MODEL,
  OrderDocument,
  OrderDocumentModel,
  PricingSnapshotDocumentModel,
} from '../infrastructure/order.schema';
import {
  CartItemDraftInput,
  ModifierValidationService,
} from './modifier-validation.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(ORDER_MODEL)
    private readonly orderModel: Model<OrderDocumentModel>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly menuService: MenuService,
    private readonly modifierValidationService: ModifierValidationService,
    private readonly pricingService: PricingService,
    private readonly timelineService: TimelineService,
    private readonly idempotencyService: IdempotencyService,
    private readonly outboxService: OutboxService,
  ) {}

  async createDraft(userId: string, correlationId: string): Promise<OrderView> {
    const order = await this.orderModel.create({
      orderId: randomUUID(),
      userId,
      status: 'DRAFT',
      items: [],
      correlationId,
      pricing: null,
    });
    return this.toOrderView(order.toObject());
  }

  async getCart(orderId: string, userId: string): Promise<OrderView> {
    const order = await this.findOwnedOrder(orderId, userId);
    this.ensureStatus(order, 'DRAFT');
    return this.toOrderView(order.toObject(), true);
  }

  async addCartItem(
    orderId: string,
    userId: string,
    correlationId: string,
    input: CartItemDraftInput,
  ) {
    const order = await this.findOwnedOrder(orderId, userId);
    this.ensureStatus(order, 'DRAFT');
    const menuItemsByCode = await this.menuService.getMenuItemsByCodes([
      input.menuItemCode,
    ]);
    const nextItem = this.modifierValidationService.buildOrderItem(
      menuItemsByCode.get(input.menuItemCode)!,
      input,
    );

    order.items.push(nextItem as never);
    order.correlationId = correlationId;
    await order.save();
    await this.timelineService.record({
      eventId: randomUUID(),
      timestamp: new Date(),
      orderId: order.orderId,
      userId,
      type: 'CART_ITEM_ADDED',
      source: 'ui',
      correlationId,
      payload: {
        itemId: nextItem.itemId,
        menuItemCode: nextItem.menuItemCode,
        quantity: nextItem.quantity,
      },
    });

    return this.toOrderView(order.toObject(), true);
  }

  async updateCartItem(
    orderId: string,
    userId: string,
    itemId: string,
    correlationId: string,
    input: CartItemDraftInput,
  ) {
    const order = await this.findOwnedOrder(orderId, userId);
    this.ensureStatus(order, 'DRAFT');
    const existingIndex = order.items.findIndex(
      (item) => item.itemId === itemId,
    );
    if (existingIndex < 0) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const menuItemsByCode = await this.menuService.getMenuItemsByCodes([
      input.menuItemCode,
    ]);
    const updatedItem = this.modifierValidationService.buildOrderItem(
      menuItemsByCode.get(input.menuItemCode)!,
      input,
      itemId,
    );

    order.items[existingIndex] = updatedItem as never;
    order.correlationId = correlationId;
    await order.save();
    await this.timelineService.record({
      eventId: randomUUID(),
      timestamp: new Date(),
      orderId: order.orderId,
      userId,
      type: 'CART_ITEM_UPDATED',
      source: 'ui',
      correlationId,
      payload: {
        itemId,
        menuItemCode: updatedItem.menuItemCode,
        quantity: updatedItem.quantity,
      },
    });

    return this.toOrderView(order.toObject(), true);
  }

  async removeCartItem(
    orderId: string,
    userId: string,
    itemId: string,
    correlationId: string,
  ) {
    const order = await this.findOwnedOrder(orderId, userId);
    this.ensureStatus(order, 'DRAFT');
    const existingIndex = order.items.findIndex(
      (item) => item.itemId === itemId,
    );
    if (existingIndex < 0) {
      throw new NotFoundException(`Item ${itemId} not found`);
    }

    const [removedItem] = order.items.splice(existingIndex, 1);
    order.correlationId = correlationId;
    await order.save();
    await this.timelineService.record({
      eventId: randomUUID(),
      timestamp: new Date(),
      orderId: order.orderId,
      userId,
      type: 'CART_ITEM_REMOVED',
      source: 'ui',
      correlationId,
      payload: {
        itemId,
        menuItemCode: removedItem.menuItemCode,
      },
    });

    return this.toOrderView(order.toObject(), true);
  }

  async checkout(
    orderId: string,
    userId: string,
    correlationId: string,
    idempotencyKey: string,
  ) {
    const route = 'POST /orders';
    const requestFingerprint = this.idempotencyService.createFingerprint({
      draftOrderId: orderId,
      userId,
    });
    const existing = await this.idempotencyService.find(
      userId,
      route,
      idempotencyKey,
    );

    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) {
        throw new ConflictException(
          'Idempotency-Key has already been used with a different payload',
        );
      }

      return {
        orderId: existing.orderId,
        status: 'PENDING',
      };
    }

    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await this.orderModel
          .findOne({ orderId, userId })
          .session(session);
        if (!order) {
          throw new NotFoundException(`Draft order ${orderId} not found`);
        }

        this.ensureStatus(order, 'DRAFT');
        if (order.items.length === 0) {
          throw new UnprocessableEntityException(
            'Draft order must contain at least one item before checkout',
          );
        }

        order.status = 'PENDING';
        order.correlationId = correlationId;
        await order.save({ session });
        await this.timelineService.record(
          {
            eventId: randomUUID(),
            timestamp: new Date(),
            orderId,
            userId,
            type: 'ORDER_PLACED',
            source: 'api',
            correlationId,
            payload: {
              status: 'PENDING',
              itemCount: order.items.length,
            },
          },
          session,
        );
        await this.outboxService.enqueueCheckoutRequested({
          orderId,
          userId,
          correlationId,
          session,
        });
        await this.idempotencyService.create({
          userId,
          route,
          idempotencyKey,
          requestFingerprint,
          orderId,
          responseStatus: 202,
          session,
        });
      });
    } catch (error: unknown) {
      if ((error as { code?: number }).code === 11000) {
        const duplicated = await this.idempotencyService.find(
          userId,
          route,
          idempotencyKey,
        );
        if (!duplicated) {
          throw error;
        }
        if (duplicated.requestFingerprint !== requestFingerprint) {
          throw new ConflictException(
            'Idempotency-Key has already been used with a different payload',
          );
        }
        return {
          orderId: duplicated.orderId,
          status: 'PENDING',
        };
      }
      throw error;
    } finally {
      await session.endSession();
    }

    return {
      orderId,
      status: 'PENDING',
    };
  }

  async getOrder(orderId: string, userId: string) {
    const order = await this.findOwnedOrder(orderId, userId);
    return this.toOrderView(order.toObject(), order.status === 'DRAFT');
  }

  async getTimeline(
    orderId: string,
    userId: string,
    page: number,
    pageSize: number,
  ) {
    await this.findOwnedOrder(orderId, userId);
    return this.timelineService.listByOrder(orderId, page, pageSize);
  }

  async getOrderForProcessing(orderId: string) {
    const order = await this.orderModel.findOne({ orderId });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async markProcessing(orderId: string, correlationId: string) {
    await this.orderModel.updateOne(
      { orderId },
      {
        $set: {
          status: 'PROCESSING',
          correlationId,
        },
      },
    );
  }

  async confirmOrder(
    orderId: string,
    correlationId: string,
    pricing: PricingSnapshotDocumentModel,
  ) {
    await this.orderModel.updateOne(
      { orderId },
      {
        $set: {
          status: 'CONFIRMED',
          pricing,
          correlationId,
        },
      },
    );
  }

  async failOrder(orderId: string, correlationId: string) {
    await this.orderModel.updateOne(
      { orderId },
      {
        $set: {
          status: 'FAILED',
          correlationId,
        },
      },
    );
  }

  private async findOwnedOrder(
    orderId: string,
    userId: string,
  ): Promise<OrderDocument> {
    const order = await this.orderModel.findOne({ orderId, userId });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  private ensureStatus(order: OrderDocument, expected: 'DRAFT') {
    if (order.status !== expected) {
      throw new ConflictException(
        `Order ${order.orderId} is not in ${expected} status`,
      );
    }
  }

  private toOrderView(
    order: OrderDocumentModel & { createdAt?: Date; updatedAt?: Date },
    includePreview = false,
  ): OrderView {
    return {
      orderId: order.orderId,
      userId: order.userId,
      status: order.status as OrderView['status'],
      items: order.items as unknown as OrderItemSnapshot[],
      pricing: (order.pricing as unknown as OrderView['pricing']) ?? null,
      pricingPreview: includePreview
        ? this.pricingService.calculate(order.items)
        : null,
      createdAt: order.createdAt ?? new Date(),
      updatedAt: order.updatedAt ?? new Date(),
    };
  }
}
