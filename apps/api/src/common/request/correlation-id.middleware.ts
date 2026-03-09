import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import type { RequestWithContext } from './request-context';

export function CorrelationIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const requestWithContext = request as RequestWithContext;
  const correlationId = request.header('x-correlation-id') ?? randomUUID();
  const userId = request.header('x-user-id') ?? undefined;

  response.setHeader('x-correlation-id', correlationId);
  requestWithContext.requestContext = {
    correlationId,
    userId,
  };

  next();
}
