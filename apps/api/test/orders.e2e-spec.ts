import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { createHttpApp } from '../src/common/http/create-http-app';
import {
  OUTBOX_EVENT_MODEL,
  OutboxEventDocumentModel,
} from '../src/processing/infrastructure/outbox-event.schema';
import {
  createMongoMemoryReplSet,
  seedDefaultMenu,
} from './helpers/mongo-replset';

describe('Orders idempotency (e2e)', () => {
  let app: INestApplication;
  let mongoReplSet: Awaited<ReturnType<typeof createMongoMemoryReplSet>>;
  let outboxModel: Model<OutboxEventDocumentModel>;
  let httpServer: Parameters<typeof request>[0];
  const headers = {
    'x-user-id': 'test-user',
    'x-correlation-id': 'corr-123',
  };

  beforeAll(async () => {
    mongoReplSet = await createMongoMemoryReplSet();
    process.env.MONGODB_URI = mongoReplSet.getUri('restaurant_ordering_test');
    process.env.SERVICE_FEE_BPS = '1000';
    app = await createHttpApp();
    await seedDefaultMenu(app);
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    outboxModel = app.get<Model<OutboxEventDocumentModel>>(
      getModelToken(OUTBOX_EVENT_MODEL),
    );
  });

  afterAll(async () => {
    await app.close();
    await mongoReplSet.stop();
  });

  it('returns the same order for retries with the same idempotency key', async () => {
    const createDraftResponse = await request(httpServer)
      .post('/carts')
      .set(headers)
      .expect(201);
    const draftOrderId = (createDraftResponse.body as { orderId: string })
      .orderId;

    await request(httpServer)
      .post(`/carts/${draftOrderId}/items`)
      .set(headers)
      .send({
        menuItemCode: 'build-your-own-bowl',
        quantity: 1,
        modifiers: {
          protein: ['chicken'],
          toppings: ['corn'],
        },
      })
      .expect(201);

    const firstCheckout = await request(httpServer)
      .post('/orders')
      .set({
        ...headers,
        'Idempotency-Key': 'stable-key',
      })
      .send({ draftOrderId })
      .expect(202);

    const secondCheckout = await request(httpServer)
      .post('/orders')
      .set({
        ...headers,
        'Idempotency-Key': 'stable-key',
      })
      .send({ draftOrderId })
      .expect(202);

    expect(firstCheckout.body).toEqual(secondCheckout.body);
    expect(
      await outboxModel.countDocuments({ aggregateId: draftOrderId }),
    ).toBe(1);

    await request(httpServer)
      .post('/orders')
      .set({
        ...headers,
        'Idempotency-Key': 'stable-key',
      })
      .send({ draftOrderId: 'another-order' })
      .expect(409);
  });
});
