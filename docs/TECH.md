# Technical architecture

## Stack

- Next.js 15 App Router, React 19, TypeScript
- Auth.js (NextAuth v5) JWT sessions + Prisma adapter
- PostgreSQL + Prisma ORM
- Tailwind CSS 4, Radix UI primitives

## Authentication

- **Web:** Discord OAuth; session in JWT (`auth.config.ts` callbacks).
- **Dev only:** Credentials provider when `NODE_ENV=development`.
- **Bot API:** `Authorization: Bearer BOT_API_SECRET` via `lib/bot-auth.ts`.

App routes (`/dashboard`, `/availability`, etc.) are protected in `middleware.ts`. API routes use per-handler `requireSession()` except token-based public routes (ICS, public share).

## Authorization

- Campaign host actions: `requireEventHost()` in `lib/event-access.ts`.
- Guild-scoped writes: `resolveActiveGuildId()` + membership checks.

## Rate limiting

Postgres-backed fixed windows (`RateLimitBucket` model, `lib/rate-limit.ts`):

- Bot API: 120 req/min per IP (in `verifyBotAuth`)
- User writes: availability create (60/min), event create (20/min), image upload (30/min)

## File storage

`UPLOAD_STORAGE=local` (default) writes under `data/uploads/events/`. `s3` uses `@aws-sdk/client-s3` with optional R2/MinIO endpoint. Magic-byte validation in `lib/storage/validate-image.ts`.

## Errors

API errors: `{ error, code }` via `lib/api-response.ts`. 500s include `errId` for log correlation. UI: `app/error.tsx`, `app/global-error.tsx`.

## Observability

- Structured JSON logs: `lib/logger.ts`
- Optional `SENTRY_DSN` (wire in `instrumentation.ts` when needed)
- Health: `/api/health`

## Environment validation

`lib/env.ts` + `validateProductionEnv()` when `RUNTIME_ENV_VALIDATION=true` (Docker production).
