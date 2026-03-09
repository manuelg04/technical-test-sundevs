import type { APIGatewayProxyEvent, Context, Handler } from 'aws-lambda';
import type { Express } from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import { createHttpApp } from './common/http/create-http-app';

let cachedHandler: Handler;

async function bootstrap(): Promise<Handler> {
  const app = await createHttpApp();
  const expressApp = app.getHttpAdapter().getInstance() as unknown as Express;
  const lambdaHandler = serverlessExpress({
    app: expressApp,
  }) as unknown as Handler;
  return lambdaHandler;
}

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback,
) => {
  if (!cachedHandler) {
    cachedHandler = await bootstrap();
  }

  return (cachedHandler(event, context, callback) ??
    Promise.resolve()) as Promise<unknown>;
};
