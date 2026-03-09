import { createHttpApp } from './common/http/create-http-app';

async function bootstrap() {
  const app = await createHttpApp();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
