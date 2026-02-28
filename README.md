# TRISSEA PWA

Production-focused multi-tenant tricycle booking platform built with Next.js, Supabase, and Prisma.

## Stack

- Next.js App Router
- Supabase Auth + Postgres + Realtime
- Prisma ORM
- MapLibre/MapCN UI components for booking maps

## Roles

- Passenger
- Driver
- Admin
- Superadmin

## Current Architecture

- Auth:
  - SMS OTP via Supabase (`/api/auth/sms/send`, `/api/auth/sms/verify`)
  - SSR-safe session checks through Supabase server client utilities
  - Route protection via `proxy.ts`
- Booking:
  - On-demand quote/create/cancel/transition
  - Driver presence heartbeat and nearest assignment
  - TODA queue reservation/dispatch/complete with FIFO compaction
- Realtime:
  - SSE relay endpoint at `/api/realtime/stream`
  - Internal event bus + Supabase postgres change relay

## API Contracts

Booking and auth mutation endpoints use:

- Success: `{ "data": ..., "meta"?: ... }`
- Error: `{ "error": string, "code": string, "requestId": string }`
- `x-request-id` response header is returned on API responses.
- Rate limited responses return `429` and `Retry-After`.

See [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) for details.

## Local Setup

1. Install dependencies

```bash
npm ci
```

2. Configure env

```bash
cp .env.example .env
```

3. Generate Prisma client and run migrations

```bash
npm run db:generate
npm run db:migrate
```

4. Seed sample data

```bash
npm run db:seed
```

5. Start dev server

```bash
npm run dev
```

## Production Notes

- Use `.env.production.example` as baseline.
- Run `prisma migrate deploy` during deploy.
- CI workflow is at `.github/workflows/ci.yml`.
- Operational runbooks are in [docs/RUNBOOKS.md](docs/RUNBOOKS.md).
