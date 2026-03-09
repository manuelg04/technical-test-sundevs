import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import {
  IDEMPOTENCY_KEY_MODEL,
  IdempotencyKeyDocumentModel,
} from '../infrastructure/idempotency-key.schema';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectModel(IDEMPOTENCY_KEY_MODEL)
    private readonly idempotencyKeyModel: Model<IdempotencyKeyDocumentModel>,
  ) {}

  createFingerprint(payload: unknown) {
    return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  }

  async find(userId: string, route: string, idempotencyKey: string) {
    return this.idempotencyKeyModel
      .findOne({ userId, route, idempotencyKey })
      .lean();
  }

  async create(params: {
    userId: string;
    route: string;
    idempotencyKey: string;
    requestFingerprint: string;
    orderId: string;
    responseStatus: number;
    session: ClientSession;
  }) {
    return this.idempotencyKeyModel.create([params], {
      session: params.session,
    });
  }
}
