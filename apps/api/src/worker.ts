import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { WorkerAppModule } from './worker-app.module';
import { ProcessingWorkerService } from './processing/application/processing-worker.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  await app.get(ProcessingWorkerService).start();
}

void bootstrap();
