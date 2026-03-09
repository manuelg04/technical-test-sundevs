import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { HealthController } from './common/http/health.controller';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { OutboxModule } from './processing/outbox.module';
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
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers.x-user-id',
          ],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              },
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
  ],
  controllers: [HealthController],
})
export class AppModule {}
