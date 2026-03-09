import { json, urlencoded } from 'express';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from '../../app.module';
import { CorrelationIdMiddleware } from '../request/correlation-id.middleware';

export async function createHttpApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);
  app.use(json({ limit: '16kb' }));
  app.use(urlencoded({ extended: true, limit: '16kb' }));
  app.use(CorrelationIdMiddleware);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
}
