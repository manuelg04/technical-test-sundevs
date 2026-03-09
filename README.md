# Restaurant Ordering Monorepo

Technical test implemented as a lightweight monorepo:

- `apps/api`: NestJS ordering API, serverless-offline runnable
- `apps/web`: Next.js minimal UI
- `docker-compose.yml`: local MongoDB with replica set auto-init

## Prerequisites

- Node.js `24.x`
- npm `11.x`
- Docker Desktop or Docker Engine with Compose support

## Environment Setup

Create the env files before starting services:

```bash
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local
```

Required variables:

- `apps/api/.env`
  - `MONGODB_URI`
  - `PORT`
- `apps/web/.env.local`
  - `NEXT_PUBLIC_API_BASE_URL`
  - `NEXT_PUBLIC_USER_ID`

Optional variables:

- `SERVICE_FEE_BPS`
- `PAYLOAD_LIMIT_BYTES`
- `WORKER_POLLING_MS`
- `WORKER_MAX_ATTEMPTS`
- `NEXT_PUBLIC_POLLING_INTERVAL_MS`

## Install

```bash
npm install
```

## Run Locally

Startup order:

1. MongoDB
2. Seed menu
3. API
4. Worker
5. Web

Commands:

```bash
docker compose up -d
npm run seed:menu
npm run dev:api
npm run dev:worker
npm run dev:web
```

Ports:

- MongoDB: `27017`
- API (`Nest start --watch`): `3001`
- Web (`Next.js`): `3000`

Notes:

- `docker compose up -d` leaves Mongo ready as a single-node replica set; there is no manual `rs.initiate()` step.
- Run the API, worker and web in separate terminals.
- The UI uses the mock user id configured in `apps/web/.env.local`.
- `serverless.yml` remains included for the serverless requirement, but the default local dev command uses Nest directly to avoid Serverless Framework v4 login/licensing prompts.

## How to Test

Run all app tests:

```bash
npm test
```

Run only API tests:

```bash
npm run test:api
```

Run the API e2e suite explicitly:

```bash
npm --workspace apps/api run test:e2e
```

The API tests use `MongoMemoryReplSet`, so no external Mongo container is required for the automated suite.

## Seed Data

Seed the seven required menu items:

```bash
npm run seed:menu
```

This script replaces the `menuItems` collection with the default sample catalog, including two customizable products with `protein`, `toppings` and `sauces`.

## API Summary

- `GET /menu`
- `POST /carts`
- `GET /carts/:orderId`
- `POST /carts/:orderId/items`
- `PATCH /carts/:orderId/items/:itemId`
- `DELETE /carts/:orderId/items/:itemId`
- `POST /orders`
- `GET /orders/:orderId`
- `GET /orders/:orderId/timeline?page=1&pageSize=20`

Required headers for cart and order endpoints:

- `x-user-id`
- `Idempotency-Key` on `POST /orders`
- `x-correlation-id` is optional; the API generates one if omitted
