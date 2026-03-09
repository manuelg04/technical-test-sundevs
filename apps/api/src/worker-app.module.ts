import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { OutboxModule } from './processing/outbox.module';
import { WorkerModule } from './processing/worker.module';
import { PricingModule } from './pricing/pricing.module';
import { TimelineModule } from './timeline/timeline.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        enabled: false,
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    MenuModule,
    PricingModule,
    TimelineModule,
    IdempotencyModule,
    OutboxModule,
    OrdersModule,
    WorkerModule,
  ],
})
export class WorkerAppModule {}
