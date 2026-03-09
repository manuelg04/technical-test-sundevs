import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentRequestContext } from '../../common/request/request-context.decorator';
import { RequireUserGuard } from '../../common/request/require-user.guard';
import type { RequestContext } from '../../common/request/request-context';
import { OrdersService } from '../application/orders.service';
import { UpsertCartItemDto } from './dto/cart-item.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { TimelineQueryDto } from './dto/timeline-query.dto';

@Controller()
@UseGuards(RequireUserGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('carts')
  createDraft(@CurrentRequestContext() context: RequestContext) {
    return this.ordersService.createDraft(
      context.userId!,
      context.correlationId,
    );
  }

  @Get('carts/:orderId')
  getCart(
    @Param('orderId') orderId: string,
    @CurrentRequestContext() context: RequestContext,
  ) {
    return this.ordersService.getCart(orderId, context.userId!);
  }

  @Post('carts/:orderId/items')
  addCartItem(
    @Param('orderId') orderId: string,
    @Body() body: UpsertCartItemDto,
    @CurrentRequestContext() context: RequestContext,
  ) {
    return this.ordersService.addCartItem(
      orderId,
      context.userId!,
      context.correlationId,
      body,
    );
  }

  @Patch('carts/:orderId/items/:itemId')
  updateCartItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: UpsertCartItemDto,
    @CurrentRequestContext() context: RequestContext,
  ) {
    return this.ordersService.updateCartItem(
      orderId,
      context.userId!,
      itemId,
      context.correlationId,
      body,
    );
  }

  @Delete('carts/:orderId/items/:itemId')
  removeCartItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @CurrentRequestContext() context: RequestContext,
  ) {
    return this.ordersService.removeCartItem(
      orderId,
      context.userId!,
      itemId,
      context.correlationId,
    );
  }

  @Post('orders')
  @HttpCode(202)
  checkout(
    @Body() body: CheckoutOrderDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CurrentRequestContext() context: RequestContext,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    return this.ordersService.checkout(
      body.draftOrderId,
      context.userId!,
      context.correlationId,
      idempotencyKey,
    );
  }

  @Get('orders/:orderId')
  getOrder(
    @Param('orderId') orderId: string,
    @CurrentRequestContext() context: RequestContext,
  ) {
    return this.ordersService.getOrder(orderId, context.userId!);
  }

  @Get('orders/:orderId/timeline')
  getOrderTimeline(
    @Param('orderId') orderId: string,
    @Query() query: TimelineQueryDto,
    @CurrentRequestContext() context: RequestContext,
  ) {
    return this.ordersService.getTimeline(
      orderId,
      context.userId!,
      query.page,
      query.pageSize,
    );
  }
}
