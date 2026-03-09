# Restaurant Ordering Monorepo

Technical test implemented as a lightweight monorepo:

- `apps/api`: NestJS ordering API
- `apps/web`: Next.js minimal UI
- `docker-compose.yml`: local MongoDB with replica set auto-init

The repository is intended to be runnable from a clean machine in under 10 minutes.

## Prerequisites

- Node.js `24.x`
- npm `11.x`
- Docker Desktop or Docker Engine with Compose support

Recommended Node version managers:

- macOS/Linux: `nvm`, `fnm`, or `volta`
- Windows: `nvm-windows` or `volta`

Check your installed versions:

```bash
node -v
npm -v
docker compose version
```

## Environment Setup

This repository uses one env file per app:

- `apps/api/.env`
- `apps/web/.env.local`

Example files included in the repo:

- `apps/api/.env.example`
- `apps/web/.env.example`

### Required Variables

`apps/api/.env`

- `MONGODB_URI`
- `PORT`

`apps/web/.env.local`

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_USER_ID`

### Optional Variables

- `SERVICE_FEE_BPS`
- `PAYLOAD_LIMIT_BYTES`
- `WORKER_POLLING_MS`
- `WORKER_MAX_ATTEMPTS`
- `NEXT_PUBLIC_POLLING_INTERVAL_MS`

### Create Env Files

macOS/Linux:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Windows PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
```

## Quick Start

If you use `nvm`, switch to Node 24 first.

macOS/Linux:

```bash
git clone https://github.com/manuelg04/technical-test-sundevs
cd technical-test-sundevs
nvm install 24
nvm use 24
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
npm install
docker compose up -d
npm run seed:menu
```

Windows PowerShell:

```powershell
git clone https://github.com/manuelg04/technical-test-sundevs
cd technical-test-sundevs
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env.local
npm install
docker compose up -d
npm run seed:menu
```

After that, start the API, worker, and web app in separate terminals.

## Run Locally

Startup order:

1. MongoDB
2. Seed menu
3. API
4. Worker
5. Web

Run these commands from the repository root.

Terminal 1:

```bash
npm run dev:api
```

Terminal 2:

```bash
npm run dev:worker
```

Terminal 3:

```bash
npm run dev:web
```

## Ports

- MongoDB: `27017`
- API: `3001`
- Web: `3000`

Open these URLs after startup:

- UI: `http://localhost:3000`
- API health check: `http://localhost:3001/health`

Quick verification:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{"status":"ok","timestamp":"..."}
```

## Notes

- `docker compose up -d` initializes MongoDB as a single-node replica set automatically. No manual `rs.initiate()` step is required.
- The UI uses the mock user id from `apps/web/.env.local`.
- `serverless.yml` is included to satisfy the serverless requirement, but the default local workflow uses Nest directly to avoid Serverless Framework v4 login/licensing prompts.

## How to Test

Run all tests:

```bash
npm test
```

Run API unit/integration tests only:

```bash
npm run test:api
```

Run the API e2e suite explicitly:

```bash
npm --workspace apps/api run test:e2e
```

Test setup notes:

- No external MongoDB container is required for automated tests.
- The API test suite uses `MongoMemoryReplSet`.
- Local seed data is not required before running tests.

## Seed Data

Seed the seven menu items locally:

```bash
npm run seed:menu
```

This script replaces the `menuItems` collection with the default sample catalog, including two customizable products with `protein`, `toppings`, and `sauces`.

## Troubleshooting

- If `npm install` shows engine warnings, confirm you are using Node `24.x` and npm `11.x`.
- If `docker compose up -d` fails, make sure Docker Desktop or Docker Engine is running.
- If the UI loads but cannot reach the API, confirm `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` in `apps/web/.env.local`.
- If ports `3000`, `3001`, or `27017` are already in use, stop the conflicting processes before starting the project.

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
