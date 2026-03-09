import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext, RequestWithContext } from './request-context';

export const CurrentRequestContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestContext => {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    return request.requestContext as RequestContext;
  },
);
