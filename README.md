# TTGOD Scheduler

A scheduling web app for sharing free time, creating events, and integrating with a Discord bot via a versioned REST API.

**Design:** Dark-first playful gaming UI — squad calendar overlaps, hub dashboard, and overlap-to-event flow. _(Screenshot placeholders: add `docs/screenshots/` when capturing the landing, calendar, and dashboard.)_

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Auth.js** (NextAuth v5) with Discord OAuth
- **Prisma** + SQLite (local); switch `provider` + `DATABASE_URL` to PostgreSQL for production
- **Tailwind CSS** + shadcn-style UI components
- **next-themes** for light / dark / system themes

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite path, e.g. `file:./dev.db` |
| `AUTH_SECRET` | Random string — generate with `openssl rand -base64 32` |
| `AUTH_DISCORD_ID` | Discord application OAuth2 client ID |
| `AUTH_DISCORD_SECRET` | Discord application OAuth2 client secret |
| `AUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `BOT_API_SECRET` | Shared secret for bot → API calls |
| `NEXT_PUBLIC_APP_NAME` | Display name (default: TTGOD Scheduler) |

### 3. Discord OAuth setup

1. Open [Discord Developer Portal](https://discord.com/developers/applications).
2. Create an application (or use your existing bot app).
3. **OAuth2 → Redirects** add:
   - `http://localhost:3000/api/auth/callback/discord`
4. Copy **Client ID** → `AUTH_DISCORD_ID`
5. Copy **Client Secret** → `AUTH_DISCORD_SECRET`
6. Enable scopes: `identify` (email optional).

Users must sign in on the website at least once so their `discordId` is stored before the bot can access their schedule.

### 4. Database

```bash
npm run db:migrate
```

### 5. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo sign-in (local development only)

When `NODE_ENV=development`, the home page shows a **Local demo only** form. Production expects **Sign in with Discord** only. Profile name and avatar refresh from Discord on each login.

---

## Campaigns (events)

Campaigns move through three phases:

1. **Interest** — squad votes yes/no; optional capacity limit.
2. **Scheduling** — host adds time slots; members vote; host finalizes the winner.
3. **Scheduled** — pinned event with calendar time, accept/decline invites, itinerary.

Optional **cost** with **split evenly** shows per-person share on stickies. **Photos** can be attached anytime from the campaign detail page (`/events/[id]`). Images are stored under `data/uploads/events/` (gitignored).

---


## Bot API (v1)

All bot endpoints require:

```http
Authorization: Bearer <BOT_API_SECRET>
```

Base URL: `https://your-domain.com` (or `http://localhost:3000` in development).

Errors return JSON:

```json
{ "error": "Human-readable message", "code": "MACHINE_CODE" }
```

### Health check

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  http://localhost:3000/api/bot/v1/health
```

Response:

```json
{ "ok": true, "version": "1" }
```

### Get user availability

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  "http://localhost:3000/api/bot/v1/users/DISCORD_USER_ID/availability?from=2026-05-19T00:00:00.000Z&to=2026-05-26T00:00:00.000Z"
```

Query params `from` and `to` are ISO 8601 datetimes (optional; defaults to current week).

### Replace user availability

`PUT` replaces **all** blocks for that user.

```bash
curl -X PUT -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "blocks": [
      {
        "start": "2026-05-20T18:00:00.000Z",
        "end": "2026-05-20T22:00:00.000Z",
        "label": "Evening"
      }
    ]
  }' \
  http://localhost:3000/api/bot/v1/users/DISCORD_USER_ID/availability
```

### Get user events

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  "http://localhost:3000/api/bot/v1/users/DISCORD_USER_ID/events?from=2026-05-19T00:00:00.000Z&to=2026-06-19T00:00:00.000Z"
```

### Create event (on behalf of user)

```bash
curl -X POST -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "discordId": "CREATOR_DISCORD_ID",
    "title": "Raid night",
    "start": "2026-05-22T20:00:00.000Z",
    "end": "2026-05-22T23:00:00.000Z",
    "description": "Optional notes",
    "participantDiscordIds": ["OTHER_DISCORD_ID"]
  }' \
  http://localhost:3000/api/bot/v1/events
```

Response includes `notifyTargets` — all users with availability overlapping the event window. Your bot should DM/mention each `discordId` in `pingTargets` (subset with linked Discord accounts).

### Who is free at a time (before creating an event)

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  "http://localhost:3000/api/bot/v1/availability/free?start=2026-05-22T20:00:00.000Z&end=2026-05-22T23:00:00.000Z"
```

### Get event details

```bash
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  http://localhost:3000/api/bot/v1/events/EVENT_ID
```

### Add participants to an event

```bash
curl -X POST -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{ "discordIds": ["DISCORD_USER_ID"] }' \
  http://localhost:3000/api/bot/v1/events/EVENT_ID/participants
```

### Event itinerary (plans)

```bash
# Read
curl -H "Authorization: Bearer $BOT_API_SECRET" \
  http://localhost:3000/api/bot/v1/events/EVENT_ID/itinerary

# Replace all plan steps
curl -X PUT -H "Authorization: Bearer $BOT_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "title": "Voice lobby", "notes": "General channel", "sortOrder": 0 },
      { "title": "Run", "startsAt": "2026-05-22T21:00:00.000Z", "sortOrder": 1 }
    ]
  }' \
  http://localhost:3000/api/bot/v1/events/EVENT_ID/itinerary
```

Web itinerary page: `/events/EVENT_ID/plans`

### Error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid bearer token |
| `USER_NOT_LINKED` | 404 | User never signed in on the website |
| `OVERLAP` | 409 | Availability blocks overlap |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `RATE_LIMITED` | 429 | Too many bot requests (120/min per IP) |
| `BOT_API_DISABLED` | 503 | `BOT_API_SECRET` not configured |

---

## User API (session auth)

Used by the web UI; requires an active Discord login session.

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST` | `/api/availability` | List / create blocks |
| `PATCH/DELETE` | `/api/availability/:id` | Update / delete block |
| `GET/POST` | `/api/events` | List / create events (`notifyTargets` on create) |
| `GET` | `/api/events/free-users?start=&end=` | Preview who is free at a time |
| `GET/PATCH` | `/api/events/:id` | Event detail / update (host) |
| `POST/DELETE` | `/api/events/:id/participants` | Add / remove invitees (host) |
| `GET/POST` | `/api/events/:id/itinerary` | List / add plan items |
| `PATCH/DELETE` | `/api/events/:id/itinerary/:itemId` | Edit / remove plan items |
| `PATCH` | `/api/events/:id/participation` | Accept or decline invite |
| `GET/PATCH` | `/api/user/preferences` | Theme & timezone |
| `GET` | `/api/users` | List users for invite picker |

---

## Production notes

1. Change Prisma `provider` to `postgresql` and set `DATABASE_URL`.
2. Set `AUTH_URL` to your production domain.
3. Use a strong `BOT_API_SECRET` and rotate periodically.
4. Deploy to Vercel or similar; run `prisma migrate deploy` on deploy.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply migrations |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright smoke (`e2e/smoke.spec.ts`); first run may need `npx playwright install` |
