import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { RequestContext, RequestWithContext } from './request-context';

@Injectable()
export class RequireUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const requestContext: RequestContext | undefined = request.requestContext;

    if (!requestContext?.userId) {
      throw new BadRequestException('x-user-id header is required');
    }

    return true;
  }
}
