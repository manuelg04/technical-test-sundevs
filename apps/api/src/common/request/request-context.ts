import type { Request } from 'express';

export interface RequestContext {
  correlationId: string;
  userId?: string;
}

export type RequestWithContext = Request & {
  requestContext?: RequestContext;
};
